<template>
  <AppLayout>
    <div class="mx-auto w-full max-w-7xl space-y-6" @paste="handlePaste">
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
              <label class="input-label">{{ t('imagePlayground.resolution') }}</label>
              <Select v-model="resolution" :options="resolutionOptions" :disabled="generating" />
            </div>
            <div class="space-y-1.5">
              <label class="input-label">{{ t('imagePlayground.ratio') }}</label>
              <Select v-model="ratio" :options="ratioOptions" :disabled="generating" />
            </div>
            <div class="space-y-1.5">
              <label class="input-label">{{ t('imagePlayground.size') }}</label>
              <input
                v-model="size"
                class="input"
                :disabled="generating || resolution !== 'custom'"
                :placeholder="t('imagePlayground.sizePlaceholder')"
              />
              <p v-if="resolution !== 'custom'" class="input-hint">{{ t('imagePlayground.sizeAutoHint') }}</p>
              <p v-else-if="sizeErrorMessage" class="text-xs text-red-600 dark:text-red-400">{{ sizeErrorMessage }}</p>
              <p v-else class="input-hint">{{ t('imagePlayground.sizeCustomHint') }}</p>
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
          <div v-if="generating" class="flex h-full min-h-[480px] flex-col items-center justify-center rounded-lg border border-dashed border-primary-300 bg-primary-50/50 text-center dark:border-primary-500/40 dark:bg-primary-500/10">
            <Icon name="refresh" size="xl" class="mb-3 animate-spin text-primary-500" />
            <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">{{ t('imagePlayground.generatingWithSeconds', { seconds: elapsedSeconds }) }}</h2>
            <p class="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{{ t('imagePlayground.generatingHint') }}</p>
          </div>
          <div v-else-if="generatedImages.length" :class="generatedImages.length === 1 ? 'grid gap-4' : 'grid gap-4 md:grid-cols-2'">
            <article
              v-for="(image, index) in generatedImages"
              :key="`${image.url}-${index}`"
              class="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-dark-600 dark:bg-dark-900"
            >
              <button type="button" class="block w-full" @click="previewImageUrl = image.url">
                <img
                  :src="image.url"
                  :alt="`${t('imagePlayground.result')} ${index + 1}`"
                  :class="generatedImages.length === 1 ? 'max-h-[68vh] min-h-[460px] w-full object-contain' : 'max-h-[520px] w-full object-contain'"
                />
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

      <section class="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-dark-600 dark:bg-dark-800">
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('imagePlayground.historyTitle') }}</h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ t('imagePlayground.historyHint') }}</p>
          </div>
          <button
            v-if="historyRecords.length"
            type="button"
            class="btn btn-secondary"
            :disabled="generating"
            @click="clearHistory"
          >
            <Icon name="trash" size="sm" />
            {{ t('imagePlayground.clearHistory') }}
          </button>
        </div>
        <div v-if="historyRecords.length" class="space-y-4">
          <article
            v-for="record in historyRecords"
            :key="record.id"
            class="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-600 dark:bg-dark-900"
          >
            <div class="mb-3 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ record.prompt }}</p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ formatHistoryTime(record.createdAt) }} · {{ record.model }} · {{ record.resolution }} · {{ record.ratio }} · {{ record.size }} · {{ record.quality.toUpperCase() }} · {{ record.format.toUpperCase() }}
                </p>
              </div>
              <span v-if="record.usedInputImages" class="shrink-0 rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700 dark:bg-primary-500/20 dark:text-primary-200">
                {{ t('imagePlayground.usedInputImages') }}
              </span>
            </div>
            <div v-if="record.images.length" class="flex flex-wrap gap-3">
              <div
                v-for="(image, index) in record.images"
                :key="`${record.id}-${index}`"
                class="w-[150px] overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-800"
              >
                <button type="button" class="block w-full" @click="previewImageUrl = image.url">
                  <img :src="image.url" :alt="`${t('imagePlayground.historyImage')} ${index + 1}`" class="h-[112px] w-full object-cover" />
                </button>
                <div class="flex items-center justify-between gap-2 border-t border-gray-200 px-2 py-1.5 dark:border-dark-600">
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ image.mimeType || record.format.toUpperCase() }}</span>
                  <a class="btn btn-secondary btn-sm" :href="image.url" :download="`sub2api-history-${record.id}-${index + 1}.${record.format}`">
                    <Icon name="download" size="sm" />
                  </a>
                </div>
              </div>
            </div>
            <div v-else class="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500 dark:border-dark-600 dark:text-gray-400">
              {{ t('imagePlayground.historyImagesOmitted') }}
            </div>
          </article>
        </div>
        <div v-else class="rounded-lg border border-dashed border-gray-300 py-8 text-center dark:border-dark-600">
          <Icon name="grid" size="lg" class="mx-auto mb-2 text-gray-400" />
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('imagePlayground.historyEmpty') }}</p>
        </div>
      </section>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
  IMAGE_PLAYGROUND_RATIO_OPTIONS,
  IMAGE_PLAYGROUND_RESOLUTION_OPTIONS,
  appendImageGenerationFormData,
  buildImageGenerationRequest,
  clearImagePlaygroundHistory,
  deleteImagePlaygroundHistoryBlobs,
  extractGeneratedImages,
  extractImageFilesFromClipboard,
  hydrateImagePlaygroundHistory,
  loadImagePlaygroundHistory,
  loadImagePlaygroundSettings,
  prepareImagePlaygroundHistoryRecordImages,
  prependImagePlaygroundHistoryRecord,
  resolveImagePlaygroundSize,
  saveImagePlaygroundSettings,
  validateImagePlaygroundSize,
  type GeneratedImage,
  type ImagePlaygroundFormat,
  type ImagePlaygroundHistoryRecord,
  type ImagePlaygroundModel,
  type ImagePlaygroundQuality,
  type ImagePlaygroundRatio,
  type ImagePlaygroundResolution,
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
const resolution = ref<ImagePlaygroundResolution>('1K')
const ratio = ref<ImagePlaygroundRatio>('1:1')
const size = ref('1024x1024')
const quality = ref<ImagePlaygroundQuality>('medium')
const format = ref<ImagePlaygroundFormat>('png')
const count = ref(1)
const generating = ref(false)
const elapsedSeconds = ref(0)
const errorMessage = ref('')
const inputImages = ref<InputImage[]>([])
const generatedImages = ref<GeneratedImage[]>([])
const historyRecords = ref<ImagePlaygroundHistoryRecord[]>([])
const previewImageUrl = ref('')
let elapsedTimer: ReturnType<typeof setInterval> | null = null

const modelOptions = computed(() => IMAGE_PLAYGROUND_MODELS.map((option) => ({ ...option })))
const resolutionOptions = computed(() => IMAGE_PLAYGROUND_RESOLUTION_OPTIONS.map((option) => ({
  ...option,
  label: t(`imagePlayground.resolutionOptions.${option.value}`),
})))
const ratioOptions = computed(() => IMAGE_PLAYGROUND_RATIO_OPTIONS.map((option) => ({
  ...option,
  label: option.value === 'auto' ? t('imagePlayground.ratioOptions.auto') : option.label,
})))
const qualityOptions = computed(() => IMAGE_PLAYGROUND_QUALITY_OPTIONS.map((option) => ({
  ...option,
  label: t(`imagePlayground.qualityOptions.${option.value}`),
})))
const formatOptions = computed(() => IMAGE_PLAYGROUND_FORMAT_OPTIONS.map((option) => ({ ...option })))
const countOptions = computed(() => IMAGE_PLAYGROUND_COUNT_OPTIONS.map((option) => ({
  ...option,
  label: t('imagePlayground.countOption', { count: option.value }),
})))
const sizeValidation = computed(() => validateImagePlaygroundSize(size.value))
const sizeErrorMessage = computed(() => {
  if (sizeValidation.value.valid) return ''
  return t(`imagePlayground.sizeErrors.${sizeValidation.value.reason}`)
})
const canGenerate = computed(() => apiKey.value.trim() && prompt.value.trim() && sizeValidation.value.valid)
const formatLabel = computed(() => format.value.toUpperCase())

onMounted(() => {
  const settings = loadImagePlaygroundSettings()
  apiKey.value = settings.apiKey
  model.value = settings.model
  resolution.value = settings.resolution
  ratio.value = settings.ratio
  size.value = settings.size
  quality.value = settings.quality
  format.value = settings.format
  count.value = settings.count
  void loadHistoryRecords()
})

onBeforeUnmount(() => {
  stopGenerationTimer()
})

watch([resolution, ratio], () => {
  if (resolution.value !== 'custom') {
    size.value = resolveImagePlaygroundSize(resolution.value, ratio.value)
  }
})

function persistSettings() {
  saveImagePlaygroundSettings({
    apiKey: apiKey.value.trim(),
    model: model.value,
    resolution: resolution.value,
    ratio: ratio.value,
    size: size.value,
    quality: quality.value,
    format: format.value,
    count: count.value,
  })
}

function startGenerationTimer() {
  stopGenerationTimer()
  elapsedSeconds.value = 0
  elapsedTimer = setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)
}

function stopGenerationTimer() {
  if (elapsedTimer) {
    clearInterval(elapsedTimer)
    elapsedTimer = null
  }
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
  const imageFiles = extractImageFilesFromClipboard(event)
  if (!imageFiles.length) return
  event.preventDefault()
  if (generating.value) return
  void addFiles(imageFiles)
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
  stopGenerationTimer()
  elapsedSeconds.value = 0
}

async function loadHistoryRecords() {
  const records = loadImagePlaygroundHistory()
  try {
    historyRecords.value = await hydrateImagePlaygroundHistory(records)
  } catch {
    historyRecords.value = records
  }
}

async function clearHistory() {
  const records = loadImagePlaygroundHistory()
  try {
    await deleteImagePlaygroundHistoryBlobs(records)
  } catch {
    // Keep clearing metadata even if one stale blob cannot be removed.
  }
  clearImagePlaygroundHistory()
  historyRecords.value = []
}

function formatHistoryTime(value: string) {
  return new Date(value).toLocaleString()
}

function createHistoryRecord(images: GeneratedImage[], usedInputImages: boolean): ImagePlaygroundHistoryRecord {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    prompt: prompt.value.trim(),
    model: model.value,
    resolution: resolution.value,
    ratio: ratio.value,
    size: size.value.trim().toLowerCase(),
    quality: quality.value,
    format: format.value,
    count: count.value,
    usedInputImages,
    images,
  }
}

async function saveSuccessfulGenerationToHistory(images: GeneratedImage[], usedInputImages: boolean) {
  try {
    const preparedRecord = await prepareImagePlaygroundHistoryRecordImages(createHistoryRecord(images, usedInputImages))
    prependImagePlaygroundHistoryRecord(preparedRecord)
    await loadHistoryRecords()
  } catch {
    errorMessage.value = t('imagePlayground.historySaveFailed')
  }
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
  startGenerationTimer()
  persistSettings()

  try {
    const input = {
      apiKey: apiKey.value.trim(),
      model: model.value,
      resolution: resolution.value,
      ratio: ratio.value,
      size: size.value.trim().toLowerCase(),
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
    await saveSuccessfulGenerationToHistory(images, hasInputImages)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('common.error')
  } finally {
    generating.value = false
    stopGenerationTimer()
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
