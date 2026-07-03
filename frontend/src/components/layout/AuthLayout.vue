<template>
  <div class="template-page-bg relative flex min-h-screen items-center justify-center overflow-hidden p-4">
    <div class="absolute right-6 top-6 z-20 flex items-center gap-2">
      <div class="auth-language-switcher" role="group" :aria-label="authCopy.languageSwitcher">
        <button
          type="button"
          :class="{ active: locale === 'zh' }"
          :disabled="switchingLanguage"
          @click="switchLanguage('zh')"
        >
          中文
        </button>
        <button
          type="button"
          :class="{ active: locale === 'en' }"
          :disabled="switchingLanguage"
          @click="switchLanguage('en')"
        >
          EN
        </button>
      </div>
      <button
        class="auth-circle-button"
        type="button"
        :title="isDark ? authCopy.lightMode : authCopy.darkMode"
        @click="toggleTheme"
      >
        <Icon v-if="isDark" name="sun" size="md" />
        <Icon v-else name="moon" size="md" />
      </button>
    </div>

    <div class="auth-shell relative z-10 grid w-full lg:w-[clamp(72rem,64vw,98rem)] lg:grid-cols-[minmax(30rem,34rem)_minmax(7rem,1fr)_minmax(24rem,25rem)]">
      <section class="hidden min-w-0 flex-col justify-center lg:flex">
        <div class="mb-14 flex items-center gap-3">
          <div class="auth-logo h-12 w-12">
            <img :src="siteLogo || '/logo.png'" alt="Logo" class="h-full w-full object-contain" />
          </div>
          <div>
            <h1 class="text-lg font-bold text-gray-950 dark:text-white">{{ brandName }}</h1>
            <p class="text-xs font-semibold text-blue-600 dark:text-cyan-200">{{ siteSubtitle }}</p>
          </div>
        </div>

        <div class="max-w-xl">
          <p class="mb-5 text-sm font-semibold text-blue-600 dark:text-cyan-300">{{ authCopy.eyebrow }}</p>
          <h2 class="text-5xl font-black tracking-normal text-gray-950 dark:text-white">
            {{ authCopy.title }}
          </h2>
          <p class="mt-5 max-w-lg text-base leading-8 text-slate-600 dark:text-slate-300">
            {{ authCopy.description }}
          </p>

          <div class="mt-7 flex flex-wrap gap-2">
            <span class="auth-pill">Claude · GPT · Gemini · Grok</span>
            <span class="auth-pill">{{ authCopy.compatible }}</span>
            <span class="auth-pill">{{ authCopy.billing }}</span>
          </div>

          <div class="auth-network-card mt-8">
            <div class="flex items-center justify-between border-b border-blue-100/80 px-5 py-4">
              <div>
                <p class="text-xs font-bold text-blue-600 dark:text-cyan-300">{{ authCopy.routingStatus }}</p>
                <p class="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{{ authCopy.routingMeta }}</p>
              </div>
              <span class="auth-status-pill">{{ authCopy.online }}</span>
            </div>
            <div class="auth-network-stage">
              <svg class="auth-network-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <line class="auth-network-line" x1="16" y1="36" x2="43" y2="47" />
                <line class="auth-network-line" x1="17" y1="66" x2="43" y2="55" />
                <line class="auth-network-line" x1="84" y1="36" x2="57" y2="47" />
                <line class="auth-network-line" x1="83" y1="66" x2="57" y2="55" />
              </svg>
              <span class="auth-node auth-node-left auth-node-one">{{ authCopy.claude }}</span>
              <span class="auth-node auth-node-left auth-node-two">{{ authCopy.gemini }}</span>
              <span class="auth-core">{{ brandName }}<small>{{ authCopy.entry }}</small></span>
              <span class="auth-node auth-node-right auth-node-three">{{ authCopy.gpt }}</span>
              <span class="auth-node auth-node-right auth-node-four">{{ authCopy.deepseek }}</span>
            </div>
            <div class="auth-network-stats grid grid-cols-3 border-t border-blue-100/70 bg-white/70 text-sm font-semibold text-slate-800">
              <div class="p-4">{{ authCopy.multiModel }}<p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ authCopy.modelRouting }}</p></div>
              <div class="border-x border-blue-100/70 p-4">{{ authCopy.realtime }}<p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ authCopy.audit }}</p></div>
              <div class="p-4">{{ authCopy.unifiedKey }}<p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ authCopy.entry }}</p></div>
            </div>
          </div>

          <div class="auth-feature-grid mt-5 grid grid-cols-3 text-xs text-slate-500 dark:text-slate-300">
            <div><span class="font-bold text-blue-600 dark:text-cyan-300">{{ authCopy.secureKeys }}</span><br>{{ authCopy.secureKeysText }}</div>
            <div><span class="font-bold text-blue-600 dark:text-cyan-300">{{ authCopy.fastAccess }}</span><br>{{ authCopy.fastAccessText }}</div>
            <div><span class="font-bold text-blue-600 dark:text-cyan-300">{{ authCopy.visibleUsage }}</span><br>{{ authCopy.visibleUsageText }}</div>
          </div>
        </div>
      </section>

      <div class="hidden lg:block" aria-hidden="true"></div>

      <section class="relative flex min-w-0 flex-col items-center justify-center lg:pb-14">
        <div class="mb-6 flex items-center gap-3 lg:hidden">
          <div class="auth-logo h-12 w-12">
            <img :src="siteLogo || '/logo.png'" alt="Logo" class="h-full w-full object-contain" />
          </div>
          <div>
            <h1 class="text-lg font-bold text-gray-950 dark:text-white">{{ brandName }}</h1>
            <p class="text-xs font-semibold text-blue-600 dark:text-cyan-200">{{ siteSubtitle }}</p>
          </div>
        </div>

        <div class="auth-card w-full max-w-[25rem]">
          <slot />
        </div>

        <div class="mt-6 text-center text-sm">
          <slot name="footer" />
        </div>

        <div class="auth-copyright mt-8 text-center text-xs text-gray-400 dark:text-slate-300 lg:absolute lg:bottom-0 lg:left-0 lg:right-0 lg:mt-0">
          &copy; {{ currentYear }} {{ brandName }} · {{ siteDomain }}
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores'
import Icon from '@/components/icons/Icon.vue'
import { setLocale } from '@/i18n'
import { sanitizeUrl } from '@/utils/url'

const appStore = useAppStore()
const { locale } = useI18n()

const brandName = computed(() => {
  const configured = appStore.siteName?.trim()
  return configured && !['Sub2API', 'QuotaAPI'].includes(configured) ? configured : 'Token Life'
})
const siteLogo = computed(() => sanitizeUrl(appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => {
  const configured = appStore.cachedPublicSettings?.site_subtitle?.trim()
  return configured && configured !== 'Subscription to API Conversion Platform'
    ? configured
    : 'API Token Platform'
})
const siteDomain = 'token-life.com'

const currentYear = computed(() => new Date().getFullYear())
const isDark = ref(document.documentElement.classList.contains('dark'))
const switchingLanguage = ref(false)

const copy = {
  zh: {
    eyebrow: '面向生产环境 AI API 接入平台',
    title: '连接主流 AI 模型',
    description: '一个 API Key 接入 Claude、GPT、Gemini 与 Grok，余额、消耗和调用记录集中管理。',
    compatible: 'OpenAI 兼容',
    billing: '余额计费',
    routingStatus: '智能路由运行中',
    routingMeta: '低延迟 · 多模型 · 请求可观测',
    online: '在线',
    claude: 'Claude 长上下文',
    gemini: 'Gemini 多模态',
    gpt: 'GPT 文本与工具',
    deepseek: 'Grok 高性价比',
    entry: '统一入口',
    multiModel: '多模型',
    modelRouting: '模型路由',
    realtime: '实时',
    audit: '请求审计',
    unifiedKey: '统一密钥',
    secureKeys: '安全密钥',
    secureKeysText: '统一管理 API Key',
    fastAccess: '快速接入',
    fastAccessText: '兼容 Base URL',
    visibleUsage: '可见用量',
    visibleUsageText: '记录消耗明细',
    languageSwitcher: '语言切换',
    darkMode: '切换为深色',
    lightMode: '切换为浅色'
  },
  en: {
    eyebrow: 'AI API gateway for developers and teams',
    title: 'Connect leading AI models',
    description: 'Use one API key for Claude, GPT, Gemini, and Grok while managing balance, usage, and request records in one console.',
    compatible: 'OpenAI compatible',
    billing: 'Balance billing',
    routingStatus: 'Smart routing active',
    routingMeta: 'Low latency · Multi-model · Observable requests',
    online: 'Online',
    claude: 'Claude long context',
    gemini: 'Gemini multimodal',
    gpt: 'GPT text and tools',
    deepseek: 'Grok value',
    entry: 'Unified entry',
    multiModel: 'Models',
    modelRouting: 'Model routing',
    realtime: 'Realtime',
    audit: 'Request audit',
    unifiedKey: 'One key',
    secureKeys: 'Secure keys',
    secureKeysText: 'Manage API keys',
    fastAccess: 'Fast access',
    fastAccessText: 'Compatible Base URL',
    visibleUsage: 'Visible usage',
    visibleUsageText: 'Track usage details',
    languageSwitcher: 'Language switcher',
    darkMode: 'Switch to dark',
    lightMode: 'Switch to light'
  }
} as const

const authCopy = computed(() => (locale.value === 'zh' ? copy.zh : copy.en))

async function switchLanguage(nextLocale: 'zh' | 'en'): Promise<void> {
  if (switchingLanguage.value || locale.value === nextLocale) {
    return
  }

  switchingLanguage.value = true
  try {
    await setLocale(nextLocale)
  } finally {
    switchingLanguage.value = false
  }
}

function toggleTheme(): void {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
  appStore.fetchPublicSettings()
})
</script>

<style scoped>
.auth-shell {
  border: 1px solid rgba(111, 140, 181, 0.2);
  border-radius: 2rem;
  background: rgba(248, 251, 255, 0.88);
  box-shadow: 0 30px 90px rgba(52, 80, 122, 0.16);
  padding: clamp(2rem, 4vw, 3.5rem);
  backdrop-filter: blur(18px);
}

.auth-card {
  border: 1px solid rgba(111, 140, 181, 0.25);
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 24px 70px rgba(52, 80, 122, 0.16);
  padding: 2rem;
}

.auth-logo {
  overflow: hidden;
  border-radius: 1rem;
  background: #071226;
  box-shadow: 0 12px 30px rgba(47, 102, 208, 0.22);
}

.auth-circle-button {
  display: inline-flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgba(111, 140, 181, 0.25);
  background: rgba(255, 255, 255, 0.85);
  color: #64748b;
  box-shadow: 0 8px 24px rgba(52, 80, 122, 0.1);
}

.auth-circle-button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.auth-language-switcher {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.1875rem;
  border: 1px solid rgba(111, 140, 181, 0.25);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 8px 24px rgba(52, 80, 122, 0.1);
}

.auth-language-switcher button {
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1;
  padding: 0.5rem 0.7rem;
  transition: background 0.18s ease, color 0.18s ease, opacity 0.18s ease;
}

.auth-language-switcher button.active {
  background: #0f172a;
  color: #fff;
}

.auth-language-switcher button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.auth-pill {
  border: 1px solid rgba(59, 130, 246, 0.28);
  border-radius: 9999px;
  background: rgba(239, 246, 255, 0.8);
  padding: 0.55rem 0.9rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #2f66d0;
}

.auth-status-pill {
  border: 1px solid rgb(191 219 254);
  border-radius: 9999px;
  background: rgb(239 246 255);
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #2563eb;
}

.auth-network-card {
  overflow: hidden;
  border: 1px solid rgba(111, 140, 181, 0.22);
  border-radius: 1.25rem;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 18px 55px rgba(52, 80, 122, 0.13);
}

.auth-network-stage {
  position: relative;
  min-height: 13rem;
  background-image:
    linear-gradient(rgba(74, 105, 149, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74, 105, 149, 0.07) 1px, transparent 1px);
  background-size: 32px 32px;
}

.auth-network-lines {
  position: absolute;
  inset: 0;
  z-index: 1;
  height: 100%;
  width: 100%;
  pointer-events: none;
}

.auth-network-line {
  stroke: rgba(47, 102, 208, 0.28);
  stroke-width: 0.42;
  stroke-linecap: round;
}

.auth-core,
.auth-node {
  position: absolute;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgba(111, 140, 181, 0.28);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 26px rgba(52, 80, 122, 0.12);
  font-size: 0.78rem;
  font-weight: 800;
  color: #334155;
}

.auth-core {
  left: 50%;
  top: 50%;
  height: 4.25rem;
  width: 8.5rem;
  transform: translate(-50%, -50%);
  flex-direction: column;
  background: #0f172a;
  color: #fff;
}

.auth-core small {
  margin-top: 0.2rem;
  font-size: 0.68rem;
  color: #cbd5e1;
}

.auth-node {
  height: 2.15rem;
  padding: 0 1rem;
  gap: 0.38rem;
  max-width: 12.5rem;
  white-space: nowrap;
}

.auth-node::before {
  content: '';
  height: 0.55rem;
  width: 0.55rem;
  flex: 0 0 auto;
  border-radius: 9999px;
  background: var(--auth-node-dot, #60a5fa);
  box-shadow: 0 0 0 0.25rem rgba(96, 165, 250, 0.12);
}

.auth-node-one {
  --auth-node-dot: #f97316;
  left: 1%;
  top: 28%;
}

.auth-node-two {
  --auth-node-dot: #8b5cf6;
  left: 1%;
  bottom: 26%;
}

.auth-node-three {
  --auth-node-dot: #3b82f6;
  right: 1%;
  top: 30%;
}

.auth-node-four {
  --auth-node-dot: #ec4899;
  right: 1%;
  bottom: 25%;
}

.auth-feature-grid {
  width: 100%;
}

.auth-feature-grid > div {
  min-width: 0;
  padding: 0 1rem;
}

</style>
