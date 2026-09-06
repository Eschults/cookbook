import { beforeEach, describe, expect, it, vi } from 'vitest'

let useLocale, i18n

beforeEach(async () => {
  vi.resetModules()
  ;({ useLocale } = await import('../../src/composables/useLocale.js'))
  ;({ i18n } = await import('../../src/i18n/index.js'))
})

describe('useLocale', () => {
  it('starts in French', () => {
    expect(useLocale().locale.value).toBe('fr')
  })

  it('switches locale and persists the choice', () => {
    const { locale, setLocale } = useLocale()
    setLocale('en')

    expect(locale.value).toBe('en')
    expect(i18n.global.locale.value).toBe('en')
    expect(localStorage.getItem('cookbook:locale:v1')).toBe('en')
  })

  it('ignores an unsupported locale', () => {
    const { locale, setLocale } = useLocale()
    setLocale('de')

    expect(locale.value).toBe('fr')
    expect(localStorage.getItem('cookbook:locale:v1')).toBeNull()
  })

  it('keeps the document language in step', async () => {
    const { setLocale } = useLocale()
    expect(document.documentElement.lang).toBe('fr')
    expect(document.title).toBe('Cookbook')

    setLocale('en')
    await Promise.resolve()

    expect(document.documentElement.lang).toBe('en')
    // The product name is the same in both locales; the title tracks it anyway.
    expect(document.title).toBe('Cookbook')
  })

  it('restores a stored locale on the next load', async () => {
    localStorage.setItem('cookbook:locale:v1', 'en')
    vi.resetModules()
    const fresh = await import('../../src/composables/useLocale.js')

    expect(fresh.useLocale().locale.value).toBe('en')
  })

  it('collates according to the active locale', () => {
    const { collator, setLocale } = useLocale()
    const titles = ['Zèbre', 'ananas', 'Éclair']

    expect([...titles].sort(collator.value.compare)).toEqual(['ananas', 'Éclair', 'Zèbre'])
    setLocale('en')
    expect([...titles].sort(collator.value.compare)).toEqual(['ananas', 'Éclair', 'Zèbre'])
  })
})
