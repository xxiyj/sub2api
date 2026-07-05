<template>
  <AppLayout>
    <MonitorHero
      :overall-status="overallStatus"
      :interval-seconds="DEFAULT_INTERVAL_SECONDS"
      :window="currentWindow"
      :loading="loading"
      :auto-refresh="autoRefresh"
      @update:window="handleWindowChange"
      @refresh="manualReload"
    />

    <MonitorCardGrid
      v-if="loading && items.length === 0 || groupedMonitorSections.length === 0"
      :items="[]"
      :window="currentWindow"
      :countdown-seconds="countdown"
      :loading="loading"
      :detail-cache="detailCache"
      @card-click="openDetail"
    />

    <div v-else class="space-y-8">
      <section
        v-for="section in groupedMonitorSections"
        :key="section.key"
        class="space-y-3"
      >
        <div class="flex items-center gap-3">
          <span
            class="h-2.5 w-2.5 rounded-full"
            :class="section.dotClass"
          ></span>
          <h2 class="text-sm font-bold uppercase tracking-[0.16em] text-gray-600 dark:text-gray-300">
            {{ section.label }}
          </h2>
          <span class="h-px flex-1 bg-gray-200/80 dark:bg-dark-700/70"></span>
          <span class="text-xs font-semibold text-gray-400 dark:text-gray-500">
            {{ section.items.length }}
          </span>
        </div>

        <MonitorCardGrid
          :items="section.items"
          :window="currentWindow"
          :countdown-seconds="countdown"
          :loading="loading"
          :detail-cache="detailCache"
          @card-click="openDetail"
        />
      </section>
    </div>

    <MonitorDetailDialog
      :show="showDetail"
      :monitor-id="detailTarget?.id ?? null"
      :title="detailTitle"
      @close="closeDetail"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { extractApiErrorMessage } from '@/utils/apiError'
import {
  list as listChannelMonitorViews,
  status as fetchChannelMonitorDetail,
  type UserMonitorView,
  type UserMonitorDetail,
} from '@/api/channelMonitor'
import AppLayout from '@/components/layout/AppLayout.vue'
import MonitorHero, {
  type MonitorWindow,
  type OverallStatus,
} from '@/components/user/monitor/MonitorHero.vue'
import MonitorCardGrid from '@/components/user/monitor/MonitorCardGrid.vue'
import MonitorDetailDialog from '@/components/user/MonitorDetailDialog.vue'
import { DEFAULT_INTERVAL_SECONDS, STATUS_OPERATIONAL } from '@/constants/channelMonitor'
import { useAutoRefresh } from '@/composables/useAutoRefresh'

const { t } = useI18n()
const appStore = useAppStore()

// ── State ──
const items = ref<UserMonitorView[]>([])
const loading = ref(false)
const currentWindow = ref<MonitorWindow>('7d')
const detailCache = reactive<Record<number, UserMonitorDetail>>({})
const showDetail = ref(false)
const detailTarget = ref<UserMonitorView | null>(null)

let abortController: AbortController | null = null

const autoRefresh = useAutoRefresh({
  storageKey: 'channel-status-auto-refresh',
  intervals: [30, 60, 120] as const,
  defaultInterval: DEFAULT_INTERVAL_SECONDS,
  onRefresh: () => reload(true),
  shouldPause: () => document.hidden || loading.value,
})
const countdown = autoRefresh.countdown

// ── Computed ──
const overallStatus = computed<OverallStatus>(() => {
  if (items.value.length === 0) return 'operational'
  for (const it of items.value) {
    if (it.primary_status === 'failed' || it.primary_status === 'error') return 'degraded'
    if (it.primary_status !== STATUS_OPERATIONAL) return 'degraded'
  }
  return 'operational'
})

const detailTitle = computed(() => {
  return detailTarget.value?.name || t('channelStatus.detailTitle')
})

type MonitorProviderGroup = 'anthropic' | 'openai' | 'other'

interface MonitorSection {
  key: MonitorProviderGroup
  label: string
  dotClass: string
  items: UserMonitorView[]
}

const groupOrder: MonitorProviderGroup[] = ['anthropic', 'openai', 'other']

const groupDotClass: Record<MonitorProviderGroup, string> = {
  anthropic: 'bg-orange-500 shadow-sm shadow-orange-500/30',
  openai: 'bg-emerald-500 shadow-sm shadow-emerald-500/30',
  other: 'bg-sky-500 shadow-sm shadow-sky-500/30',
}

const groupedMonitorSections = computed<MonitorSection[]>(() => {
  const buckets: Record<MonitorProviderGroup, UserMonitorView[]> = {
    anthropic: [],
    openai: [],
    other: [],
  }

  for (const item of items.value) {
    buckets[resolveProviderGroup(item)].push(item)
  }

  return groupOrder
    .map(key => ({
      key,
      label: t(`channelStatus.providerGroups.${key}`),
      dotClass: groupDotClass[key],
      items: sortByNameMultiplier(buckets[key]),
    }))
    .filter(section => section.items.length > 0)
})

function resolveProviderGroup(item: UserMonitorView): MonitorProviderGroup {
  const provider = String(item.provider || '').trim().toLowerCase()
  const text = `${provider} ${item.name || ''} ${item.primary_model || ''}`.toLowerCase()
  if (text.includes('anthropic') || text.includes('claude')) return 'anthropic'
  if (text.includes('openai') || text.includes('open ai') || text.includes('gpt')) return 'openai'
  return 'other'
}

function extractNameMultiplier(name: string): number {
  const match = String(name || '').match(/(\d+(?:\.\d+)?)\s*x\b/i)
  return match ? Number.parseFloat(match[1]) : Number.POSITIVE_INFINITY
}

function sortByNameMultiplier(list: UserMonitorView[]): UserMonitorView[] {
  return [...list].sort((a, b) => {
    const multiplierA = extractNameMultiplier(a.name)
    const multiplierB = extractNameMultiplier(b.name)
    if (multiplierA !== multiplierB) return multiplierA - multiplierB
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  })
}

// ── Loaders ──
async function reload(silent = false) {
  if (abortController) abortController.abort()
  const ctrl = new AbortController()
  abortController = ctrl
  if (!silent) loading.value = true
  try {
    const res = await listChannelMonitorViews({ signal: ctrl.signal })
    if (ctrl.signal.aborted || abortController !== ctrl) return
    items.value = res.items || []
  } catch (err: unknown) {
    const e = err as { name?: string; code?: string }
    if (e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') return
    appStore.showError(extractApiErrorMessage(err, t('channelStatus.loadError')))
  } finally {
    if (abortController === ctrl) {
      if (!silent) loading.value = false
      countdown.value = DEFAULT_INTERVAL_SECONDS
      abortController = null
    }
  }
}

async function manualReload() {
  await reload(false)
  // After base reload, refresh any cached detail records so non-7d availability
  // values stay in sync without forcing the user to switch tabs again.
  if (currentWindow.value !== '7d') {
    await Promise.all(items.value.map(it => loadDetail(it.id, true)))
  }
}

async function loadDetail(id: number, force = false) {
  if (!force && detailCache[id]) return
  try {
    detailCache[id] = await fetchChannelMonitorDetail(id)
  } catch (err: unknown) {
    appStore.showError(extractApiErrorMessage(err, t('channelStatus.detailLoadError')))
  }
}

async function ensureDetailsForWindow() {
  if (currentWindow.value === '7d') return
  await Promise.all(items.value.map(it => loadDetail(it.id)))
}

// ── Handlers ──
async function handleWindowChange(value: MonitorWindow) {
  currentWindow.value = value
  await ensureDetailsForWindow()
}

function openDetail(row: UserMonitorView) {
  detailTarget.value = row
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  detailTarget.value = null
}

watch(items, () => {
  void ensureDetailsForWindow()
})

watch(
  () => appStore.cachedPublicSettings?.channel_monitor_enabled,
  (enabled) => {
    if (enabled === false) autoRefresh.stop()
    else if (autoRefresh.enabled.value) autoRefresh.start()
  },
)

onMounted(() => {
  void reload(false)
  if (appStore.cachedPublicSettings?.channel_monitor_enabled !== false) {
    autoRefresh.setEnabled(true)
  }
})

onBeforeUnmount(() => {
  if (abortController) abortController.abort()
})
</script>
