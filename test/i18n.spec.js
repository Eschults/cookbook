import { describe, expect, it } from 'vitest'
import { i18n, frenchPlural } from '../src/i18n/index.js'
import { browserLocale, DEFAULT_LOCALE, LOCALES } from '../src/i18n/locales.js'
import en from '../src/i18n/en.js'
import fr from '../src/i18n/fr.js'

function flatten(messages, prefix = '') {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === 'string' ? [[prefix + key, value]] : flatten(value, `${prefix}${key}.`))
}

const catalogues = { en: new Map(flatten(en)), fr: new Map(flatten(fr)) }
const branches = message => message.split('|').length
const placeholders = message => [...new Set(message.match(/\{\w+\}/g) || [])].sort()

const t = (key, ...args) => i18n.global.t(key, ...args)
const withLocale = (locale, run) => {
  i18n.global.locale.value = locale
  try { return run() } finally { i18n.global.locale.value = DEFAULT_LOCALE }
}

describe('catalogues', () => {
  it('English is the default', () => {
    expect(DEFAULT_LOCALE).toBe('en')
    expect(LOCALES).toContain('fr')
  })

  it('defines the same keys in both locales', () => {
    expect([...catalogues.fr.keys()].sort()).toEqual([...catalogues.en.keys()].sort())
  })

  it('leaves the product name untranslated', () => {
    // "Cookbook" is the product, not a label: it reads the same in every locale.
    expect(catalogues.fr.get('app.title')).toBe('Cookbook')
    expect(catalogues.en.get('app.title')).toBe('Cookbook')
  })

  it('is not empty', () => {
    expect(catalogues.en.size).toBeGreaterThan(40)
  })

  it.each([...catalogues.en.keys()])('%s has matching plural branches', key => {
    expect(branches(catalogues.fr.get(key))).toBe(branches(catalogues.en.get(key)))
  })

  it.each([...catalogues.en.keys()])('%s has matching placeholders', key => {
    expect(placeholders(catalogues.fr.get(key))).toEqual(placeholders(catalogues.en.get(key)))
  })

  it('keeps decorative glyphs out of messages', () => {
    const glyphs = /[\u{1F373}\u{1F37D}\u{1F50E}\u{1F6D2}✓✕→←＋×›]/u
    for (const [locale, messages] of Object.entries(catalogues)) {
      for (const [key, message] of messages) {
        expect(glyphs.test(message), `${locale}.${key}: "${message}"`).toBe(false)
      }
    }
  })
})

describe('French typography', () => {
  it('uses typographic apostrophes', () => {
    for (const [key, message] of catalogues.fr) {
      expect(message.includes("'"), `fr.${key}: "${message}"`).toBe(false)
    }
  })

  it('puts a no-break space before : ? and !', () => {
    for (const [key, message] of catalogues.fr) {
      expect(/[^\s ][:?!]/.test(message), `fr.${key}: "${message}"`).toBe(false)
    }
  })
})

describe('pluralisation', () => {
  // The reason this file exists: vue-i18n's built-in rule is English, and
  // applying it to French renders "0 recettes" instead of "0 recette".
  it.each([[0, 0], [1, 0], [1.5, 0], [2, 1], [2.5, 1], [10, 1]])(
    'French picks branch %i -> %i', (count, index) => {
      expect(frenchPlural(count, 2)).toBe(index)
    })

  it('renders zero in the French singular', () => {
    withLocale('fr', () => {
      expect(t('index.ingredients', { n: 0 })).toBe('0 ingrédient')
      expect(t('list.remaining', { n: 0 })).toBe('0 restant')
    })
  })

  it('renders zero in the English plural', () => {
    withLocale('en', () => {
      expect(t('index.ingredients', { n: 0 })).toBe('0 ingredients')
      expect(t('list.remaining', { n: 0 })).toBe('0 remaining')
    })
  })

  it.each([
    [1, '1 ingrédient'],
    [2, '2 ingrédients']
  ])('renders %i in French', (n, expected) => {
    expect(withLocale('fr', () => t('index.ingredients', { n }))).toBe(expected)
  })

  it('pluralises the serving sentence', () => {
    withLocale('fr', () => {
      expect(t('dialog.servingsKnown', { n: 1 })).toContain('1 personne.')
      expect(t('dialog.servingsKnown', { n: 4 })).toContain('4 personnes.')
    })
  })
})

describe('interpolation', () => {
  it('fills named placeholders', () => {
    expect(t('dialog.scale', { title: 'Guacamole' })).toBe('Scale Guacamole')
    expect(withLocale('fr', () => t('dialog.scale', { title: 'Guacamole' }))).toBe('Ajuster «\u00A0Guacamole\u00A0»')
  })

  it('renders the active locale', () => {
    expect(t('nav.recipes')).toBe('Recipes')
    expect(withLocale('fr', () => t('nav.recipes'))).toBe('Recettes')
  })
})

describe('browserLocale', () => {
  it('takes the first supported language the browser asks for', () => {
    expect(browserLocale(['de', 'fr', 'en'])).toBe('fr')
  })

  it('matches on the primary subtag, so a regional variant still counts', () => {
    expect(browserLocale(['fr-CA'])).toBe('fr')
    expect(browserLocale(['EN-GB'])).toBe('en')
  })

  it('returns null when the browser wants nothing this app speaks', () => {
    expect(browserLocale(['de-AT', 'it'])).toBeNull()
    expect(browserLocale([])).toBeNull()
  })

  it('reads the browser itself when given nothing', () => {
    const original = Object.getOwnPropertyDescriptor(window.navigator, 'languages')
    Object.defineProperty(window.navigator, 'languages', { value: ['fr-FR', 'en'], configurable: true })

    try {
      expect(browserLocale()).toBe('fr')
    } finally {
      if (original) Object.defineProperty(window.navigator, 'languages', original)
      else delete window.navigator.languages
    }
  })
})
