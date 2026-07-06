import { describe, expect, it } from 'vitest'
import {
  buildImageGenerationRequest,
  extractGeneratedImages,
  IMAGE_PLAYGROUND_STORAGE_KEY,
  loadImagePlaygroundSettings,
  saveImagePlaygroundSettings,
} from '../imagePlayground'

describe('imagePlayground utilities', () => {
  it('builds the gpt-image-2 request with constrained user options', () => {
    const request = buildImageGenerationRequest({
      model: 'gpt-image-2',
      prompt: 'A glass teapot on a walnut table',
      ratio: '3:2',
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
      ratio: '1:1',
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
      ratio: '2:3',
      quality: 'low',
      format: 'jpeg',
      count: 3,
    })

    expect(localStorage.getItem(IMAGE_PLAYGROUND_STORAGE_KEY)).toContain('sk-user')
    expect(loadImagePlaygroundSettings()).toEqual({
      apiKey: 'sk-user',
      model: 'gpt-image-2',
      ratio: '2:3',
      quality: 'low',
      format: 'jpeg',
      count: 3,
    })
  })
})
