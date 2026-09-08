import { describe, expect, it, vi } from 'vitest'
import {
  loadAppState, saveAppState,
  loadLocale, saveLocale,
  loadRecipeCache, saveRecipeCache
} from '../../src/services/storage.js'

describe('recipe cache', () => {
  it('round trips', () => {
    saveRecipeCache({ sha: 'abc123', files: { x: { sha: 'blob1', recipe: { slug: 'x' } } } })
    expect(loadRecipeCache()).toEqual({ sha: 'abc123', files: { x: { sha: 'blob1', recipe: { slug: 'x' } } } })
  })

  it('returns null when empty', () => {
    expect(loadRecipeCache()).toBeNull()
  })

  it('returns null rather than throwing on corrupt JSON', () => {
    localStorage.setItem('cookbook:recipe-cache:v3', '{not json')
    expect(loadRecipeCache()).toBeNull()
  })

  it('ignores a v2 cache, whose recipes have the old flat-array shape', () => {
    localStorage.setItem('cookbook:recipe-cache:v2', JSON.stringify({ sha: 'old', recipes: [{}] }))
    expect(loadRecipeCache()).toBeNull()
  })
})

describe('app state', () => {
  const empty = { menu: [], checked: {}, excluded: [], extras: [] }

  it('round trips', () => {
    const state = {
      menu: [{ recipeId: 'r' }],
      checked: { 'beurre g': 123 },
      excluded: ['sel '],
      extras: [{ name: 'huile d’olive', quantity: 2, unit: 'bouteilles', addedAt: '2026-01-01T00:00:00.000Z' }]
    }
    saveAppState(state)
    expect(loadAppState()).toEqual(state)
  })

  it('defaults every collection', () => {
    expect(loadAppState()).toEqual(empty)
  })

  it('repairs a stored value of the wrong shape', () => {
    localStorage.setItem('cookbook:app-state:v1', JSON.stringify({ menu: 'nope', checked: 'nope', excluded: 'nope', extras: 'nope' }))
    expect(loadAppState()).toEqual(empty)
  })

  it('survives corrupt JSON', () => {
    localStorage.setItem('cookbook:app-state:v1', 'x')
    expect(loadAppState()).toEqual(empty)
  })

  it('defaults extras written before they existed', () => {
    localStorage.setItem('cookbook:app-state:v1', JSON.stringify({ menu: [], checked: {}, excluded: [] }))
    expect(loadAppState().extras).toEqual([])
  })

  it('drops an extra with no usable name and repairs the rest', () => {
    localStorage.setItem('cookbook:app-state:v1', JSON.stringify({
      extras: [{ name: '  ' }, { name: 'sel', quantity: 'lots', unit: 42 }]
    }))
    expect(loadAppState().extras).toEqual([{ name: 'sel', quantity: null, unit: '', addedAt: undefined }])
  })
})

describe('locale', () => {
  it('round trips a supported locale', () => {
    saveLocale('en')
    expect(loadLocale()).toBe('en')
  })

  it('returns null when nothing is stored', () => {
    expect(loadLocale()).toBeNull()
  })

  it('rejects a locale that is not supported', () => {
    localStorage.setItem('cookbook:locale:v1', 'de')
    expect(loadLocale()).toBeNull()
  })

  it('refuses to store an unsupported locale', () => {
    saveLocale('de')
    expect(localStorage.getItem('cookbook:locale:v1')).toBeNull()
  })

  it('returns null when localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
    expect(loadLocale()).toBeNull()
  })
})
