export const IMAGE_PLAYGROUND_STORAGE_KEY = 'sub2api_image_playground_settings'
export const IMAGE_PLAYGROUND_HISTORY_STORAGE_KEY = 'sub2api_image_playground_history'
export const IMAGE_PLAYGROUND_HISTORY_LIMIT = 20
export const IMAGE_PLAYGROUND_BLOB_DB_NAME = 'sub2api_image_playground'
export const IMAGE_PLAYGROUND_BLOB_STORE_NAME = 'generated_images'
export const IMAGE_PLAYGROUND_BLOB_URL_PREFIX = 'indexeddb:'

export const IMAGE_PLAYGROUND_MODELS = [
  { value: 'gpt-image-2', label: 'gpt-image-2' },
] as const

export const IMAGE_PLAYGROUND_RESOLUTION_OPTIONS = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
  { value: 'custom', label: '自定义' },
] as const

export const IMAGE_PLAYGROUND_RATIO_OPTIONS = [
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
  { value: '3:2', label: '3:2' },
  { value: '2:3', label: '2:3' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '21:9', label: '21:9' },
  { value: 'auto', label: '自动' },
] as const

const IMAGE_PLAYGROUND_SIZE_PRESETS = {
  '1K': {
    '1:1': '1024x1024',
    '4:3': '1024x768',
    '3:4': '768x1024',
    '3:2': '1536x1024',
    '2:3': '1024x1536',
    '16:9': '1536x864',
    '9:16': '864x1536',
    '21:9': '1536x656',
    auto: 'auto',
  },
  '2K': {
    '1:1': '2048x2048',
    '4:3': '2048x1536',
    '3:4': '1536x2048',
    '3:2': '2048x1360',
    '2:3': '1360x2048',
    '16:9': '2048x1152',
    '9:16': '1152x2048',
    '21:9': '2048x880',
    auto: 'auto',
  },
  '4K': {
    '1:1': '2880x2880',
    '4:3': '3072x2304',
    '3:4': '2304x3072',
    '3:2': '3136x2096',
    '2:3': '2096x3136',
    '16:9': '3840x2160',
    '9:16': '2160x3840',
    '21:9': '3840x1648',
    auto: 'auto',
  },
} as const

export const IMAGE_PLAYGROUND_QUALITY_OPTIONS = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
] as const

export const IMAGE_PLAYGROUND_FORMAT_OPTIONS = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
] as const

export const IMAGE_PLAYGROUND_COUNT_OPTIONS = [
  { value: 1, label: '1 张' },
  { value: 2, label: '2 张' },
  { value: 3, label: '3 张' },
  { value: 4, label: '4 张' },
] as const

export type ImagePlaygroundModel = typeof IMAGE_PLAYGROUND_MODELS[number]['value']
export type ImagePlaygroundResolution = typeof IMAGE_PLAYGROUND_RESOLUTION_OPTIONS[number]['value']
export type ImagePlaygroundRatio = typeof IMAGE_PLAYGROUND_RATIO_OPTIONS[number]['value']
export type ImagePlaygroundQuality = typeof IMAGE_PLAYGROUND_QUALITY_OPTIONS[number]['value']
export type ImagePlaygroundFormat = typeof IMAGE_PLAYGROUND_FORMAT_OPTIONS[number]['value']
export type ImagePlaygroundSizeValidationReason = 'format' | 'max_edge' | 'multiple_of_16' | 'ratio' | 'total_pixels'

export interface ImagePlaygroundSettings {
  apiKey: string
  model: ImagePlaygroundModel
  resolution: ImagePlaygroundResolution
  ratio: ImagePlaygroundRatio
  size: string
  quality: ImagePlaygroundQuality
  format: ImagePlaygroundFormat
  count: number
}

export interface ImageGenerationInput extends ImagePlaygroundSettings {
  prompt: string
  imageDataUrls: string[]
}

export interface GeneratedImage {
  url: string
  mimeType?: string
}

export interface ImagePlaygroundHistoryRecord extends Omit<ImagePlaygroundSettings, 'apiKey'> {
  id: string
  createdAt: string
  prompt: string
  usedInputImages: boolean
  images: GeneratedImage[]
}

export interface ImagePlaygroundBlobStore {
  get(id: string): Promise<Blob | null>
  put(id: string, blob: Blob): Promise<void>
  delete(id: string): Promise<void>
}

export const DEFAULT_IMAGE_PLAYGROUND_SETTINGS: ImagePlaygroundSettings = {
  apiKey: '',
  model: 'gpt-image-2',
  resolution: '1K',
  ratio: '1:1',
  size: '1024x1024',
  quality: 'medium',
  format: 'png',
  count: 1,
}

function includesValue<T extends readonly { value: unknown }[]>(options: T, value: unknown): value is T[number]['value'] {
  return options.some((option) => option.value === value)
}

function normalizeCount(value: unknown): number {
  const count = Number(value)
  if (!Number.isFinite(count)) return DEFAULT_IMAGE_PLAYGROUND_SETTINGS.count
  return Math.min(4, Math.max(1, Math.trunc(count)))
}

function isRatio(value: unknown): value is ImagePlaygroundRatio {
  return includesValue(IMAGE_PLAYGROUND_RATIO_OPTIONS, value)
}

function isResolution(value: unknown): value is ImagePlaygroundResolution {
  return includesValue(IMAGE_PLAYGROUND_RESOLUTION_OPTIONS, value)
}

export function resolveImagePlaygroundSize(
  resolution: ImagePlaygroundResolution,
  ratio: ImagePlaygroundRatio,
): string {
  if (resolution === 'custom') {
    return DEFAULT_IMAGE_PLAYGROUND_SETTINGS.size
  }
  return IMAGE_PLAYGROUND_SIZE_PRESETS[resolution][ratio] ?? DEFAULT_IMAGE_PLAYGROUND_SETTINGS.size
}

export function validateImagePlaygroundSize(size: string): { valid: true } | { valid: false, reason: ImagePlaygroundSizeValidationReason } {
  const normalized = size.trim().toLowerCase()
  if (normalized === 'auto') return { valid: true }

  const match = normalized.match(/^(\d+)x(\d+)$/)
  if (!match) return { valid: false, reason: 'format' }

  const width = Number(match[1])
  const height = Number(match[2])
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return { valid: false, reason: 'format' }
  }
  if (Math.max(width, height) > 3840) {
    return { valid: false, reason: 'max_edge' }
  }
  if (width % 16 !== 0 || height % 16 !== 0) {
    return { valid: false, reason: 'multiple_of_16' }
  }
  if (Math.max(width, height) / Math.min(width, height) > 3) {
    return { valid: false, reason: 'ratio' }
  }
  if (width * height > 8294400) {
    return { valid: false, reason: 'total_pixels' }
  }
  return { valid: true }
}

export function loadImagePlaygroundSettings(storage: Storage = localStorage): ImagePlaygroundSettings {
  try {
    const raw = storage.getItem(IMAGE_PLAYGROUND_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_IMAGE_PLAYGROUND_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<ImagePlaygroundSettings>
    const resolution = isResolution(parsed.resolution) ? parsed.resolution : DEFAULT_IMAGE_PLAYGROUND_SETTINGS.resolution
    const ratio = isRatio(parsed.ratio) ? parsed.ratio : DEFAULT_IMAGE_PLAYGROUND_SETTINGS.ratio
    return {
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model: includesValue(IMAGE_PLAYGROUND_MODELS, parsed.model) ? parsed.model : DEFAULT_IMAGE_PLAYGROUND_SETTINGS.model,
      resolution,
      ratio,
      size: typeof parsed.size === 'string' && validateImagePlaygroundSize(parsed.size).valid
        ? parsed.size.trim().toLowerCase()
        : resolveImagePlaygroundSize(resolution, ratio),
      quality: includesValue(IMAGE_PLAYGROUND_QUALITY_OPTIONS, parsed.quality) ? parsed.quality : DEFAULT_IMAGE_PLAYGROUND_SETTINGS.quality,
      format: includesValue(IMAGE_PLAYGROUND_FORMAT_OPTIONS, parsed.format) ? parsed.format : DEFAULT_IMAGE_PLAYGROUND_SETTINGS.format,
      count: normalizeCount(parsed.count),
    }
  } catch {
    return { ...DEFAULT_IMAGE_PLAYGROUND_SETTINGS }
  }
}

export function saveImagePlaygroundSettings(settings: ImagePlaygroundSettings, storage: Storage = localStorage): void {
  storage.setItem(IMAGE_PLAYGROUND_STORAGE_KEY, JSON.stringify({
    apiKey: settings.apiKey,
    model: settings.model,
    resolution: settings.resolution,
    ratio: settings.ratio,
    size: settings.size.trim().toLowerCase(),
    quality: settings.quality,
    format: settings.format,
    count: normalizeCount(settings.count),
  }))
}

export function buildImageGenerationRequest(input: ImageGenerationInput): Record<string, unknown> {
  const size = input.size.trim().toLowerCase()
  const request: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt.trim(),
    size,
    quality: input.quality,
    output_format: input.format,
    n: normalizeCount(input.count),
  }

  if (input.imageDataUrls.length > 0) {
    request.image = input.imageDataUrls
  }

  return request
}

function normalizeHistoryRecord(record: Partial<ImagePlaygroundHistoryRecord>): ImagePlaygroundHistoryRecord | null {
  if (
    typeof record.id !== 'string' ||
    typeof record.createdAt !== 'string' ||
    typeof record.prompt !== 'string' ||
    !includesValue(IMAGE_PLAYGROUND_MODELS, record.model) ||
    !isResolution(record.resolution) ||
    !isRatio(record.ratio) ||
    typeof record.size !== 'string' ||
    validateImagePlaygroundSize(record.size).valid !== true ||
    !includesValue(IMAGE_PLAYGROUND_QUALITY_OPTIONS, record.quality) ||
    !includesValue(IMAGE_PLAYGROUND_FORMAT_OPTIONS, record.format) ||
    !Array.isArray(record.images)
  ) {
    return null
  }

  const images = record.images.filter((image): image is GeneratedImage => (
    image !== null &&
    typeof image === 'object' &&
    typeof image.url === 'string' &&
    image.url.trim().length > 0
  ))

  return {
    id: record.id,
    createdAt: record.createdAt,
    prompt: record.prompt,
    model: record.model,
    resolution: record.resolution,
    ratio: record.ratio,
    size: record.size.trim().toLowerCase(),
    quality: record.quality,
    format: record.format,
    count: normalizeCount(record.count),
    usedInputImages: record.usedInputImages === true,
    images,
  }
}

function compactHistoryForStorage(records: ImagePlaygroundHistoryRecord[]): ImagePlaygroundHistoryRecord[] {
  return records.map((record) => ({
    ...record,
    images: record.images.filter((image) => !image.url.startsWith('data:image/')),
  }))
}

export function loadImagePlaygroundHistory(storage: Storage = localStorage): ImagePlaygroundHistoryRecord[] {
  try {
    const raw = storage.getItem(IMAGE_PLAYGROUND_HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => normalizeHistoryRecord(item as Partial<ImagePlaygroundHistoryRecord>))
      .filter((item): item is ImagePlaygroundHistoryRecord => item !== null)
      .slice(0, IMAGE_PLAYGROUND_HISTORY_LIMIT)
  } catch {
    return []
  }
}

export function saveImagePlaygroundHistory(records: ImagePlaygroundHistoryRecord[], storage: Storage = localStorage): ImagePlaygroundHistoryRecord[] {
  const limitedRecords = records.slice(0, IMAGE_PLAYGROUND_HISTORY_LIMIT)
  try {
    storage.setItem(IMAGE_PLAYGROUND_HISTORY_STORAGE_KEY, JSON.stringify(limitedRecords))
    return limitedRecords
  } catch {
    const compactRecords = compactHistoryForStorage(limitedRecords)
    storage.setItem(IMAGE_PLAYGROUND_HISTORY_STORAGE_KEY, JSON.stringify(compactRecords))
    return compactRecords
  }
}

export function prependImagePlaygroundHistoryRecord(
  record: ImagePlaygroundHistoryRecord,
  storage: Storage = localStorage,
): ImagePlaygroundHistoryRecord[] {
  const next = [record, ...loadImagePlaygroundHistory(storage)].slice(0, IMAGE_PLAYGROUND_HISTORY_LIMIT)
  return saveImagePlaygroundHistory(next, storage)
}

export function clearImagePlaygroundHistory(storage: Storage = localStorage): void {
  storage.removeItem(IMAGE_PLAYGROUND_HISTORY_STORAGE_KEY)
}

function openImagePlaygroundBlobDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IMAGE_PLAYGROUND_BLOB_DB_NAME, 1)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(IMAGE_PLAYGROUND_BLOB_STORE_NAME)) {
        database.createObjectStore(IMAGE_PLAYGROUND_BLOB_STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function createImagePlaygroundIndexedDBBlobStore(): ImagePlaygroundBlobStore {
  async function runTransaction<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const database = await openImagePlaygroundBlobDatabase()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(IMAGE_PLAYGROUND_BLOB_STORE_NAME, mode)
      const store = transaction.objectStore(IMAGE_PLAYGROUND_BLOB_STORE_NAME)
      const request = operation(store)
      let result: T
      request.onsuccess = () => {
        result = request.result
      }
      request.onerror = () => reject(request.error)
      transaction.oncomplete = () => {
        database.close()
        resolve(result)
      }
      transaction.onerror = () => {
        database.close()
        reject(transaction.error)
      }
      transaction.onabort = () => {
        database.close()
        reject(transaction.error)
      }
    })
  }

  return {
    get: (id: string) => runTransaction('readonly', (store) => store.get(id)),
    put: (id: string, blob: Blob) => runTransaction('readwrite', (store) => store.put(blob, id)).then(() => undefined),
    delete: (id: string) => runTransaction('readwrite', (store) => store.delete(id)).then(() => undefined),
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, payload = ''] = dataUrl.split(',', 2)
  const mimeType = header.match(/^data:([^;]+);base64$/)?.[1] || 'application/octet-stream'
  const binary = atob(payload)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new Blob([bytes], { type: mimeType })
}

export async function prepareImagePlaygroundHistoryRecordImages(
  record: ImagePlaygroundHistoryRecord,
  blobStore: ImagePlaygroundBlobStore = createImagePlaygroundIndexedDBBlobStore(),
): Promise<ImagePlaygroundHistoryRecord> {
  const images = await Promise.all(record.images.map(async (image, index): Promise<GeneratedImage> => {
    if (!image.url.startsWith('data:image/')) {
      return image
    }
    const blobId = `image-playground-${record.id}-${index}`
    const blob = dataUrlToBlob(image.url)
    await blobStore.put(blobId, blob)
    return {
      url: `${IMAGE_PLAYGROUND_BLOB_URL_PREFIX}${blobId}`,
      mimeType: image.mimeType || blob.type,
    }
  }))

  return {
    ...record,
    images,
  }
}

export async function hydrateImagePlaygroundHistory(
  records: ImagePlaygroundHistoryRecord[],
  blobStore: ImagePlaygroundBlobStore = createImagePlaygroundIndexedDBBlobStore(),
  createObjectUrl: (blob: Blob) => string = URL.createObjectURL,
): Promise<ImagePlaygroundHistoryRecord[]> {
  return Promise.all(records.map(async (record) => {
    const images = await Promise.all(record.images.map(async (image): Promise<GeneratedImage | null> => {
      if (!image.url.startsWith(IMAGE_PLAYGROUND_BLOB_URL_PREFIX)) {
        return image
      }
      const blobId = image.url.slice(IMAGE_PLAYGROUND_BLOB_URL_PREFIX.length)
      const blob = await blobStore.get(blobId)
      if (!blob) {
        return null
      }
      return {
        ...image,
        url: createObjectUrl(blob),
        mimeType: image.mimeType || blob.type,
      }
    }))

    return {
      ...record,
      images: images.filter((image): image is GeneratedImage => image !== null),
    }
  }))
}

export async function deleteImagePlaygroundHistoryBlobs(
  records: ImagePlaygroundHistoryRecord[],
  blobStore: ImagePlaygroundBlobStore = createImagePlaygroundIndexedDBBlobStore(),
): Promise<void> {
  await Promise.all(records.flatMap((record) => record.images
    .filter((image) => image.url.startsWith(IMAGE_PLAYGROUND_BLOB_URL_PREFIX))
    .map((image) => blobStore.delete(image.url.slice(IMAGE_PLAYGROUND_BLOB_URL_PREFIX.length)))))
}

export function appendImageGenerationFormData(formData: FormData, input: ImageGenerationInput, files: File[]): void {
  const request = buildImageGenerationRequest(input)
  for (const [key, value] of Object.entries(request)) {
    if (key === 'image') continue
    formData.append(key, String(value))
  }
  for (const file of files) {
    formData.append('image', file, file.name || 'image.png')
  }
}

export function extractImageFilesFromClipboard(event: Pick<ClipboardEvent, 'clipboardData'>): File[] {
  return Array.from(event.clipboardData?.files || []).filter((file) => file.type.startsWith('image/'))
}

export function extractGeneratedImages(response: unknown): GeneratedImage[] {
  const data = (response as { data?: unknown })?.data
  if (!Array.isArray(data)) return []
  return data.flatMap((item): GeneratedImage[] => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    if (typeof record.url === 'string' && record.url.trim()) {
      return [{ url: record.url, mimeType: undefined }]
    }
    if (typeof record.b64_json === 'string' && record.b64_json.trim()) {
      const format = typeof record.output_format === 'string' && record.output_format.trim()
        ? record.output_format.trim().toLowerCase()
        : 'png'
      return [{
        url: `data:image/${format};base64,${record.b64_json}`,
        mimeType: `image/${format}`,
      }]
    }
    return []
  })
}
