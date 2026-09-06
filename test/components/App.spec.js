import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { makeRecipe } from '../helpers.js'

vi.mock('../../src/services/github.js', () => ({
  getLatestSha: vi.fn(),
  downloadRecipes: vi.fn()
}))

let App, github, i18n, routes

// The whole tree is re-imported per test so useRecipes starts empty. Everything
// mounted must come from this same registry, or the component tree and
// useLocale would end up holding two different i18n instances.
beforeEach(async () => {
  vi.resetModules()
  github = await import('../../src/services/github.js')
  github.getLatestSha.mockReset().mockResolvedValue('abc1234def')
  github.downloadRecipes.mockReset().mockResolvedValue([makeRecipe()])
  ;({ i18n } = await import('../../src/i18n/index.js'))
  ;({ routes } = await import('../../src/router.js'))
  App = (await import('../../src/App.vue')).default
})

async function mountApp(route = '/') {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(route)
  await router.isReady()

  const app = mount(App, { global: { plugins: [i18n, router] } })
  await flushPromises()
  return app
}

describe('App', () => {
  it('loads recipes on mount and renders the index', async () => {
    const app = await mountApp()
    expect(github.getLatestSha).toHaveBeenCalled()
    expect(app.text()).toContain('Guacamole')
  })

  it('renders the navigation and the cache marker', async () => {
    const app = await mountApp()
    expect(app.text()).toContain('Recettes')
    expect(app.text()).toContain('Menu')
    expect(app.text()).toContain('abc1234')
  })

  it('shows an error banner and can retry', async () => {
    github.getLatestSha.mockRejectedValueOnce(new Error('network down'))
    const app = await mountApp()

    expect(app.text()).toContain('Impossible de charger les recettes')
    expect(app.text()).toContain('network down')

    await app.findAll('button').find(b => b.text() === 'Réessayer').trigger('click')
    await flushPromises()
    expect(app.text()).toContain('Guacamole')
  })

  it('links the source repository from the footer', async () => {
    const app = await mountApp()
    const link = app.findAll('a').find(a => a.text() === 'ssaunier/recipes')

    expect(link.attributes('href')).toBe('https://github.com/ssaunier/recipes')
    expect(link.attributes('rel')).toBe('noreferrer')
  })

  it('refreshes on demand from the footer', async () => {
    const app = await mountApp()
    const refresh = app.findAll('button').find(b => b.text() === 'Actualiser')

    await refresh.trigger('click')
    await flushPromises()
    expect(github.downloadRecipes).toHaveBeenCalledTimes(2)
  })

  it('switches locale from the footer and persists it', async () => {
    const app = await mountApp()
    const en = app.findAll('button').find(b => b.text() === 'en')

    await en.trigger('click')
    await flushPromises()

    expect(app.text()).toContain('Recipes')
    expect(app.text()).toContain('Refresh')
    expect(localStorage.getItem('cookbook:locale:v1')).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('shows a badge once the shopping list has items', async () => {
    const app = await mountApp()
    const { useShoppingList } = await import('../../src/composables/useShoppingList.js')
    const list = useShoppingList()
    list.clearList()
    list.addRecipe(makeRecipe(), 1)
    await app.vm.$nextTick()

    expect(app.find('nav').text()).toMatch(/Liste\s*3/)
    list.clearList()
  })

  it('navigates to the shopping list route', async () => {
    const app = await mountApp('/shopping-list')
    expect(app.text()).toContain('Liste de courses')
  })
})
