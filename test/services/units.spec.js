import { describe, expect, it } from 'vitest'
import { formatAmount, toBaseAmount, toDisplayAmount } from '../../src/services/units.js'

describe('toBaseAmount', () => {
  it('leaves grams alone', () => {
    expect(toBaseAmount(500, 'g')).toEqual({ quantity: 500, unit: 'g' })
  })

  it('converts the other metric mass units to grams', () => {
    expect(toBaseAmount(1.5, 'kg')).toEqual({ quantity: 1500, unit: 'g' })
    expect(toBaseAmount(200, 'mg')).toEqual({ quantity: 0.2, unit: 'g' })
  })

  it('treats a millilitre as a gram, so volumes merge with masses', () => {
    expect(toBaseAmount(500, 'ml')).toEqual({ quantity: 500, unit: 'g' })
    expect(toBaseAmount(500, 'cL')).toEqual({ quantity: 5000, unit: 'g' })
    expect(toBaseAmount(2, 'dl')).toEqual({ quantity: 200, unit: 'g' })
    expect(toBaseAmount(1.5, 'L')).toEqual({ quantity: 1500, unit: 'g' })
  })

  it('accepts spelled-out unit names', () => {
    expect(toBaseAmount(250, 'grammes')).toEqual({ quantity: 250, unit: 'g' })
    expect(toBaseAmount(2, 'Litres')).toEqual({ quantity: 2000, unit: 'g' })
  })

  it('leaves a unit it cannot convert exactly as written', () => {
    expect(toBaseAmount(2, 'cuillères à soupe')).toEqual({ quantity: 2, unit: 'cuillères à soupe' })
    expect(toBaseAmount(4, '')).toEqual({ quantity: 4, unit: '' })
  })

  it('keeps a missing quantity missing', () => {
    expect(toBaseAmount(null, '')).toEqual({ quantity: null, unit: '' })
    expect(toBaseAmount(null, 'g')).toEqual({ quantity: null, unit: 'g' })
  })
})

describe('toDisplayAmount', () => {
  it('promotes a large gram figure to kilos', () => {
    expect(toDisplayAmount(1200, 'g')).toEqual({ quantity: 1.2, unit: 'kg' })
    expect(toDisplayAmount(5500, 'g')).toEqual({ quantity: 5.5, unit: 'kg' })
  })

  it('keeps a figure below the threshold in grams', () => {
    expect(toDisplayAmount(999, 'g')).toEqual({ quantity: 999, unit: 'g' })
  })

  it('leaves other units alone', () => {
    expect(toDisplayAmount(4, '')).toEqual({ quantity: 4, unit: '' })
    expect(toDisplayAmount(2000, 'oeufs')).toEqual({ quantity: 2000, unit: 'oeufs' })
  })
})

describe('formatAmount', () => {
  it.each([
    [200, 'g', '200 g'],
    [1, null, '1'],
    [4, '', '4'],
    [0, 'g', '0 g'],
    [1 / 3, 'l', '0.333 l'],
    [null, 'g', '']
  ])('formats %s %s', (quantity, unit, expected) => {
    expect(formatAmount(quantity, unit)).toBe(expected)
  })
})
