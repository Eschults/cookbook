import { describe, expect, it } from 'vitest'
import { pluralizeIngredientName, shouldPluralize } from '../../src/services/pluralize.js'

describe('shouldPluralize', () => {
  it('is true for a bare integer count of 2 or more', () => {
    expect(shouldPluralize(2, '')).toBe(true)
    expect(shouldPluralize(18, '')).toBe(true)
  })

  it('is false below 2, for a missing quantity, or for a non-integer count', () => {
    expect(shouldPluralize(1, '')).toBe(false)
    expect(shouldPluralize(0, '')).toBe(false)
    expect(shouldPluralize(null, '')).toBe(false)
    expect(shouldPluralize(2.5, '')).toBe(false)
  })

  it('is false whenever a unit is present, metric or not', () => {
    expect(shouldPluralize(500, 'g')).toBe(false)
    expect(shouldPluralize(2, 'L')).toBe(false)
    expect(shouldPluralize(3, 'cuillères à soupe')).toBe(false)
  })
})

describe('pluralizeIngredientName', () => {
  it('adds an "s" to the leading noun', () => {
    expect(pluralizeIngredientName('oeuf')).toBe('oeufs')
    expect(pluralizeIngredientName('carotte')).toBe('carottes')
  })

  it('leaves a noun already ending in s, x or z alone', () => {
    expect(pluralizeIngredientName('ananas')).toBe('ananas')
    expect(pluralizeIngredientName('noix de muscade')).toBe('noix de muscade')
  })

  it('pluralizes an -eau/-au noun with an x', () => {
    expect(pluralizeIngredientName('gâteau roulé')).toBe('gâteaux roulé')
    expect(pluralizeIngredientName('noyau')).toBe('noyaux')
  })

  it('only pluralizes the leading noun, leaving its complement untouched', () => {
    expect(pluralizeIngredientName("gousse d'ail")).toBe("gousses d'ail")
    expect(pluralizeIngredientName('feuille de lasagne précuite')).toBe('feuilles de lasagne précuite')
  })
})
