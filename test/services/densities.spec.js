import { describe, expect, it } from 'vitest'
import { densityOf, WATER_DENSITY } from '../../src/services/densities.js'

describe('densityOf', () => {
  it('knows the liquids a shop sells by volume', () => {
    expect(densityOf('lait')).toBe(1.03)
    expect(densityOf('milk')).toBe(1.03)
    expect(densityOf('vinaigre')).toBe(1.01)
    expect(densityOf('bouillon de volaille')).toBe(1)
  })

  it('prefers the variety over the generic liquid', () => {
    // Both "huile" and "olive" are known; the specific figure wins.
    expect(densityOf('huile')).toBe(0.918)
    expect(densityOf('huile d’olive')).toBe(0.915)
    expect(densityOf('huile de tournesol')).toBe(0.920)
    expect(densityOf('olive oil')).toBe(0.915)
  })

  it('only reads a variety once something marks the name as a liquid', () => {
    // Olives are a fruit sold by weight, however oily they are.
    expect(densityOf('olives')).toBeNull()
    expect(densityOf('olive')).toBeNull()
    expect(densityOf('mais')).toBeNull()
  })

  it('returns null for anything bought by weight', () => {
    expect(densityOf('farine')).toBeNull()
    expect(densityOf('beurre')).toBeNull()
    expect(densityOf('flour')).toBeNull()
  })

  it('matches whole words, so vin is not read out of vinaigrette', () => {
    expect(densityOf('vinaigrette')).toBeNull()
    expect(densityOf('vin blanc')).toBe(0.99)
    expect(densityOf('vinaigre balsamique')).toBe(1.01)
  })

  it('ignores case, accents and surrounding markdown', () => {
    expect(densityOf('HUILE')).toBe(0.918)
    expect(densityOf('Crème fraîche')).toBe(1.01)
    expect(densityOf('creme fraiche')).toBe(1.01)
    expect(densityOf('**huile** d’olive')).toBe(0.915)
  })

  it('handles an empty or missing name', () => {
    expect(densityOf('')).toBeNull()
    expect(densityOf(null)).toBeNull()
    expect(densityOf(undefined)).toBeNull()
  })

  it('takes water as the default for anything unlisted', () => {
    expect(WATER_DENSITY).toBe(1)
  })
})
