import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeRecipe } from '../helpers.js'

vi.mock('../../src/services/github.js', () => ({
  getLatestSha: vi.fn(),
  downloadRecipes: vi.fn()
}))

let useRecipes, github, i18n

beforeEach(async () => {
  vi.resetModules()
  github = await import('../../src/services/github.js')
  github.getLatestSha.mockReset()
  github.downloadRecipes.mockReset()
  ;({ useRecipes } = await import('../../src/composables/useRecipes.js'))
  ;({ i18n } = await import('../../src/i18n/index.js'))
})

const alpha = makeRecipe({ slug: 'a', title: 'Alpha' })
const zulu = makeRecipe({ slug: 'z', title: 'Zulu' })

/**
 * Seeds the cache and re-imports the composable, the way a page load finds
 * it. The cache is read once at import, so a test that writes to
 * localStorage after importing would be seeding a store nobody re-reads.
 * Re-importing hands back a fresh github mock too, which the caller arms.
 */
async function reloadWithCache(cache) {
  localStorage.setItem('cookbook:recipe-cache:v2', JSON.stringify(cache))
  vi.resetModules()
  const composable = await import('../../src/composables/useRecipes.js')
  const mocked = await import('../../src/services/github.js')
  return { store: composable.useRecipes(), github: mocked }
}

describe('refresh', () => {
  it('downloads and caches when there is no cache', async () => {
    github.getLatestSha.mockResolvedValue('sha1')
    github.downloadRecipes.mockResolvedValue([zulu, alpha])

    const { recipes, refresh, cachedSha } = useRecipes()
    await refresh()

    expect(recipes.value.map(r => r.title)).toEqual(['Alpha', 'Zulu'])
    expect(cachedSha.value).toBe('sha1')
    expect(JSON.parse(localStorage.getItem('cookbook:recipe-cache:v2')).sha).toBe('sha1')
  })

  it('does not re-download when the cached sha still matches', async () => {
    const { store, github: gh } = await reloadWithCache({ sha: 'sha1', recipes: [alpha] })
    gh.getLatestSha.mockResolvedValue('sha1')

    await store.refresh()
    expect(gh.downloadRecipes).not.toHaveBeenCalled()
  })

  it('re-downloads when the remote sha has moved on', async () => {
    const { store, github: gh } = await reloadWithCache({ sha: 'old', recipes: [alpha] })
    gh.getLatestSha.mockResolvedValue('new')
    gh.downloadRecipes.mockResolvedValue([zulu])

    await store.refresh()

    expect(gh.downloadRecipes).toHaveBeenCalled()
    expect(store.recipes.value.map(r => r.title)).toEqual(['Zulu'])
  })

  it('will not run two refreshes at once', async () => {
    github.getLatestSha.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('sha1'), 5)))
    github.downloadRecipes.mockResolvedValue([alpha])

    const { refresh } = useRecipes()
    await Promise.all([refresh(), refresh()])
    expect(github.getLatestSha).toHaveBeenCalledTimes(1)
  })
})

describe('failure handling', () => {
  it('surfaces the error when there is nothing to show', async () => {
    github.getLatestSha.mockRejectedValue(new Error('offline'))

    const { error, refresh, recipes } = useRecipes()
    await refresh()

    expect(error.value).toBe('offline')
    expect(recipes.value).toEqual([])
  })

  it('stays quiet when cached recipes are already on screen', async () => {
    const { store, github: gh } = await reloadWithCache({ sha: 'old', recipes: [alpha] })
    gh.getLatestSha.mockRejectedValue(new Error('offline'))

    await store.refresh()

    expect(store.error.value).toBe('')
    expect(store.recipes.value).toHaveLength(1)
  })

  it('falls back to a translated message when the error has none', async () => {
    github.getLatestSha.mockRejectedValue({})

    const { error, refresh } = useRecipes()
    await refresh()

    expect(error.value).toBe('Erreur inconnue')
  })
})

describe('ordering', () => {
  it('re-sorts when the locale changes, without re-downloading', async () => {
    github.getLatestSha.mockResolvedValue('sha1')
    github.downloadRecipes.mockResolvedValue([
      makeRecipe({ slug: 'c', title: 'Cote' }),
      makeRecipe({ slug: 'b', title: 'Côte' }),
      makeRecipe({ slug: 'a', title: 'Ananas' })
    ])

    const { recipes, refresh } = useRecipes()
    await refresh()

    expect(recipes.value[0].title).toBe('Ananas')
    const calls = github.downloadRecipes.mock.calls.length

    i18n.global.locale.value = 'en'
    expect(recipes.value[0].title).toBe('Ananas')
    expect(github.downloadRecipes.mock.calls.length).toBe(calls)
  })

  it('sorts cached recipes on read, not at download time', async () => {
    const { store } = await reloadWithCache({ sha: 'sha1', recipes: [zulu, alpha] })

    expect(store.recipes.value.map(r => r.title)).toEqual(['Alpha', 'Zulu'])
  })
})
