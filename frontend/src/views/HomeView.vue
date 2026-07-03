<template>
  <div v-if="homeContent" class="min-h-screen">
    <iframe
      v-if="isHomeContentUrl"
      :src="homeContent.trim()"
      class="h-screen w-full border-0"
      allowfullscreen
    ></iframe>
    <div v-else v-html="homeContent"></div>
  </div>

  <div v-else class="tl-home" :class="{ 'tl-home-dark': isDark }">
    <div class="tl-shell">
      <nav class="tl-nav">
        <router-link class="tl-brand" to="/home" aria-label="Token Life">
          <span class="tl-logo">
            <img :src="siteLogo || '/logo.png'" alt="Token Life" />
          </span>
          <span>{{ siteName }}</span>
        </router-link>

        <div class="tl-actions">
          <div class="tl-lang" role="group" :aria-label="copy.language">
            <button
              type="button"
              :class="{ active: activeLocale === 'zh' }"
              @click="switchLanguage('zh')"
            >
              中文
            </button>
            <button
              type="button"
              :class="{ active: activeLocale === 'en' }"
              @click="switchLanguage('en')"
            >
              EN
            </button>
          </div>

          <button class="tl-icon-button" type="button" :title="themeTitle" @click="toggleTheme">
            <Icon v-if="isDark" name="sun" size="md" />
            <Icon v-else name="moon" size="md" />
          </button>

          <router-link class="tl-login" :to="isAuthenticated ? dashboardPath : '/login'">
            {{ isAuthenticated ? copy.console : copy.login }}
          </router-link>
        </div>
      </nav>

      <main class="tl-hero">
        <section class="tl-left">
          <div class="tl-copy">
            <div class="tl-eyebrow"><i></i><span>API Token Platform</span></div>
            <h1 class="tl-title">
              <template v-if="activeLocale === 'zh'">
                <span>面向生产环境</span>
                <span><em>AI API</em> 接入平台</span>
              </template>
              <template v-else>
                <span>Unified AI API</span>
                <span>access for</span>
                <span><em>production teams.</em></span>
              </template>
            </h1>
            <p class="tl-subtitle">{{ copy.subtitle }}</p>

            <div class="tl-cta">
              <router-link class="tl-primary" :to="isAuthenticated ? dashboardPath : '/login'">
                <span>{{ isAuthenticated ? copy.openConsole : copy.getStarted }}</span>
                <Icon name="arrowRight" size="sm" />
              </router-link>
              <button class="tl-secondary" type="button" @click="showAccessDialog = true">
                {{ copy.accessNote }}
              </button>
            </div>
          </div>
        </section>

        <section class="tl-right" aria-label="Gateway workflow">
          <div class="tl-panel tl-command">
            <div class="tl-command-head">
              <div>
                <b>{{ copy.workflow }}</b>
                <span>{{ copy.workflowMeta }}</span>
              </div>
              <strong>{{ copy.dynamicRouting }}</strong>
            </div>

            <div class="tl-route">
              <article v-for="item in workflowItems" :key="item.key" class="tl-route-row">
                <div class="tl-route-icon" :class="item.className">{{ item.badge }}</div>
                <div>
                  <b>{{ item.title }}</b>
                  <span>{{ item.text }}</span>
                </div>
              </article>
            </div>

            <div class="tl-codebox">
              <div class="tl-codebar">
                <span class="tl-dot tl-red"></span>
                <span class="tl-dot tl-yellow"></span>
                <span class="tl-dot tl-green"></span>
              </div>
              <div class="tl-code">
                <div><span class="accent">POST</span> /v1/chat/completions</div>
                <div><span class="muted">policy:</span> route + meter + record</div>
                <div><span class="ok">200 OK</span> provider=grok latency=812ms</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <section class="tl-lower">
        <div class="tl-stats">
          <div v-for="item in stats" :key="item.value" class="tl-stat">
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </div>
        </div>

        <div class="tl-strip">
          <div class="tl-strip-icon">↗</div>
          <div>
            <b>{{ copy.operationsTitle }}</b>
            <span>{{ copy.operationsText }}</span>
          </div>
        </div>
      </section>

      <section class="tl-reliability">
        <div class="tl-reliable-copy">
          <div>
            <div class="tl-section-kicker">{{ copy.reliableKicker }}</div>
            <h2>{{ copy.reliableTitle }}</h2>
            <p>{{ copy.reliableText }}</p>
          </div>

          <div class="tl-service-line">
            <i>✓</i>
            <div>
              <b>{{ copy.statusTitle }}</b>
              <span>{{ copy.statusText }}</span>
            </div>
          </div>
        </div>

        <div class="tl-reliable-grid">
          <article v-for="item in reliableItems" :key="item.tag" class="tl-reliable-item">
            <span class="tl-reliable-tag">{{ item.tag }}</span>
            <strong>{{ item.title }}</strong>
            <p>{{ item.text }}</p>
          </article>
        </div>
      </section>

      <footer class="tl-footer">© {{ currentYear }} {{ siteName }} · token-life.com</footer>
    </div>

    <div v-if="showAccessDialog" class="tl-gate" role="dialog" aria-modal="true">
      <div class="tl-modal">
        <div class="tl-modal-mark">!</div>
        <h2>{{ copy.dialogTitle }}</h2>
        <p>{{ copy.dialogText }}</p>
        <button class="tl-confirm" type="button" @click="confirmAccess">{{ copy.dialogConfirm }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import Icon from '@/components/icons/Icon.vue'
import { setLocale } from '@/i18n'
import { sanitizeUrl } from '@/utils/url'

type LocaleCode = 'zh' | 'en'

const { locale } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()

const siteName = computed(() => {
  const configured = appStore.cachedPublicSettings?.site_name || appStore.siteName
  return configured && !['Sub2API', 'QuotaAPI'].includes(configured) ? configured : 'Token Life'
})
const siteLogo = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')
const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})

const isDark = ref(document.documentElement.classList.contains('dark'))
const showAccessDialog = ref(false)
const currentYear = computed(() => new Date().getFullYear())

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
const dashboardPath = computed(() => (isAdmin.value ? '/admin/dashboard' : '/dashboard'))

const copyMap = {
  zh: {
    language: '语言切换',
    login: '登录',
    console: '控制台',
    openConsole: '进入控制台',
    getStarted: '开始使用',
    themeDark: '切换为深色',
    themeLight: '切换为浅色',
    subtitle: 'Token Life 提供统一的 AI API 网关，集中管理接入、账号池、调用记录与额度策略。',
    accessNote: '仅向非中国大陆地区用户开放',
    workflow: '网关工作流',
    workflowMeta: '统一接口 · 智能路由 · 请求留痕',
    dynamicRouting: '动态路由',
    clientRequest: '客户端请求',
    clientRequestText: '兼容 OpenAI 协议的请求进入 Token Life 网关。',
    accountRouting: '账号路由',
    accountRoutingText: '系统根据状态与容量策略，选择可用的上游服务账号。',
    trackedResponse: '响应留痕',
    trackedResponseText: '返回响应的同时，记录请求、用量与计费相关数据。',
    unifiedEndpoint: '统一接入端点',
    centralControl: '集中密钥管理',
    traceableRecords: '调用记录可追踪',
    operationsTitle: '面向真实 AI API 运营场景',
    operationsText: '将路由、余额、账号与请求记录集中到一个运维控制台中。',
    reliableKicker: '稳定可靠的 API 服务',
    reliableTitle: '为长期稳定的 API 调用而设计',
    reliableText: 'Token Life 以运营稳定性为核心，提供稳定路由、透明的用量记录、可管理的账号池，以及适合日常 AI 工作负载的可预期访问能力。',
    statusTitle: '状态清晰，降低运维不确定性',
    statusText: '集中展示访问状态、额度与请求活动，降低排查与运维成本。',
    routingTitle: '稳定的请求路由',
    routingText: '请求统一进入网关，由平台按配置转发，减少客户端侧的重复切换与改造。',
    quotaTitle: '透明的用量控制',
    quotaText: '集中查看 API 用量、余额与访问限制，让成本和额度更加透明。',
    keysTitle: '集中式密钥管理',
    keysText: '在统一控制台中管理账号与 API Key，避免分散在本地配置文件中。',
    logsTitle: '可追踪的调用记录',
    logsText: '保留完整请求记录，便于审计、用量核对与日常团队运营。',
    dialogTitle: '访问提示',
    dialogText: '本服务仅向非中国大陆地区用户开放。继续进入即表示你确认当前并非自中国大陆地区访问，并同意遵守所在地法律法规及平台规则。',
    dialogConfirm: '我确认并进入'
  },
  en: {
    language: 'Language switcher',
    login: 'Login',
    console: 'Console',
    openConsole: 'Open Console',
    getStarted: 'Get Started',
    themeDark: 'Switch to dark',
    themeLight: 'Switch to light',
    subtitle: 'Token Life provides a unified gateway for API access, account pools, usage visibility, and quota governance across modern AI providers.',
    accessNote: 'Available outside mainland China only',
    workflow: 'Gateway Workflow',
    workflowMeta: 'Unified endpoint · Smart routing · Traceable requests',
    dynamicRouting: 'Dynamic routing',
    clientRequest: 'Client request',
    clientRequestText: 'An OpenAI-compatible request enters the Token Life gateway.',
    accountRouting: 'Account routing',
    accountRoutingText: 'Routing policies select an available upstream account by status and capacity.',
    trackedResponse: 'Tracked response',
    trackedResponseText: 'The response is returned together with request, usage, and billing records.',
    unifiedEndpoint: 'Unified endpoint',
    centralControl: 'Central control',
    traceableRecords: 'Traceable records',
    operationsTitle: 'Built for real AI API operations',
    operationsText: 'Keep routing, balance, accounts, and request records in one operational console.',
    reliableKicker: 'Stable API Service',
    reliableTitle: 'Designed for stable, long-term API delivery.',
    reliableText: 'Token Life is built for operational reliability: stable routing, transparent usage records, manageable account pools, and predictable access for day-to-day AI workloads.',
    statusTitle: 'Clear status, lower operational risk',
    statusText: 'Keep access status, quotas, and request activity visible in one place.',
    routingTitle: 'Reliable request routing',
    routingText: 'Route requests through configured providers and reduce repeated switching in client applications.',
    quotaTitle: 'Visible usage control',
    quotaText: 'Track API usage, balance, and access limits through a clearer operational view.',
    keysTitle: 'Centralized key management',
    keysText: 'Manage accounts and API keys from one console instead of scattered local configuration files.',
    logsTitle: 'Traceable API records',
    logsText: 'Keep request records available for auditing, reconciliation, and day-to-day team operations.',
    dialogTitle: 'Access notice',
    dialogText: 'This service is available only to users outside mainland China. Continuing means you confirm that you are not accessing from mainland China and agree to follow local laws and platform rules.',
    dialogConfirm: 'Confirm and enter'
  }
} as const

const activeLocale = computed<LocaleCode>(() => (locale.value === 'zh' ? 'zh' : 'en'))
const copy = computed(() => copyMap[activeLocale.value])
const themeTitle = computed(() => (isDark.value ? copy.value.themeLight : copy.value.themeDark))

const workflowItems = computed(() => [
  {
    key: 'in',
    badge: 'IN',
    className: 'tl-r1',
    title: copy.value.clientRequest,
    text: copy.value.clientRequestText
  },
  {
    key: 'rt',
    badge: 'RT',
    className: 'tl-r2',
    title: copy.value.accountRouting,
    text: copy.value.accountRoutingText
  },
  {
    key: 'out',
    badge: 'OUT',
    className: 'tl-r3',
    title: copy.value.trackedResponse,
    text: copy.value.trackedResponseText
  }
])

const stats = computed(() => [
  { value: 'API', label: copy.value.unifiedEndpoint },
  { value: 'Keys', label: copy.value.centralControl },
  { value: 'Logs', label: copy.value.traceableRecords }
])

const reliableItems = computed(() => [
  { tag: 'Routing', title: copy.value.routingTitle, text: copy.value.routingText },
  { tag: 'Quota', title: copy.value.quotaTitle, text: copy.value.quotaText },
  { tag: 'Keys', title: copy.value.keysTitle, text: copy.value.keysText },
  { tag: 'Logs', title: copy.value.logsTitle, text: copy.value.logsText }
])

async function switchLanguage(nextLocale: LocaleCode): Promise<void> {
  if (nextLocale === activeLocale.value) {
    return
  }

  await setLocale(nextLocale)
}

function toggleTheme(): void {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

function initTheme(): void {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  }
}

function confirmAccess(): void {
  showAccessDialog.value = false
  localStorage.setItem('token_life_access_confirmed', '1')
}

onMounted(() => {
  initTheme()
  authStore.checkAuth()

  if (!localStorage.getItem('token_life_access_confirmed')) {
    showAccessDialog.value = true
  }

  if (!appStore.publicSettingsLoaded) {
    appStore.fetchPublicSettings()
  }
})
</script>

<style scoped>
.tl-home {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 4% 0%, rgba(147, 197, 253, 0.34), transparent 28%),
    radial-gradient(circle at 82% 92%, rgba(199, 210, 254, 0.42), transparent 30%),
    linear-gradient(135deg, #eef5ff 0%, #f8fbff 48%, #edf4ff 100%);
  color: #0f172a;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
}

.tl-home::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(rgba(74, 105, 149, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74, 105, 149, 0.045) 1px, transparent 1px),
    linear-gradient(rgba(74, 105, 149, 0.024) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74, 105, 149, 0.024) 1px, transparent 1px);
  background-size: 56px 56px, 56px 56px, 224px 224px, 224px 224px;
  pointer-events: none;
}

.tl-shell {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 100vh;
  width: min(1160px, calc(100% - 44px));
  margin: 0 auto;
  padding: 26px 0 34px;
  flex-direction: column;
}

.tl-nav,
.tl-actions,
.tl-brand,
.tl-login,
.tl-primary,
.tl-secondary,
.tl-icon-button,
.tl-lang,
.tl-command-head,
.tl-cta {
  display: flex;
  align-items: center;
}

.tl-nav {
  justify-content: space-between;
  gap: 18px;
  min-height: 48px;
}

.tl-brand {
  gap: 12px;
  color: #0f172a;
  text-decoration: none;
  font-size: 15px;
  font-weight: 800;
}

.tl-logo {
  display: block;
  width: 42px;
  height: 42px;
  overflow: hidden;
  border-radius: 12px;
  background: #071226;
  box-shadow: 0 12px 24px rgba(47, 102, 208, 0.2);
}

.tl-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.tl-actions {
  gap: 12px;
}

.tl-lang {
  gap: 2px;
  padding: 3px;
  border: 1px solid rgba(111, 140, 181, 0.25);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 8px 24px rgba(52, 80, 122, 0.08);
}

.tl-lang button {
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font-size: 13px;
  font-weight: 750;
  letter-spacing: 0;
  padding: 7px 11px;
}

.tl-lang button.active {
  background: #0f172a;
  color: #fff;
}

.tl-icon-button {
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(111, 140, 181, 0.25);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: #64748b;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(52, 80, 122, 0.08);
}

.tl-login {
  justify-content: center;
  min-height: 38px;
  padding: 0 17px;
  border-radius: 999px;
  background: #0f172a;
  color: #fff;
  font-size: 14px;
  font-weight: 750;
  text-decoration: none;
}

.tl-hero {
  display: grid;
  grid-template-columns: 0.88fr 1.12fr;
  gap: 48px;
  align-items: start;
  padding: 58px 0 24px;
}

.tl-left {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tl-copy {
  padding-top: 24px;
}

.tl-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 24px;
  border: 1px solid rgba(59, 130, 246, 0.22);
  border-radius: 999px;
  background: rgba(239, 246, 255, 0.8);
  color: #2f66d0;
  font-size: 13px;
  font-weight: 750;
  padding: 9px 13px;
}

.tl-eyebrow i {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #2f66d0;
}

.tl-title {
  display: grid;
  gap: 0.08em;
  max-width: 610px;
  margin: 0;
  color: #0f172a;
  font-size: clamp(38px, 4.7vw, 64px);
  font-weight: 820;
  letter-spacing: 0;
  line-height: 1.12;
  text-wrap: balance;
}

.tl-title em {
  color: #2f66d0;
  font-style: normal;
}

.tl-subtitle {
  max-width: 560px;
  margin: 24px 0 0;
  color: #526172;
  font-size: clamp(17px, 1.5vw, 20px);
  font-weight: 430;
  line-height: 1.74;
}

.tl-cta {
  flex-wrap: wrap;
  gap: 13px;
  margin-top: 34px;
}

.tl-primary,
.tl-secondary {
  min-height: 52px;
  border: 0;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 760;
  text-decoration: none;
}

.tl-primary {
  justify-content: center;
  gap: 10px;
  padding: 0 24px;
  background: #2f66d0;
  color: #fff;
  box-shadow: 0 18px 36px rgba(47, 102, 208, 0.24);
}

.tl-secondary {
  justify-content: center;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  padding: 0;
}

.tl-right {
  display: grid;
  width: 100%;
  max-width: 560px;
  justify-self: end;
}

.tl-panel,
.tl-stats,
.tl-strip,
.tl-reliable-copy,
.tl-reliable-grid,
.tl-modal {
  border: 1px solid rgba(111, 140, 181, 0.22);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 22px 60px rgba(52, 80, 122, 0.1);
  backdrop-filter: blur(14px);
}

.tl-panel {
  border-radius: 28px;
}

.tl-command {
  padding: 22px;
  overflow: hidden;
}

.tl-command-head {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.tl-command-head b,
.tl-command-head span {
  display: block;
}

.tl-command-head b {
  color: #0f172a;
  font-size: 15px;
  font-weight: 780;
}

.tl-command-head span {
  margin-top: 5px;
  color: #64748b;
  font-size: 12px;
}

.tl-command-head strong,
.tl-reliable-tag {
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 999px;
  background: rgba(239, 246, 255, 0.84);
  color: #2f66d0;
  font-size: 12px;
  font-weight: 760;
  padding: 7px 10px;
  white-space: nowrap;
}

.tl-route {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 13px;
}

.tl-route-row {
  display: grid;
  gap: 13px;
  border: 1px solid rgba(111, 140, 181, 0.13);
  border-radius: 18px;
  background: rgba(248, 251, 255, 0.82);
  padding: 16px;
}

.tl-route-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 14px;
  color: #fff;
  font-size: 13px;
  font-weight: 780;
}

.tl-r1 { background: #2f66d0; }
.tl-r2 { background: #14b8a6; }
.tl-r3 { background: #f97316; }

.tl-route-row b {
  display: block;
  color: #0f172a;
  font-size: 14px;
  font-weight: 780;
  line-height: 1.35;
}

.tl-route-row span {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.48;
}

.tl-codebox {
  margin-top: 24px;
  overflow: hidden;
  border-radius: 20px;
  background: #0f172a;
}

.tl-codebar {
  display: flex;
  height: 38px;
  align-items: center;
  gap: 7px;
  padding: 0 14px;
  background: #1e293b;
}

.tl-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.tl-red { background: #ef4444; }
.tl-yellow { background: #eab308; }
.tl-green { background: #22c55e; }

.tl-code {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 18px;
  padding: 18px;
  color: #dbeafe;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.85;
  word-break: break-word;
}

.tl-code div:last-child {
  grid-column: 1 / -1;
}

.tl-code .accent { color: #60a5fa; }
.tl-code .ok { color: #5eead4; }
.tl-code .muted { color: #94a3b8; }

.tl-lower {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.58fr);
  gap: 18px;
  align-items: stretch;
  padding: 8px 0 42px;
}

.tl-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  overflow: hidden;
  border-radius: 24px;
}

.tl-stat {
  padding: 26px 24px;
  border-right: 1px solid rgba(111, 140, 181, 0.16);
}

.tl-stat:last-child {
  border-right: 0;
}

.tl-stat strong {
  display: block;
  color: #0f172a;
  font-size: 24px;
  font-weight: 820;
  line-height: 1.12;
}

.tl-stat span,
.tl-strip span,
.tl-reliable-copy p,
.tl-reliable-item p,
.tl-service-line span {
  color: #64748b;
}

.tl-stat span {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.6;
}

.tl-strip {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  border-radius: 24px;
  padding: 18px;
}

.tl-strip-icon,
.tl-service-line i {
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 780;
}

.tl-strip-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: #14b8a6;
  font-size: 18px;
}

.tl-strip b,
.tl-service-line b,
.tl-reliable-item strong {
  display: block;
  color: #0f172a;
  font-weight: 780;
  line-height: 1.35;
}

.tl-strip b,
.tl-service-line b {
  font-size: 15px;
}

.tl-strip span,
.tl-service-line span {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.5;
}

.tl-reliability {
  display: grid;
  grid-template-columns: 0.78fr 1.22fr;
  gap: 20px;
  align-items: stretch;
  padding: 0 0 42px;
}

.tl-reliable-copy,
.tl-reliable-grid {
  border-radius: 28px;
}

.tl-reliable-copy {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
  padding: 28px;
}

.tl-section-kicker {
  margin-bottom: 12px;
  color: #2f66d0;
  font-size: 13px;
  font-weight: 800;
}

.tl-reliable-copy h2 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(26px, 2.65vw, 40px);
  font-weight: 820;
  letter-spacing: 0;
  line-height: 1.12;
}

.tl-reliable-copy p {
  margin: 16px 0 0;
  font-size: 15px;
  line-height: 1.76;
}

.tl-service-line {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding-top: 18px;
  border-top: 1px solid rgba(111, 140, 181, 0.15);
}

.tl-service-line i {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #2f66d0;
  font-style: normal;
}

.tl-reliable-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  padding: 18px;
}

.tl-reliable-item {
  min-height: 142px;
  border: 1px solid rgba(111, 140, 181, 0.13);
  border-radius: 20px;
  background: rgba(248, 251, 255, 0.82);
  padding: 20px;
}

.tl-reliable-item strong {
  font-size: 17px;
}

.tl-reliable-item p {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.68;
}

.tl-reliable-tag {
  display: inline-flex;
  align-items: center;
  margin-bottom: 14px;
}

.tl-footer {
  margin-top: auto;
  padding: 24px 0 0;
  color: #7d8ca1;
  text-align: center;
  font-size: 13px;
}

.tl-gate {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: rgba(15, 23, 42, 0.32);
  padding: 24px;
  backdrop-filter: blur(12px);
}

.tl-modal {
  width: min(420px, 100%);
  border-radius: 24px;
  padding: 28px;
  text-align: center;
}

.tl-modal-mark {
  display: grid;
  width: 48px;
  height: 48px;
  margin: 0 auto 18px;
  place-items: center;
  border-radius: 16px;
  background: #2f66d0;
  color: #fff;
  font-weight: 820;
}

.tl-modal h2 {
  margin: 0;
  color: #0f172a;
  font-size: 22px;
  font-weight: 820;
}

.tl-modal p {
  margin: 14px 0 22px;
  color: #526172;
  font-size: 14px;
  line-height: 1.72;
}

.tl-confirm {
  min-height: 44px;
  width: 100%;
  border: 0;
  border-radius: 14px;
  background: #2f66d0;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 760;
}

.tl-home-dark {
  background:
    radial-gradient(circle at 10% 8%, rgba(34, 211, 238, 0.2), transparent 28%),
    radial-gradient(circle at 84% 86%, rgba(59, 130, 246, 0.18), transparent 30%),
    linear-gradient(135deg, #020617 0%, #0f172a 48%, #111827 100%);
  color: #f8fbff;
}

.tl-home-dark::before {
  background:
    linear-gradient(rgba(125, 211, 252, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(125, 211, 252, 0.055) 1px, transparent 1px),
    linear-gradient(rgba(125, 211, 252, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(125, 211, 252, 0.025) 1px, transparent 1px);
  background-size: 56px 56px, 56px 56px, 224px 224px, 224px 224px;
}

.tl-home-dark .tl-brand,
.tl-home-dark .tl-title,
.tl-home-dark .tl-command-head b,
.tl-home-dark .tl-route-row b,
.tl-home-dark .tl-stat strong,
.tl-home-dark .tl-strip b,
.tl-home-dark .tl-reliable-copy h2,
.tl-home-dark .tl-reliable-item strong,
.tl-home-dark .tl-service-line b,
.tl-home-dark .tl-modal h2 {
  color: #f8fbff;
}

.tl-home-dark .tl-title em,
.tl-home-dark .tl-eyebrow,
.tl-home-dark .tl-section-kicker,
.tl-home-dark .tl-command-head strong,
.tl-home-dark .tl-reliable-tag {
  color: #67e8f9;
}

.tl-home-dark .tl-subtitle,
.tl-home-dark .tl-secondary,
.tl-home-dark .tl-command-head span,
.tl-home-dark .tl-route-row span,
.tl-home-dark .tl-stat span,
.tl-home-dark .tl-strip span,
.tl-home-dark .tl-reliable-copy p,
.tl-home-dark .tl-reliable-item p,
.tl-home-dark .tl-service-line span,
.tl-home-dark .tl-footer,
.tl-home-dark .tl-modal p {
  color: #a8b5c7;
}

.tl-home-dark .tl-lang,
.tl-home-dark .tl-icon-button,
.tl-home-dark .tl-panel,
.tl-home-dark .tl-stats,
.tl-home-dark .tl-strip,
.tl-home-dark .tl-reliable-copy,
.tl-home-dark .tl-reliable-grid,
.tl-home-dark .tl-modal {
  border-color: rgba(125, 211, 252, 0.18);
  background: rgba(15, 23, 42, 0.72);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
}

.tl-home-dark .tl-route-row,
.tl-home-dark .tl-reliable-item {
  border-color: rgba(148, 163, 184, 0.13);
  background: rgba(15, 23, 42, 0.66);
}

.tl-home-dark .tl-lang button,
.tl-home-dark .tl-icon-button {
  color: #a8b5c7;
}

.tl-home-dark .tl-lang button.active,
.tl-home-dark .tl-primary,
.tl-home-dark .tl-login,
.tl-home-dark .tl-confirm {
  background: linear-gradient(135deg, #67e8f9, #22c55e);
  color: #04111f;
}

.tl-home-dark .tl-eyebrow,
.tl-home-dark .tl-command-head strong,
.tl-home-dark .tl-reliable-tag {
  border-color: rgba(103, 232, 249, 0.28);
  background: rgba(8, 47, 73, 0.62);
}

.tl-home-dark .tl-eyebrow i {
  background: #22d3ee;
}

.tl-home-dark .tl-r1,
.tl-home-dark .tl-strip-icon {
  background: linear-gradient(135deg, #06b6d4, #0f766e);
}

.tl-home-dark .tl-r2,
.tl-home-dark .tl-service-line i,
.tl-home-dark .tl-modal-mark {
  background: linear-gradient(135deg, #7c3aed, #2563eb);
}

.tl-home-dark .tl-r3 {
  background: linear-gradient(135deg, #f97316, #be123c);
}

.tl-home-dark .tl-gate {
  background: rgba(2, 6, 23, 0.72);
}

@media (max-width: 980px) {
  .tl-hero,
  .tl-lower,
  .tl-reliability {
    grid-template-columns: 1fr;
  }

  .tl-right {
    max-width: none;
    justify-self: stretch;
  }
}

@media (max-width: 720px) {
  .tl-shell {
    width: min(100% - 28px, 1160px);
    padding-top: 18px;
  }

  .tl-nav {
    align-items: flex-start;
    flex-direction: column;
  }

  .tl-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .tl-login {
    margin-left: auto;
  }

  .tl-hero {
    padding-top: 34px;
  }

  .tl-title {
    font-size: clamp(34px, 11vw, 46px);
  }

  .tl-route,
  .tl-stats,
  .tl-reliable-grid {
    grid-template-columns: 1fr;
  }

  .tl-stat {
    border-right: 0;
    border-bottom: 1px solid rgba(111, 140, 181, 0.16);
  }

  .tl-stat:last-child {
    border-bottom: 0;
  }

  .tl-code {
    grid-template-columns: 1fr;
  }
}
</style>
