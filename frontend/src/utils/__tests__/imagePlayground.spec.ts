import { describe, expect, it } from 'vitest'
import {
  buildImageGenerationRequest,
  extractGeneratedImages,
  IMAGE_PLAYGROUND_HISTORY_STORAGE_KEY,
  IMAGE_PLAYGROUND_STORAGE_KEY,
  loadImagePlaygroundSettings,
  loadImagePlaygroundHistory,
  hydrateImagePlaygroundHistory,
  prependImagePlaygroundHistoryRecord,
  prepareImagePlaygroundHistoryRecordImages,
  resolveImagePlaygroundSize,
  saveImagePlaygroundHistory,
  saveImagePlaygroundSettings,
  type ImagePlaygroundBlobStore,
  validateImagePlaygroundSize,
} from '../imagePlayground'

describe('imagePlayground utilities', () => {
  it('builds the gpt-image-2 request with constrained user options', () => {
    const request = buildImageGenerationRequest({
      model: 'gpt-image-2',
      prompt: 'A glass teapot on a walnut table',
      resolution: '1K',
      ratio: '3:2',
      size: '1536x1024',
      quality: 'medium',
      format: 'jpeg',
      count: 6,
      imageDataUrls: [],
    })

    expect(request).toEqual({
      model: 'gpt-image-2',
      prompt: 'A glass teapot on a walnut table',
      size: '1536x1024',
      quality: 'medium',
      output_format: 'jpeg',
      n: 4,
    })
  })

  it('uses edits endpoint payload shape when input images are attached', () => {
    const request = buildImageGenerationRequest({
      model: 'gpt-image-2',
      prompt: 'Turn this into a product poster',
      resolution: '1K',
      ratio: '1:1',
      size: '1024x1024',
      quality: 'high',
      format: 'png',
      count: 2,
      imageDataUrls: ['data:image/png;base64,abc'],
    })

    expect(request).toMatchObject({
      model: 'gpt-image-2',
      prompt: 'Turn this into a product poster',
      size: '1024x1024',
      quality: 'high',
      output_format: 'png',
      n: 2,
      image: ['data:image/png;base64,abc'],
    })
  })

  it('extracts generated images from base64 and url response items', () => {
    expect(extractGeneratedImages({
      data: [
        { b64_json: 'Zm9v', output_format: 'png' },
        { url: 'https://example.com/image.jpg' },
      ],
    })).toEqual([
      { url: 'data:image/png;base64,Zm9v', mimeType: 'image/png' },
      { url: 'https://example.com/image.jpg', mimeType: undefined },
    ])
  })

  it('persists only local playground preferences and the user supplied key', () => {
    localStorage.clear()

    saveImagePlaygroundSettings({
      apiKey: 'sk-user',
      model: 'gpt-image-2',
      resolution: '2K',
      ratio: '2:3',
      size: '1360x2048',
      quality: 'low',
      format: 'jpeg',
      count: 3,
    })

    expect(localStorage.getItem(IMAGE_PLAYGROUND_STORAGE_KEY)).toContain('sk-user')
    expect(loadImagePlaygroundSettings()).toEqual({
      apiKey: 'sk-user',
      model: 'gpt-image-2',
      resolution: '2K',
      ratio: '2:3',
      size: '1360x2048',
      quality: 'low',
      format: 'jpeg',
      count: 3,
    })
  })

  it('resolves preset resolution and ratio into model size values', () => {
    expect(resolveImagePlaygroundSize('1K', '4:3')).toBe('1024x768')
    expect(resolveImagePlaygroundSize('1K', '3:4')).toBe('768x1024')
    expect(resolveImagePlaygroundSize('2K', '16:9')).toBe('2048x1152')
    expect(resolveImagePlaygroundSize('4K', '16:9')).toBe('3840x2160')
    expect(resolveImagePlaygroundSize('4K', '9:16')).toBe('2160x3840')
    expect(resolveImagePlaygroundSize('4K', '21:9')).toBe('3840x1648')
    expect(resolveImagePlaygroundSize('custom', '1:1')).toBe('1024x1024')
    expect(resolveImagePlaygroundSize('1K', 'auto')).toBe('auto')
  })

  it('validates custom model sizes before generation', () => {
    expect(validateImagePlaygroundSize('3840x2160')).toEqual({ valid: true })
    expect(validateImagePlaygroundSize('3841x2160')).toMatchObject({ valid: false, reason: 'max_edge' })
    expect(validateImagePlaygroundSize('3839x2160')).toMatchObject({ valid: false, reason: 'multiple_of_16' })
    expect(validateImagePlaygroundSize('3840x1024')).toMatchObject({ valid: false, reason: 'ratio' })
    expect(validateImagePlaygroundSize('3840x3840')).toMatchObject({ valid: false, reason: 'total_pixels' })
    expect(validateImagePlaygroundSize('wide')).toMatchObject({ valid: false, reason: 'format' })
  })

  it('builds requests with the selected size instead of deriving size from ratio only', () => {
    const request = buildImageGenerationRequest({
      model: 'gpt-image-2',
      prompt: 'A wide cinematic banner',
      resolution: '4K',
      ratio: '21:9',
      size: '3840x1648',
      quality: 'high',
      format: 'png',
      count: 1,
      imageDataUrls: [],
    })

    expect(request).toMatchObject({
      size: '3840x1648',
      quality: 'high',
      output_format: 'png',
      n: 1,
    })
  })

  it('keeps only the most recent 20 local generation history records', () => {
    localStorage.clear()

    const records = Array.from({ length: 22 }, (_, index) => ({
      id: `record-${index}`,
      createdAt: `2026-07-06T00:${String(index).padStart(2, '0')}:00.000Z`,
      prompt: `Prompt ${index}`,
      model: 'gpt-image-2' as const,
      resolution: '1K' as const,
      ratio: '1:1' as const,
      size: '1024x1024',
      quality: 'medium' as const,
      format: 'png' as const,
      count: 1,
      usedInputImages: false,
      images: [{ url: `data:image/png;base64,${index}`, mimeType: 'image/png' }],
    }))

    saveImagePlaygroundHistory(records)

    const history = loadImagePlaygroundHistory()
    expect(history).toHaveLength(20)
    expect(history[0].id).toBe('record-0')
    expect(history[19].id).toBe('record-19')
    expect(localStorage.getItem(IMAGE_PLAYGROUND_HISTORY_STORAGE_KEY)).toContain('record-19')
    expect(localStorage.getItem(IMAGE_PLAYGROUND_HISTORY_STORAGE_KEY)).not.toContain('record-20')
  })

  it('falls back to metadata-only history when generated image data exceeds localStorage quota', () => {
    const backing = new Map<string, string>()
    const smallQuotaStorage = {
      get length() { return backing.size },
      clear: () => backing.clear(),
      getItem: (key: string) => backing.get(key) ?? null,
      key: (index: number) => Array.from(backing.keys())[index] ?? null,
      removeItem: (key: string) => backing.delete(key),
      setItem: (key: string, value: string) => {
        if (value.length > 500) {
          throw new DOMException('Quota exceeded', 'QuotaExceededError')
        }
        backing.set(key, value)
      },
    } satisfies Storage

    const history = prependImagePlaygroundHistoryRecord({
      id: 'huge-image',
      createdAt: '2026-07-06T01:00:00.000Z',
      prompt: 'A very large base64 image',
      model: 'gpt-image-2',
      resolution: '4K',
      ratio: '16:9',
      size: '3840x2160',
      quality: 'high',
      format: 'png',
      count: 1,
      usedInputImages: false,
      images: [{ url: `data:image/png;base64,${'a'.repeat(2000)}`, mimeType: 'image/png' }],
    }, smallQuotaStorage)

    expect(history).toHaveLength(1)
    expect(history[0].id).toBe('huge-image')
    expect(history[0].images).toEqual([])
    expect(loadImagePlaygroundHistory(smallQuotaStorage)[0].id).toBe('huge-image')
  })

  it('stores data url history images as blobs before writing metadata to localStorage', async () => {
    const storedBlobs = new Map<string, Blob>()
    const memoryBlobStore: ImagePlaygroundBlobStore = {
      get: async (id: string) => storedBlobs.get(id) ?? null,
      put: async (id: string, blob: Blob) => {
        storedBlobs.set(id, blob)
      },
      delete: async (id: string) => {
        storedBlobs.delete(id)
      },
    }
    const backing = new Map<string, string>()
    const storage = {
      get length() { return backing.size },
      clear: () => backing.clear(),
      getItem: (key: string) => backing.get(key) ?? null,
      key: (index: number) => Array.from(backing.keys())[index] ?? null,
      removeItem: (key: string) => backing.delete(key),
      setItem: (key: string, value: string) => backing.set(key, value),
    } satisfies Storage

    const prepared = await prepareImagePlaygroundHistoryRecordImages({
      id: 'blob-record',
      createdAt: '2026-07-06T02:00:00.000Z',
      prompt: 'Persist me as a blob',
      model: 'gpt-image-2',
      resolution: '1K',
      ratio: '1:1',
      size: '1024x1024',
      quality: 'medium',
      format: 'png',
      count: 1,
      usedInputImages: false,
      images: [{ url: 'data:image/png;base64,Zm9v', mimeType: 'image/png' }],
    }, memoryBlobStore)

    expect(prepared.images[0].url).toBe('indexeddb:image-playground-blob-record-0')
    expect(storedBlobs.get('image-playground-blob-record-0')?.type).toBe('image/png')

    prependImagePlaygroundHistoryRecord(prepared, storage)
    expect(storage.getItem(IMAGE_PLAYGROUND_HISTORY_STORAGE_KEY)).not.toContain('Zm9v')

    const hydrated = await hydrateImagePlaygroundHistory(loadImagePlaygroundHistory(storage), memoryBlobStore, (blob) => `blob:${blob.type}:${blob.size}`)
    expect(hydrated[0].images[0].url).toBe('blob:image/png:3')
  })
})
