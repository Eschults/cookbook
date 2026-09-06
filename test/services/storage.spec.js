import { describe, expect, it, vi } from 'vitest'
import {
  loadAppState, saveAppState,
  loadLocale, saveLocale,
  loadRecipeCache, saveRecipeCache
} from '../../src/services/storage.js'

describe('recipe cache', () => {
  it('round trips', () => {
    saveRecipeCache({ sha: 'abc123', recipes: [{ slug: 'x' }] })
    expect(loadRecipeCache()).toEqual({ sha: 'abc123', recipes: [{ slug: 'x' }] })
  })

  it('returns null when empty', () => {
    expect(loadRecipeCache()).toBeNull()
  })

  it('returns null rather than throwing on corrupt JSON', () => {
    localStorage.setItem('cookbook:recipe-cache:v2', '{not json')
    expect(loadRecipeCache()).toBeNull()
  })

  it('ignores a v1 cache, whose recipes have the old shape', () => {
    localStorage.setItem('cookbook:recipe-cache:v1', JSON.stringify({ sha: 'old', recipes: [{}] }))
    expect(loadRecipeCache()).toBeNull()
  })
})

describe('app state', () => {
  it('round trips', () => {
    saveAppState({ menu: [{ recipeId: 'r' }], checked: { 'beurre g': 123 }, excluded: ['sel '] })
    expect(loadAppState()).toEqual({ menu: [{ recipeId: 'r' }], checked: { 'beurre g': 123 }, excluded: ['sel '] })
  })

  it('defaults every collection', () => {
    expect(loadAppState()).toEqual({ menu: [], checked: {}, excluded: [] })
  })

  it('repairs a stored value of the wrong shape', () => {
    localStorage.setItem('cookbook:app-state:v1', JSON.stringify({ menu: 'nope', checked: 'nope', excluded: 'nope' }))
    expect(loadAppState()).toEqual({ menu: [], checked: {}, excluded: [] })
  })

  it('survives corrupt JSON', () => {
    localStorage.setItem('cookbook:app-state:v1', 'x')
    expect(loadAppState()).toEqual({ menu: [], checked: {}, excluded: [] })
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
