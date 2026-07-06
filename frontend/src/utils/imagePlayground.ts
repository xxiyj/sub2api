export const IMAGE_PLAYGROUND_STORAGE_KEY = 'sub2api_image_playground_settings'

export const IMAGE_PLAYGROUND_MODELS = [
  { value: 'gpt-image-2', label: 'gpt-image-2' },
] as const

export const IMAGE_PLAYGROUND_SIZE_OPTIONS = [
  { value: '1024x1024', label: '1:1 - 1024x1024', ratio: '1:1' },
  { value: '1536x1024', label: '3:2 - 1536x1024', ratio: '3:2' },
  { value: '1024x1536', label: '2:3 - 1024x1536', ratio: '2:3' },
] as const

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
export type ImagePlaygroundSize = typeof IMAGE_PLAYGROUND_SIZE_OPTIONS[number]['value']
export type ImagePlaygroundRatio = typeof IMAGE_PLAYGROUND_SIZE_OPTIONS[number]['ratio']
export type ImagePlaygroundQuality = typeof IMAGE_PLAYGROUND_QUALITY_OPTIONS[number]['value']
export type ImagePlaygroundFormat = typeof IMAGE_PLAYGROUND_FORMAT_OPTIONS[number]['value']

export interface ImagePlaygroundSettings {
  apiKey: string
  model: ImagePlaygroundModel
  ratio: ImagePlaygroundRatio
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

export const DEFAULT_IMAGE_PLAYGROUND_SETTINGS: ImagePlaygroundSettings = {
  apiKey: '',
  model: 'gpt-image-2',
  ratio: '1:1',
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

export function resolveSizeForRatio(ratio: ImagePlaygroundRatio): ImagePlaygroundSize {
  return IMAGE_PLAYGROUND_SIZE_OPTIONS.find((option) => option.ratio === ratio)?.value ?? '1024x1024'
}

export function loadImagePlaygroundSettings(storage: Storage = localStorage): ImagePlaygroundSettings {
  try {
    const raw = storage.getItem(IMAGE_PLAYGROUND_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_IMAGE_PLAYGROUND_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<ImagePlaygroundSettings>
    return {
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model: includesValue(IMAGE_PLAYGROUND_MODELS, parsed.model) ? parsed.model : DEFAULT_IMAGE_PLAYGROUND_SETTINGS.model,
      ratio: IMAGE_PLAYGROUND_SIZE_OPTIONS.some((option) => option.ratio === parsed.ratio)
        ? parsed.ratio as ImagePlaygroundRatio
        : DEFAULT_IMAGE_PLAYGROUND_SETTINGS.ratio,
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
    ratio: settings.ratio,
    quality: settings.quality,
    format: settings.format,
    count: normalizeCount(settings.count),
  }))
}

export function buildImageGenerationRequest(input: ImageGenerationInput): Record<string, unknown> {
  const request: Record<string, unknown> = {
    model: input.model,
    prompt: input.prompt.trim(),
    size: resolveSizeForRatio(input.ratio),
    quality: input.quality,
    output_format: input.format,
    n: normalizeCount(input.count),
  }

  if (input.imageDataUrls.length > 0) {
    request.image = input.imageDataUrls
  }

  return request
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
