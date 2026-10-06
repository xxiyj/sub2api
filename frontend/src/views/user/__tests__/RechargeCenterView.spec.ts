import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import RechargeCenterView from '../RechargeCenterView.vue'

const { getHistory, showError } = vi.hoisted(() => ({
  getHistory: vi.fn(),
  showError: vi.fn(),
}))

vi.mock('@/api', () => ({
  redeemAPI: { getHistory, redeem: vi.fn() },
  authAPI: { getPublicSettings: vi.fn().mockResolvedValue({}) },
}))
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ user: { balance: 10, concurrency: 2 }, refreshUser: vi.fn() }),
}))
vi.mock('@/stores/subscriptions', () => ({
  useSubscriptionStore: () => ({ fetchActiveSubscriptions: vi.fn() }),
}))
vi.mock('@/stores/app', () => ({
  useAppStore: () => ({ showError, showSuccess: vi.fn(), showWarning: vi.fn() }),
}))
vi.mock('vue-i18n', async () => {
  const actual = await vi.importActual<typeof import('vue-i18n')>('vue-i18n')
  return { ...actual, useI18n: () => ({ t: (key: string) => key }) }
})

const mountView = () => mount(RechargeCenterView, {
  global: { stubs: { AppLayout: { template: '<div><slot /></div>' }, Icon: true } },
})

describe('RechargeCenterView server pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getHistory.mockResolvedValue({ items: [], total: 11 })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('uses the server total and fetches the selected page', async () => {
    const wrapper = mountView()
    await flushPromises()
    expect(getHistory).toHaveBeenLastCalledWith(1, 5)
    expect(wrapper.get('.activity-pagination').text()).toContain('1 / 3')
    expect(wrapper.get('[aria-label="Previous page"]').attributes('disabled')).toBeDefined()
    getHistory.mockResolvedValue({ items: [{
      id: 6, code: 'PAGE-TWO', type: 'balance', value: 12,
      used_at: '2026-10-06T00:00:00Z',
    }], total: 11 })
    await wrapper.get('[aria-label="Next page"]').trigger('click')
    await flushPromises()
    expect(getHistory).toHaveBeenLastCalledWith(2, 5)
    expect(wrapper.get('.activity-pagination').text()).toContain('2 / 3')
    expect(wrapper.text()).toContain('12.00')
    await wrapper.get('[aria-label="Next page"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[aria-label="Next page"]').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('keeps the current page and reports errors when loading another page fails', async () => {
    const wrapper = mountView()
    await flushPromises()
    getHistory.mockRejectedValueOnce(new Error('Unavailable'))
    await wrapper.get('[aria-label="Next page"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('.activity-pagination').text()).toContain('1 / 3')
    expect(showError).toHaveBeenCalledWith('redeem.historyLoadFailed')
    wrapper.unmount()
  })
})
