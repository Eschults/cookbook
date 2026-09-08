import { beforeEach, describe, expect, it, vi } from 'vitest'

let useLocale, i18n

beforeEach(async () => {
  vi.resetModules()
  ;({ useLocale } = await import('../../src/composables/useLocale.js'))
  ;({ i18n } = await import('../../src/i18n/index.js'))
})

describe('useLocale', () => {
  it('starts in the language the browser asks for', () => {
    // jsdom reports en-US, which is also the fallback when nothing matches.
    expect(useLocale().locale.value).toBe('en')
  })

  it('starts in French when the browser asks for French', async () => {
    const original = Object.getOwnPropertyDescriptor(window.navigator, 'languages')
    Object.defineProperty(window.navigator, 'languages', { value: ['fr-FR', 'en'], configurable: true })

    try {
      vi.resetModules()
      const fresh = await import('../../src/composables/useLocale.js')
      expect(fresh.useLocale().locale.value).toBe('fr')
    } finally {
      if (original) Object.defineProperty(window.navigator, 'languages', original)
      else delete window.navigator.languages
    }
  })

  it('switches locale and persists the choice', () => {
    const { locale, setLocale } = useLocale()
    setLocale('fr')

    expect(locale.value).toBe('fr')
    expect(i18n.global.locale.value).toBe('fr')
    expect(localStorage.getItem('cookbook:locale:v1')).toBe('fr')
  })

  it('persists the active locale when it is picked again', () => {
    // Nothing changes on screen, but the choice now outlives a browser that
    // starts asking for another language.
    const { setLocale } = useLocale()
    setLocale('en')

    expect(localStorage.getItem('cookbook:locale:v1')).toBe('en')
  })

  it('ignores an unsupported locale', () => {
    const { locale, setLocale } = useLocale()
    setLocale('de')

    expect(locale.value).toBe('en')
    expect(localStorage.getItem('cookbook:locale:v1')).toBeNull()
  })

  it('keeps the document language in step', async () => {
    const { setLocale } = useLocale()
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe('Cookbook')

    setLocale('fr')
    await Promise.resolve()

    expect(document.documentElement.lang).toBe('fr')
    // The product name is the same in both locales; the title tracks it anyway.
    expect(document.title).toBe('Cookbook')
  })

  it('restores a stored locale on the next load, ahead of the browser', async () => {
    localStorage.setItem('cookbook:locale:v1', 'fr')
    vi.resetModules()
    const fresh = await import('../../src/composables/useLocale.js')

    expect(fresh.useLocale().locale.value).toBe('fr')
  })

  it('collates according to the active locale', () => {
    const { collator, setLocale } = useLocale()
    const titles = ['Zèbre', 'ananas', 'Éclair']

    expect([...titles].sort(collator.value.compare)).toEqual(['ananas', 'Éclair', 'Zèbre'])
    setLocale('fr')
    expect([...titles].sort(collator.value.compare)).toEqual(['ananas', 'Éclair', 'Zèbre'])
  })
})
