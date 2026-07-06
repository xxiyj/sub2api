<template>
  <AppLayout>
    <div class="mx-auto w-full max-w-7xl space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">{{ t('imagePlayground.title') }}</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('imagePlayground.description') }}</p>
        </div>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="generating"
          @click="clearResults"
        >
          <Icon name="trash" size="sm" />
          {{ t('imagePlayground.clearResults') }}
        </button>
      </div>

      <div class="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section class="space-y-5 rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-dark-600 dark:bg-dark-800">
          <div class="space-y-2">
            <label class="input-label">{{ t('imagePlayground.apiKey') }}</label>
            <div class="flex gap-2">
              <input
                v-model="apiKey"
                :type="showKey ? 'text' : 'password'"
                class="input"
                :placeholder="t('imagePlayground.apiKeyPlaceholder')"
                autocomplete="off"
              />
              <button type="button" class="btn btn-secondary shrink-0" @click="showKey = !showKey">
                <Icon :name="showKey ? 'eyeOff' : 'eye'" size="sm" />
              </button>
            </div>
            <p class="input-hint">{{ t('imagePlayground.apiKeyHint') }}</p>
          </div>

          <TextArea
            v-model="prompt"
            :label="t('imagePlayground.prompt')"
            :placeholder="t('imagePlayground.promptPlaceholder')"
            :rows="5"
            :disabled="generating"
            required
          />

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <label class="input-label">{{ t('imagePlayground.model') }}</label>
              <Select v-model="model" :options="modelOptions" :disabled="generating" />
            </div>
            <div class="space-y-1.5">
              <label class="input-label">{{ t('imagePlayground.ratioSize') }}</label>
              <Select v-model="ratio" :options="sizeOptions" value-key="ratio" label-key="label" :disabled="generating" />
            </div>
            <div class="space-y-1.5">
              <label class="input-label">{{ t('imagePlayground.quality') }}</label>
              <Select v-model="quality" :options="qualityOptions" :disabled="generating" />
            </div>
            <div class="space-y-1.5">
              <label class="input-label">{{ t('imagePlayground.format') }}</label>
              <Select v-model="format" :options="formatOptions" :disabled="generating" />
            </div>
            <div class="space-y-1.5">
              <label class="input-label">{{ t('imagePlayground.count') }}</label>
              <Select v-model="count" :options="countOptions" :disabled="generating" />
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <label class="input-label">{{ t('imagePlayground.inputImages') }}</label>
              <button
                v-if="inputImages.length"
                type="button"
                class="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                :disabled="generating"
                @click="clearInputImages"
              >
                {{ t('imagePlayground.clearImages') }}
              </button>
            </div>
            <label
              class="flex min-h-[132px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition hover:border-primary-400 hover:bg-primary-50/50 dark:border-dark-500 dark:bg-dark-900 dark:hover:border-primary-500 dark:hover:bg-primary-500/10"
              @paste.prevent="handlePaste"
            >
              <input type="file" class="hidden" accept="image/*" multiple :disabled="generating" @change="handleFileInput" />
              <Icon name="upload" size="lg" class="mb-2 text-gray-400" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ t('imagePlayground.uploadTitle') }}</span>
              <span class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('imagePlayground.uploadHint') }}</span>
            </label>
            <div v-if="inputImages.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div v-for="image in inputImages" :key="image.id" class="group relative overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-700">
                <img :src="image.previewUrl" :alt="image.file.name" class="aspect-square w-full object-cover" />
                <button
                  type="button"
                  class="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                  :disabled="generating"
                  @click="removeInputImage(image.id)"
                >
                  <Icon name="x" size="sm" />
                </button>
                <div class="truncate px-2 py-1 text-xs text-gray-500 dark:text-gray-300">{{ image.file.name }}</div>
              </div>
            </div>
          </div>

          <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {{ errorMessage }}
          </div>

          <button
            type="button"
            class="btn btn-primary w-full justify-center"
            :disabled="generating || !canGenerate"
            @click="generateImage"
          >
            <Icon v-if="generating" name="refresh" size="sm" class="animate-spin" />
            <Icon v-else name="sparkles" size="sm" />
            {{ generating ? t('imagePlayground.generating') : t('imagePlayground.generate') }}
          </button>
        </section>

        <section class="min-h-[520px] rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-dark-600 dark:bg-dark-800">
          <div v-if="generatedImages.length" class="grid gap-4 md:grid-cols-2">
            <article
              v-for="(image, index) in generatedImages"
              :key="`${image.url}-${index}`"
              class="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-dark-600 dark:bg-dark-900"
            >
              <button type="button" class="block w-full" @click="previewImageUrl = image.url">
                <img :src="image.url" :alt="`${t('imagePlayground.result')} ${index + 1}`" class="max-h-[520px] w-full object-contain" />
              </button>
              <div class="flex items-center justify-between gap-3 border-t border-gray-200 px-3 py-2 dark:border-dark-600">
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ image.mimeType || formatLabel }}</span>
                <a class="btn btn-secondary btn-sm" :href="image.url" :download="`sub2api-image-${index + 1}.${format}`">
                  <Icon name="download" size="sm" />
                  {{ t('imagePlayground.download') }}
                </a>
              </div>
            </article>
          </div>
          <div v-else class="flex h-full min-h-[480px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 text-center dark:border-dark-600">
            <Icon name="sparkles" size="xl" class="mb-3 text-gray-400" />
            <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100">{{ t('imagePlayground.emptyTitle') }}</h2>
            <p class="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{{ t('imagePlayground.emptyHint') }}</p>
          </div>
        </section>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="previewImageUrl"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          @click.self="previewImageUrl = ''"
        >
          <button class="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white" @click="previewImageUrl = ''">
            <Icon name="x" size="lg" />
          </button>
          <img :src="previewImageUrl" alt="preview" class="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl" />
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import Select from '@/components/common/Select.vue'
import TextArea from '@/components/common/TextArea.vue'
import Icon from '@/components/icons/Icon.vue'
import { buildGatewayUrl } from '@/api/client'
import {
  IMAGE_PLAYGROUND_COUNT_OPTIONS,
  IMAGE_PLAYGROUND_FORMAT_OPTIONS,
  IMAGE_PLAYGROUND_MODELS,
  IMAGE_PLAYGROUND_QUALITY_OPTIONS,
  IMAGE_PLAYGROUND_SIZE_OPTIONS,
  appendImageGenerationFormData,
  buildImageGenerationRequest,
  extractGeneratedImages,
  loadImagePlaygroundSettings,
  saveImagePlaygroundSettings,
  type GeneratedImage,
  type ImagePlaygroundFormat,
  type ImagePlaygroundModel,
  type ImagePlaygroundQuality,
  type ImagePlaygroundRatio,
} from '@/utils/imagePlayground'

interface InputImage {
  id: string
  file: File
  previewUrl: string
}

const { t } = useI18n()

const apiKey = ref('')
const showKey = ref(false)
const prompt = ref('')
const model = ref<ImagePlaygroundModel>('gpt-image-2')
const ratio = ref<ImagePlaygroundRatio>('1:1')
const quality = ref<ImagePlaygroundQuality>('medium')
const format = ref<ImagePlaygroundFormat>('png')
const count = ref(1)
const generating = ref(false)
const errorMessage = ref('')
const inputImages = ref<InputImage[]>([])
const generatedImages = ref<GeneratedImage[]>([])
const previewImageUrl = ref('')

const modelOptions = computed(() => IMAGE_PLAYGROUND_MODELS.map((option) => ({ ...option })))
const sizeOptions = computed(() => IMAGE_PLAYGROUND_SIZE_OPTIONS.map((option) => ({ ...option })))
const qualityOptions = computed(() => IMAGE_PLAYGROUND_QUALITY_OPTIONS.map((option) => ({
  ...option,
  label: t(`imagePlayground.qualityOptions.${option.value}`),
})))
const formatOptions = computed(() => IMAGE_PLAYGROUND_FORMAT_OPTIONS.map((option) => ({ ...option })))
const countOptions = computed(() => IMAGE_PLAYGROUND_COUNT_OPTIONS.map((option) => ({
  ...option,
  label: t('imagePlayground.countOption', { count: option.value }),
})))
const canGenerate = computed(() => apiKey.value.trim() && prompt.value.trim())
const formatLabel = computed(() => format.value.toUpperCase())

onMounted(() => {
  const settings = loadImagePlaygroundSettings()
  apiKey.value = settings.apiKey
  model.value = settings.model
  ratio.value = settings.ratio
  quality.value = settings.quality
  format.value = settings.format
  count.value = settings.count
})

function persistSettings() {
  saveImagePlaygroundSettings({
    apiKey: apiKey.value.trim(),
    model: model.value,
    ratio: ratio.value,
    quality: quality.value,
    format: format.value,
    count: count.value,
  })
}

function fileToPreview(file: File): Promise<InputImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: String(reader.result || ''),
      })
    }
    reader.onerror = () => reject(new Error(t('imagePlayground.readFileFailed')))
    reader.readAsDataURL(file)
  })
}

async function addFiles(files: File[]) {
  const images = files.filter((file) => file.type.startsWith('image/'))
  if (!images.length) return
  const next = await Promise.all(images.map(fileToPreview))
  inputImages.value = [...inputImages.value, ...next].slice(0, 4)
}

function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement
  void addFiles(Array.from(input.files || []))
  input.value = ''
}

function handlePaste(event: ClipboardEvent) {
  const files = Array.from(event.clipboardData?.files || [])
  void addFiles(files)
}

function removeInputImage(id: string) {
  inputImages.value = inputImages.value.filter((image) => image.id !== id)
}

function clearInputImages() {
  inputImages.value = []
}

function clearResults() {
  generatedImages.value = []
  errorMessage.value = ''
}

async function parseError(response: Response): Promise<string> {
  const text = await response.text()
  if (!text) return `HTTP ${response.status}`
  try {
    const data = JSON.parse(text) as { error?: { message?: string }, message?: string, detail?: string }
    return data.error?.message || data.message || data.detail || text
  } catch {
    return text
  }
}

async function generateImage() {
  if (!canGenerate.value || generating.value) return
  generating.value = true
  errorMessage.value = ''
  persistSettings()

  try {
    const input = {
      apiKey: apiKey.value.trim(),
      model: model.value,
      ratio: ratio.value,
      quality: quality.value,
      format: format.value,
      count: count.value,
      prompt: prompt.value,
      imageDataUrls: inputImages.value.map((image) => image.previewUrl),
    }
    const hasInputImages = inputImages.value.length > 0
    const response = hasInputImages
      ? await submitEditRequest(input)
      : await submitGenerationRequest(input)

    const images = extractGeneratedImages(response)
    if (!images.length) {
      throw new Error(t('imagePlayground.noImagesReturned'))
    }
    generatedImages.value = images
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('common.error')
  } finally {
    generating.value = false
  }
}

async function submitGenerationRequest(input: Parameters<typeof buildImageGenerationRequest>[0]): Promise<unknown> {
  const response = await fetch(buildGatewayUrl('/v1/images/generations'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildImageGenerationRequest(input)),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}

async function submitEditRequest(input: Parameters<typeof buildImageGenerationRequest>[0]): Promise<unknown> {
  const formData = new FormData()
  appendImageGenerationFormData(formData, input, inputImages.value.map((image) => image.file))
  const response = await fetch(buildGatewayUrl('/v1/images/edits'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: formData,
  })
  if (!response.ok) throw new Error(await parseError(response))
  return response.json()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
