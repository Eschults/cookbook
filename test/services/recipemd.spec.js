import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  RecipeMDError,
  flattenIngredients,
  parseAmount,
  parseIngredient,
  parseRecipe,
  splitCommaList
} from '../../src/services/recipemd.js'

// jsdom makes import.meta.url an http URL, so resolve from the project root.
const DIR = resolve(process.cwd(), 'test/fixtures/recipemd')
const read = name => readFileSync(resolve(DIR, name), 'utf8')

/** Fractions like 3/7 cannot be compared exactly, so round every factor. */
function roundFactors(value) {
  if (Array.isArray(value)) return value.map(roundFactors)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [
      key,
      key === 'factor' && typeof inner === 'number' ? Number(inner.toFixed(6)) : roundFactors(inner)
    ]))
  }
  return value
}

const fixtures = readdirSync(DIR)
const valid = fixtures.filter(name => name.endsWith('.md') && !name.endsWith('.invalid.md'))
const invalid = fixtures.filter(name => name.endsWith('.invalid.md'))

describe('parseRecipe', () => {
  it('has fixtures to run', () => {
    expect(valid.length).toBeGreaterThan(0)
    expect(invalid.length).toBeGreaterThan(0)
  })

  it.each(valid)('parses %s', name => {
    const expected = JSON.parse(read(name.replace(/\.md$/, '.json')))
    expect(roundFactors(parseRecipe(read(name)))).toEqual(roundFactors(expected))
  })

  it.each(invalid)('rejects %s', name => {
    expect(() => parseRecipe(read(name))).toThrow(RecipeMDError)
  })

  it('accepts CRLF line endings', () => {
    const recipe = parseRecipe('# Title\r\n\r\n---\r\n\r\n- *1 g* salt\r\n')
    expect(recipe.title).toBe('Title')
    expect(recipe.ingredients).toHaveLength(1)
  })
})

describe('parseAmount', () => {
  it.each([
    ['1 1/2 cup', 1.5, 'cup'],
    ['3/7', 3 / 7, null],
    ['½', 0.5, null],
    ['1 ½ kg', 1.5, 'kg'],
    ['.5 l', 0.5, 'l'],
    ['41,9 g', 41.9, 'g'],
    ['-2 g', -2, 'g'],
    ['7', 7, null],
    ['200g', 200, 'g']
  ])('parses %s', (input, factor, unit) => {
    const amount = parseAmount(input)
    expect(amount.factor).toBeCloseTo(factor, 9)
    expect(amount.unit).toBe(unit)
  })

  it('returns null for an empty string', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('   ')).toBeNull()
  })

  it('rejects a unit with no factor', () => {
    expect(() => parseAmount('some')).toThrow(RecipeMDError)
  })
})

describe('splitCommaList', () => {
  it('splits on commas', () => {
    expect(splitCommaList('a, b ,c')).toEqual(['a', 'b', 'c'])
  })

  it('keeps a decimal comma intact', () => {
    expect(splitCommaList('1,5 l, 4 Servings')).toEqual(['1,5 l', '4 Servings'])
  })

  it('drops empty entries', () => {
    expect(splitCommaList('a,,b,')).toEqual(['a', 'b'])
  })
})

describe('parseIngredient', () => {
  it('reads an amount written in emphasis', () => {
    expect(parseIngredient('*20 ml* water')).toEqual({
      name: 'water', amount: { factor: 20, unit: 'ml' }, link: null
    })
  })

  it('leaves emphasis that is not leading alone', () => {
    const ingredient = parseIngredient('ingredients may contain *markdown*')
    expect(ingredient.amount).toBeNull()
    expect(ingredient.name).toBe('ingredients may contain *markdown*')
  })

  it('rejects an ingredient with no name', () => {
    expect(() => parseIngredient('*5 nothings*')).toThrow(RecipeMDError)
  })
})

describe('flattenIngredients', () => {
  it('walks groups depth first and records the group path', () => {
    const recipe = parseRecipe(read('groups.md'))
    const flat = flattenIngredients(recipe)

    expect(flat.map(item => item.name)).toEqual([
      'salt', 'flour', 'eggs', 'water', 'sugar', 'butter'
    ])
    expect(flat.map(item => item.group)).toEqual([
      null, 'Sponge', 'Sponge', 'Sponge › Syrup', 'Sponge › Glaze', 'Frosting'
    ])
  })
})
