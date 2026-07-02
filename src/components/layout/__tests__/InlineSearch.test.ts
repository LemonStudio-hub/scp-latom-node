import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { nextTick } from 'vue'
import InlineSearch from '../InlineSearch.vue'
import en from '@/locales/en'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en },
  })
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div />' } }],
  })
}

function rectWithWidth(width: number): DOMRect {
  return {
    width,
    height: 16,
    x: 0,
    y: 0,
    top: 0,
    right: width,
    bottom: 16,
    left: 0,
    toJSON: () => ({}),
  } as DOMRect
}

async function finishSearchWidthTransition(wrapper: VueWrapper) {
  const event = new Event('transitionend') as TransitionEvent
  Object.defineProperty(event, 'propertyName', { value: 'width' })
  wrapper.find('.search-container').element.dispatchEvent(event)
  await nextTick()
}

describe('InlineSearch', () => {
  let wrapper: VueWrapper | undefined

  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.classList.contains('shortcut-measure')) {
        return rectWithWidth(this.textContent === 'Ctrl+K' ? 46 : 25)
      }
      return rectWithWidth(0)
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('keeps the collapsed and closing Ctrl+K shortcut widths aligned', async () => {
    const router = createTestRouter()
    await router.push('/')

    wrapper = mount(InlineSearch, {
      global: { plugins: [createTestI18n(), router] },
    })
    await nextTick()
    await nextTick()

    const collapsedWidth = wrapper.find('.shortcut-key').attributes('style')
    expect(collapsedWidth).toContain('width: 62px')

    await wrapper.find('.search-btn').trigger('click')
    await nextTick()

    expect(wrapper.find('.esc-key.compact').attributes('style')).toBe(collapsedWidth)

    await wrapper.find('.search-input-wrap').trigger('keydown', { key: 'Escape' })
    vi.advanceTimersByTime(70)
    await nextTick()

    expect(wrapper.find('.esc-key.compact').attributes('style')).toBe(collapsedWidth)

    await finishSearchWidthTransition(wrapper)

    expect(wrapper.find('.shortcut-key').attributes('style')).toBe(collapsedWidth)
  })

  it('keeps the joined border while the dropdown bottom edge retracts', async () => {
    const router = createTestRouter()
    await router.push('/')

    wrapper = mount(InlineSearch, {
      global: { plugins: [createTestI18n(), router] },
    })
    await nextTick()
    await nextTick()

    await wrapper.find('.search-btn').trigger('click')
    await nextTick()
    await finishSearchWidthTransition(wrapper)

    expect(wrapper.find('.search-container').classes()).toContain('dropdown-open')
    expect(wrapper.find('.search-dropdown').exists()).toBe(true)

    await wrapper.find('.search-input-wrap').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('.search-container').classes()).toContain('expanded')
    expect(wrapper.find('.search-container').classes()).toContain('dropdown-open')
    expect(wrapper.find('.search-container').classes()).not.toContain('closing')
  })
})
