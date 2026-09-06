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

const alpha = makeRecipe({ id: 'a', slug: 'a', title: 'Alpha' })
const zulu = makeRecipe({ id: 'z', slug: 'z', title: 'Zulu' })

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
    localStorage.setItem('cookbook:recipe-cache:v2', JSON.stringify({ sha: 'sha1', recipes: [alpha] }))
    github.getLatestSha.mockResolvedValue('sha1')

    await useRecipes().refresh()
    expect(github.downloadRecipes).not.toHaveBeenCalled()
  })

  it('re-downloads when the remote sha has moved on', async () => {
    localStorage.setItem('cookbook:recipe-cache:v2', JSON.stringify({ sha: 'old', recipes: [alpha] }))
    github.getLatestSha.mockResolvedValue('new')
    github.downloadRecipes.mockResolvedValue([zulu])

    const { recipes, refresh } = useRecipes()
    await refresh()

    expect(github.downloadRecipes).toHaveBeenCalled()
    expect(recipes.value.map(r => r.title)).toEqual(['Zulu'])
  })

  it('re-downloads on a forced refresh even when the sha matches', async () => {
    localStorage.setItem('cookbook:recipe-cache:v2', JSON.stringify({ sha: 'sha1', recipes: [alpha] }))
    github.getLatestSha.mockResolvedValue('sha1')
    github.downloadRecipes.mockResolvedValue([zulu])

    await useRecipes().refresh(true)
    expect(github.downloadRecipes).toHaveBeenCalled()
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
    localStorage.setItem('cookbook:recipe-cache:v2', JSON.stringify({ sha: 'old', recipes: [alpha] }))
    vi.resetModules()
    const { useRecipes: fresh } = await import('../../src/composables/useRecipes.js')
    const gh = await import('../../src/services/github.js')
    gh.getLatestSha.mockRejectedValue(new Error('offline'))

    const { error, refresh, recipes } = fresh()
    await refresh()

    expect(error.value).toBe('')
    expect(recipes.value).toHaveLength(1)
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
      makeRecipe({ id: 'c', slug: 'c', title: 'Cote' }),
      makeRecipe({ id: 'b', slug: 'b', title: 'Côte' }),
      makeRecipe({ id: 'a', slug: 'a', title: 'Ananas' })
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
    localStorage.setItem('cookbook:recipe-cache:v2', JSON.stringify({ sha: 'sha1', recipes: [zulu, alpha] }))
    vi.resetModules()
    const { useRecipes: fresh } = await import('../../src/composables/useRecipes.js')

    expect(fresh().recipes.value.map(r => r.title)).toEqual(['Alpha', 'Zulu'])
  })
})
