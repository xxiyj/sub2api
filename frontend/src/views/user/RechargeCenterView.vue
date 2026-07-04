<template>
  <AppLayout>
    <div class="recharge-page mx-auto w-full max-w-6xl">
      <section class="recharge-card">
        <div class="recharge-badge">
          <span class="recharge-dot"></span>
          Token Life
        </div>

        <div class="recharge-columns">
          <div class="recharge-left">
            <h1>{{ t('rechargeCenter.title') }}</h1>
            <p>{{ t('rechargeCenter.description') }}</p>
            <p>{{ t('rechargeCenter.redeemInlineHint') }}</p>

            <div class="balance-strip">
              <div class="balance-icon">
                <Icon name="creditCard" size="md" />
              </div>
              <div>
                <p>{{ t('redeem.currentBalance') }}</p>
                <strong>${{ user?.balance?.toFixed(2) || '0.00' }}</strong>
                <span>
                  {{ t('redeem.concurrency') }}: {{ user?.concurrency || 0 }}
                  {{ t('redeem.requests') }}
                </span>
              </div>
            </div>

            <section class="recharge-info" :aria-label="t('rechargeCenter.infoTitle')">
              <div class="recharge-row">
                <span>{{ t('rechargeCenter.serviceName') }}</span>
                <strong>{{ t('rechargeCenter.serviceValue') }}</strong>
              </div>
              <div class="recharge-row">
                <span>{{ t('rechargeCenter.purchaseMethod') }}</span>
                <strong>{{ t('rechargeCenter.purchaseValue') }}</strong>
              </div>
              <div class="recharge-row">
                <span>{{ t('rechargeCenter.exchangeRate') }}</span>
                <strong>{{ t('rechargeCenter.exchangeValue') }}</strong>
              </div>
            </section>

            <a
              class="recharge-button"
              href="https://catfk.com/shop/token-life"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ t('rechargeCenter.buyButton') }}
            </a>

            <section class="recharge-help">
              <div class="help-icon">
                <Icon name="infoCircle" size="md" />
              </div>
              <div>
                <h2>{{ t('redeem.aboutCodes') }}</h2>
                <ul>
                  <li>{{ t('redeem.codeRule1') }}</li>
                  <li>{{ t('redeem.codeRule2') }}</li>
                  <li>
                    {{ t('redeem.codeRule3') }}
                    <span v-if="contactInfo" class="support-chip">{{ contactInfo }}</span>
                  </li>
                  <li>{{ t('redeem.codeRule4') }}</li>
                </ul>
              </div>
            </section>
          </div>

          <div class="recharge-right">
            <section class="recharge-panel">
              <h2>{{ t('redeem.redeemCodeLabel') }}</h2>
              <form @submit.prevent="handleRedeem" class="space-y-4">
                <div>
                  <div class="relative">
                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Icon name="gift" size="md" class="text-slate-400 dark:text-cyan-200/60" />
                    </div>
                    <input
                      id="code"
                      v-model="redeemCode"
                      type="text"
                      required
                      :placeholder="t('redeem.redeemCodePlaceholder')"
                      :disabled="submitting"
                      class="recharge-input"
                    />
                  </div>
                  <p class="recharge-input-hint">{{ t('redeem.redeemCodeHint') }}</p>
                </div>

                <button type="submit" :disabled="!redeemCode || submitting" class="redeem-button">
                  <svg
                    v-if="submitting"
                    class="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <Icon v-else name="checkCircle" size="sm" />
                  {{ submitting ? t('redeem.redeeming') : t('redeem.redeemButton') }}
                </button>
              </form>
            </section>

            <transition name="fade">
              <div v-if="redeemResult" class="message-card message-success">
                <Icon name="checkCircle" size="md" />
                <div>
                  <h3>{{ t('redeem.redeemSuccess') }}</h3>
                  <p>{{ redeemResult.message }}</p>
                  <p v-if="redeemResult.type === 'balance'">
                    {{ t('redeem.added') }}: ${{ redeemResult.value.toFixed(2) }}
                  </p>
                  <p v-else-if="redeemResult.type === 'concurrency'">
                    {{ t('redeem.added') }}: {{ redeemResult.value }}
                    {{ t('redeem.concurrentRequests') }}
                  </p>
                  <p v-else-if="redeemResult.type === 'subscription'">
                    {{ t('redeem.subscriptionAssigned') }}
                    <span v-if="redeemResult.group_name"> - {{ redeemResult.group_name }}</span>
                    <span v-if="redeemResult.validity_days">
                      ({{ t('redeem.subscriptionDays', { days: redeemResult.validity_days }) }})
                    </span>
                  </p>
                  <p v-if="redeemResult.new_balance !== undefined">
                    {{ t('redeem.newBalance') }}:
                    <strong>${{ redeemResult.new_balance.toFixed(2) }}</strong>
                  </p>
                  <p v-if="redeemResult.new_concurrency !== undefined">
                    {{ t('redeem.newConcurrency') }}:
                    <strong>{{ redeemResult.new_concurrency }} {{ t('redeem.requests') }}</strong>
                  </p>
                </div>
              </div>
            </transition>

            <transition name="fade">
              <div v-if="errorMessage" class="message-card message-error">
                <Icon name="exclamationCircle" size="md" />
                <div>
                  <h3>{{ t('redeem.redeemFailed') }}</h3>
                  <p>{{ errorMessage }}</p>
                </div>
              </div>
            </transition>

            <section class="activity-panel">
              <div class="activity-header">
                <h2>{{ t('redeem.recentActivity') }}</h2>
              </div>

              <div v-if="loadingHistory" class="activity-loading">
                <svg class="h-6 w-6 animate-spin text-cyan-500" fill="none" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>

              <div v-else-if="history.length > 0" class="activity-list">
                <div v-for="item in history" :key="item.id" class="activity-item">
                  <div class="flex min-w-0 items-center gap-3">
                    <div :class="['activity-icon', getHistoryTone(item)]">
                      <Icon
                        v-if="isBalanceType(item.type)"
                        name="dollar"
                        size="sm"
                      />
                      <Icon v-else-if="isSubscriptionType(item.type)" name="badge" size="sm" />
                      <Icon v-else name="bolt" size="sm" />
                    </div>
                    <div class="min-w-0">
                      <p class="activity-title">{{ getHistoryItemTitle(item) }}</p>
                      <p class="activity-time">{{ formatDateTime(item.used_at) }}</p>
                    </div>
                  </div>
                  <div class="activity-value">
                    <p :class="getHistoryValueClass(item)">{{ formatHistoryValue(item) }}</p>
                    <p v-if="!isAdminAdjustment(item.type)">
                      {{ item.code.slice(0, 8) }}...
                    </p>
                    <p v-else>{{ t('redeem.adminAdjustment') }}</p>
                    <p v-if="item.notes" class="activity-note" :title="item.notes">
                      {{ item.notes }}
                    </p>
                  </div>
                </div>
              </div>

              <div v-else class="activity-empty">
                <Icon name="clock" size="xl" />
                <p>{{ t('redeem.historyWillAppear') }}</p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { useSubscriptionStore } from '@/stores/subscriptions'
import { redeemAPI, authAPI, type RedeemHistoryItem } from '@/api'
import AppLayout from '@/components/layout/AppLayout.vue'
import Icon from '@/components/icons/Icon.vue'
import { formatDateTime } from '@/utils/format'

const { t } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()
const subscriptionStore = useSubscriptionStore()

const user = computed(() => authStore.user)
const redeemCode = ref('')
const submitting = ref(false)
const redeemResult = ref<{
  message: string
  type: string
  value: number
  new_balance?: number
  new_concurrency?: number
  group_name?: string
  validity_days?: number
} | null>(null)
const errorMessage = ref('')
const history = ref<RedeemHistoryItem[]>([])
const loadingHistory = ref(false)
const contactInfo = ref('')

const isBalanceType = (type: string) => type === 'balance' || type === 'admin_balance'
const isSubscriptionType = (type: string) => type === 'subscription'
const isAdminAdjustment = (type: string) => type === 'admin_balance' || type === 'admin_concurrency'

const getHistoryItemTitle = (item: RedeemHistoryItem) => {
  if (item.type === 'balance') return t('redeem.balanceAddedRedeem')
  if (item.type === 'admin_balance') {
    return item.value >= 0 ? t('redeem.balanceAddedAdmin') : t('redeem.balanceDeductedAdmin')
  }
  if (item.type === 'concurrency') return t('redeem.concurrencyAddedRedeem')
  if (item.type === 'admin_concurrency') {
    return item.value >= 0 ? t('redeem.concurrencyAddedAdmin') : t('redeem.concurrencyReducedAdmin')
  }
  if (item.type === 'subscription') return t('redeem.subscriptionAssigned')
  return t('common.unknown')
}

const formatHistoryValue = (item: RedeemHistoryItem) => {
  if (isBalanceType(item.type)) {
    const sign = item.value >= 0 ? '+' : ''
    return `${sign}$${item.value.toFixed(2)}`
  }
  if (isSubscriptionType(item.type)) {
    const days = item.validity_days || Math.round(item.value)
    const groupName = item.group?.name || ''
    return groupName ? `${days}${t('redeem.days')} - ${groupName}` : `${days}${t('redeem.days')}`
  }
  const sign = item.value >= 0 ? '+' : ''
  return `${sign}${item.value} ${t('redeem.requests')}`
}

const getHistoryTone = (item: RedeemHistoryItem) => {
  if (isBalanceType(item.type)) return item.value >= 0 ? 'tone-green' : 'tone-red'
  if (isSubscriptionType(item.type)) return 'tone-purple'
  return item.value >= 0 ? 'tone-blue' : 'tone-orange'
}

const getHistoryValueClass = (item: RedeemHistoryItem) => {
  if (isBalanceType(item.type)) return item.value >= 0 ? 'value-green' : 'value-red'
  if (isSubscriptionType(item.type)) return 'value-purple'
  return item.value >= 0 ? 'value-blue' : 'value-orange'
}

const fetchHistory = async () => {
  loadingHistory.value = true
  try {
    history.value = await redeemAPI.getHistory()
  } catch (error) {
    console.error('Failed to fetch history:', error)
  } finally {
    loadingHistory.value = false
  }
}

const handleRedeem = async () => {
  if (!redeemCode.value.trim()) {
    appStore.showError(t('redeem.pleaseEnterCode'))
    return
  }

  submitting.value = true
  errorMessage.value = ''
  redeemResult.value = null

  try {
    const result = await redeemAPI.redeem(redeemCode.value.trim())
    redeemResult.value = result
    await authStore.refreshUser()

    if (result.type === 'subscription') {
      try {
        await subscriptionStore.fetchActiveSubscriptions(true)
      } catch (error) {
        console.error('Failed to refresh subscriptions after redeem:', error)
        appStore.showWarning(t('redeem.subscriptionRefreshFailed'))
      }
    }

    redeemCode.value = ''
    await fetchHistory()
    appStore.showSuccess(t('redeem.codeRedeemSuccess'))
  } catch (error: any) {
    errorMessage.value = error.response?.data?.detail || t('redeem.failedToRedeem')
    appStore.showError(t('redeem.redeemFailed'))
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  fetchHistory()
  try {
    const settings = await authAPI.getPublicSettings()
    contactInfo.value = settings.contact_info || ''
  } catch (error) {
    console.error('Failed to load contact info:', error)
  }
})
</script>

<style scoped>
.recharge-page {
  min-height: calc(100vh - 112px);
  padding: 20px 0 44px;
}

.recharge-card {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(111, 140, 181, 0.2);
  background:
    radial-gradient(circle at 8% 0%, rgba(45, 212, 191, 0.12), transparent 34%),
    radial-gradient(circle at 96% 100%, rgba(59, 130, 246, 0.1), transparent 32%),
    rgba(255, 255, 255, 0.9);
  box-shadow: 0 24px 70px rgba(52, 80, 122, 0.12);
  padding: 34px;
  color: #0f172a;
}

.recharge-columns {
  display: grid;
  grid-template-columns: minmax(300px, 0.86fr) minmax(420px, 1.14fr);
  gap: 48px;
  align-items: start;
}

.recharge-left,
.recharge-right {
  min-width: 0;
}

.recharge-left {
  position: sticky;
  top: 92px;
  padding-top: 62px;
}

.dark .recharge-card {
  border-color: rgba(125, 211, 252, 0.18);
  background:
    radial-gradient(circle at 12% 10%, rgba(34, 211, 238, 0.18), transparent 34%),
    radial-gradient(circle at 84% 92%, rgba(34, 197, 94, 0.12), transparent 30%),
    linear-gradient(145deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.64));
  box-shadow:
    0 24px 70px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.07);
  color: #f8fbff;
}

.recharge-badge {
  position: absolute;
  left: 34px;
  top: 34px;
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  background: rgba(236, 254, 255, 0.9);
  padding: 0 13px;
  color: #0f766e;
  font-size: 13px;
  font-weight: 760;
  margin-bottom: 0;
}

.dark .recharge-badge {
  border: 1px solid rgba(103, 232, 249, 0.28);
  background: rgba(8, 47, 73, 0.62);
  color: #67e8f9;
}

.recharge-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #14b8a6;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.14);
}

.dark .recharge-dot {
  background: #22d3ee;
  box-shadow: 0 0 18px rgba(34, 211, 238, 0.8);
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  color: inherit;
  font-size: 32px;
  line-height: 1.18;
  font-weight: 780;
  letter-spacing: 0;
}

h2 {
  color: inherit;
  font-size: 15px;
  line-height: 1.4;
  font-weight: 760;
}

p {
  color: #5f6f85;
  font-size: 14px;
  line-height: 1.75;
}

.dark p {
  color: #a8b5c7;
}

.balance-strip {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 22px;
  border-radius: 16px;
  border: 1px solid rgba(20, 184, 166, 0.2);
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.14), rgba(37, 99, 235, 0.08));
  padding: 14px;
}

.dark .balance-strip {
  border-color: rgba(103, 232, 249, 0.2);
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(14, 165, 233, 0.12));
}

.balance-icon {
  display: flex;
  height: 40px;
  width: 40px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(20, 184, 166, 0.16);
  color: #0f766e;
}

.dark .balance-icon {
  background: rgba(34, 211, 238, 0.14);
  color: #67e8f9;
}

.balance-strip p {
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}

.dark .balance-strip p {
  color: #a8b5c7;
}

.balance-strip strong {
  display: block;
  color: inherit;
  font-size: 22px;
  line-height: 1.15;
  font-weight: 820;
}

.balance-strip span {
  display: block;
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}

.dark .balance-strip span {
  color: #a8b5c7;
}

.recharge-info,
.recharge-panel,
.activity-panel {
  margin-top: 0;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(248, 250, 252, 0.78);
}

.dark .recharge-info,
.dark .recharge-panel,
.dark .activity-panel {
  border-color: rgba(148, 163, 184, 0.13);
  background: rgba(15, 23, 42, 0.66);
}

.recharge-info {
  margin-top: 20px;
  padding: 18px;
}

.recharge-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  padding: 11px 0;
  font-size: 14px;
}

.recharge-row:first-child {
  padding-top: 0;
}

.recharge-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.recharge-row span {
  color: #64748b;
}

.dark .recharge-row span {
  color: #a8b5c7;
}

.recharge-row strong {
  color: inherit;
  font-weight: 760;
  text-align: right;
}

.recharge-button,
.redeem-button {
  display: inline-flex;
  min-height: 50px;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 14px;
  border: 0;
  background: linear-gradient(135deg, #0f766e, #2563eb);
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.recharge-button {
  margin-top: 24px;
}

.recharge-button:hover,
.redeem-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(37, 99, 235, 0.28);
  text-decoration: none;
}

.redeem-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
  transform: none;
}

.dark .recharge-button,
.dark .redeem-button {
  background: linear-gradient(135deg, #67e8f9, #22c55e);
  color: #04111f;
  box-shadow: 0 0 28px rgba(34, 211, 238, 0.24), 0 18px 36px rgba(0, 0, 0, 0.36);
}

.dark .recharge-button:hover,
.dark .redeem-button:hover {
  box-shadow: 0 0 36px rgba(34, 211, 238, 0.38), 0 22px 44px rgba(0, 0, 0, 0.42);
}

.recharge-panel {
  padding: 22px;
}

.message-card,
.recharge-help,
.activity-panel {
  margin-top: 18px;
}

.recharge-input {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(100, 116, 139, 0.25);
  background: rgba(255, 255, 255, 0.78);
  padding: 13px 16px 13px 48px;
  color: #0f172a;
  font-size: 16px;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.recharge-input:focus {
  border-color: rgba(20, 184, 166, 0.7);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.14);
}

.recharge-input::placeholder {
  color: #94a3b8;
}

.dark .recharge-input {
  border-color: rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.72);
  color: #f8fbff;
}

.dark .recharge-input:focus {
  border-color: rgba(103, 232, 249, 0.65);
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.12);
}

.recharge-input-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
}

.message-card,
.recharge-help {
  display: flex;
  gap: 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  padding: 18px;
}

.message-card h3 {
  color: inherit;
  font-size: 14px;
  font-weight: 760;
}

.message-card p {
  font-size: 13px;
  line-height: 1.65;
}

.message-success {
  border-color: rgba(16, 185, 129, 0.24);
  background: rgba(236, 253, 245, 0.82);
  color: #047857;
}

.dark .message-success {
  border-color: rgba(16, 185, 129, 0.22);
  background: rgba(6, 78, 59, 0.24);
  color: #6ee7b7;
}

.message-error {
  border-color: rgba(248, 113, 113, 0.28);
  background: rgba(254, 242, 242, 0.82);
  color: #b91c1c;
}

.dark .message-error {
  border-color: rgba(248, 113, 113, 0.24);
  background: rgba(127, 29, 29, 0.22);
  color: #fca5a5;
}

.recharge-help {
  border-color: rgba(20, 184, 166, 0.18);
  background: rgba(240, 253, 250, 0.72);
}

.dark .recharge-help {
  border-color: rgba(34, 211, 238, 0.2);
  background: rgba(8, 47, 73, 0.28);
}

.help-icon {
  display: flex;
  height: 38px;
  width: 38px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(20, 184, 166, 0.14);
  color: #0f766e;
}

.dark .help-icon {
  background: rgba(34, 211, 238, 0.12);
  color: #67e8f9;
}

.recharge-help ul {
  margin: 8px 0 0;
  padding-left: 18px;
  color: #0f766e;
  font-size: 13px;
  line-height: 1.8;
}

.dark .recharge-help ul {
  color: #67e8f9;
}

.support-chip {
  margin-left: 6px;
  display: inline-flex;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.14);
  padding: 1px 8px;
  font-size: 12px;
  font-weight: 700;
}

.dark .support-chip {
  background: rgba(34, 211, 238, 0.14);
}

.activity-panel {
  overflow: hidden;
}

.activity-header {
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  padding: 18px 24px;
}

.dark .activity-header {
  border-bottom-color: rgba(148, 163, 184, 0.13);
}

.activity-loading,
.activity-empty {
  display: flex;
  min-height: 120px;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.activity-empty {
  flex-direction: column;
  gap: 10px;
}

.activity-list {
  padding: 20px 24px 24px;
  display: grid;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-radius: 14px;
  background: rgba(241, 245, 249, 0.82);
  padding: 13px 14px;
}

.dark .activity-item {
  background: rgba(30, 41, 59, 0.72);
}

.activity-icon {
  display: flex;
  height: 38px;
  width: 38px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.tone-green {
  background: rgba(16, 185, 129, 0.13);
  color: #059669;
}

.tone-red {
  background: rgba(248, 113, 113, 0.13);
  color: #dc2626;
}

.tone-purple {
  background: rgba(168, 85, 247, 0.13);
  color: #9333ea;
}

.tone-blue {
  background: rgba(59, 130, 246, 0.13);
  color: #2563eb;
}

.tone-orange {
  background: rgba(251, 146, 60, 0.14);
  color: #ea580c;
}

.dark .tone-green {
  color: #34d399;
}

.dark .tone-red {
  color: #f87171;
}

.dark .tone-purple {
  color: #c084fc;
}

.dark .tone-blue {
  color: #60a5fa;
}

.dark .tone-orange {
  color: #fb923c;
}

.activity-title {
  overflow: hidden;
  color: #0f172a;
  font-size: 13px;
  font-weight: 760;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .activity-title {
  color: #f8fbff;
}

.activity-time,
.activity-value p {
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.activity-value {
  min-width: 96px;
  text-align: right;
}

.activity-value .value-green {
  color: #059669;
  font-weight: 800;
}

.activity-value .value-red {
  color: #dc2626;
  font-weight: 800;
}

.activity-value .value-purple {
  color: #9333ea;
  font-weight: 800;
}

.activity-value .value-blue {
  color: #2563eb;
  font-weight: 800;
}

.activity-value .value-orange {
  color: #ea580c;
  font-weight: 800;
}

.dark .activity-value .value-green {
  color: #34d399;
}

.dark .activity-value .value-red {
  color: #f87171;
}

.dark .activity-value .value-purple {
  color: #c084fc;
}

.dark .activity-value .value-blue {
  color: #60a5fa;
}

.dark .activity-value .value-orange {
  color: #fb923c;
}

.activity-note {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recharge-note {
  margin-top: 16px;
}

.recharge-note p {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.65;
}

.dark .recharge-note p {
  color: #a8b5c7;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 1024px) {
  .recharge-card {
    padding: 30px;
  }

  .recharge-columns {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .recharge-left {
    position: static;
    padding-top: 62px;
  }
}

@media (max-width: 760px) {
  .recharge-card {
    padding: 28px 22px;
  }

  .recharge-badge {
    left: 22px;
    top: 28px;
  }
}

@media (max-width: 640px) {
  h1 {
    font-size: 28px;
  }

  .recharge-row {
    display: block;
  }

  .recharge-row strong {
    display: block;
    margin-top: 4px;
    text-align: left;
  }

  .activity-item {
    align-items: flex-start;
  }
}
</style>
