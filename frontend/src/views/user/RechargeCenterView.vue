<template>
  <AppLayout>
    <div class="recharge-page mx-auto w-full max-w-3xl">
      <section class="recharge-card">
        <div class="recharge-badge">
          <span class="recharge-dot"></span>
          Token Life
        </div>

        <div class="space-y-3">
          <h1>{{ t('rechargeCenter.title') }}</h1>
          <p>{{ t('rechargeCenter.description') }}</p>
          <p>
            {{ t('rechargeCenter.redeemPrefix') }}
            <RouterLink to="/redeem">{{ t('rechargeCenter.redeemLink') }}</RouterLink>
            {{ t('rechargeCenter.redeemSuffix') }}
          </p>
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

        <div class="recharge-note">
          <p>{{ t('rechargeCenter.supportHint') }}</p>
          <p>{{ t('rechargeCenter.supportGroup') }}</p>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'

const { t } = useI18n()
</script>

<style scoped>
.recharge-page {
  min-height: calc(100vh - 112px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.recharge-card {
  position: relative;
  width: min(100%, 540px);
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background:
    radial-gradient(circle at 8% 0%, rgba(45, 212, 191, 0.13), transparent 34%),
    radial-gradient(circle at 96% 100%, rgba(59, 130, 246, 0.12), transparent 32%),
    rgba(255, 255, 255, 0.88);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
  padding: 36px;
  color: #0f172a;
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
  margin-bottom: 24px;
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

h1 {
  margin: 0;
  color: inherit;
  font-size: 32px;
  line-height: 1.18;
  font-weight: 780;
  letter-spacing: 0;
}

p {
  margin: 0;
  color: #5f6f85;
  font-size: 15px;
  line-height: 1.75;
}

.dark p {
  color: #a8b5c7;
}

a {
  color: #0f766e;
  font-weight: 720;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.dark a {
  color: #67e8f9;
}

.recharge-info {
  margin-top: 28px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(248, 250, 252, 0.78);
  padding: 18px;
}

.dark .recharge-info {
  border-color: rgba(148, 163, 184, 0.13);
  background: rgba(15, 23, 42, 0.66);
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

.recharge-button {
  margin-top: 28px;
  display: inline-flex;
  min-height: 50px;
  width: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #0f766e, #2563eb);
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.recharge-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(37, 99, 235, 0.28);
  text-decoration: none;
}

.dark .recharge-button {
  background: linear-gradient(135deg, #67e8f9, #22c55e);
  color: #04111f;
  box-shadow: 0 0 28px rgba(34, 211, 238, 0.24), 0 18px 36px rgba(0, 0, 0, 0.36);
}

.dark .recharge-button:hover {
  box-shadow: 0 0 36px rgba(34, 211, 238, 0.38), 0 22px 44px rgba(0, 0, 0, 0.42);
}

.recharge-note {
  margin-top: 18px;
}

.recharge-note p {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.65;
}

.dark .recharge-note p {
  color: #a8b5c7;
}

@media (max-width: 640px) {
  .recharge-page {
    align-items: flex-start;
  }

  .recharge-card {
    padding: 28px 22px;
  }

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
}
</style>
