import { describe, expect, it } from 'vitest'
import RecipeIndexView from '../../src/views/RecipeIndexView.vue'
import { i18n } from '../../src/i18n/index.js'
import { makeRecipe, mountView } from '../helpers.js'

const recipes = [
  makeRecipe({ id: 'guac', slug: 'guac', title: 'Guacamole', tags: ['sauce', 'vegan'] }),
  makeRecipe({ id: 'tarte', slug: 'tarte', title: 'Tarte Tatin', tags: ['dessert'], description: 'Caramelised apples.' })
]

describe('RecipeIndexView', () => {
  it('lists every recipe', async () => {
    const view = await mountView(RecipeIndexView, { props: { recipes } })
    expect(view.text()).toContain('Guacamole')
    expect(view.text()).toContain('Tarte Tatin')
  })

  it('shows the ingredient count per card', async () => {
    const view = await mountView(RecipeIndexView, { props: { recipes } })
    expect(view.text()).toContain('3 ingrédients')
  })

  it('filters by search text', async () => {
    const view = await mountView(RecipeIndexView, { props: { recipes } })
    await view.find('#recipe-search').setValue('tatin')

    expect(view.text()).toContain('Tarte Tatin')
    expect(view.text()).not.toContain('Guacamole')
  })

  it('searches the description and tags too', async () => {
    const view = await mountView(RecipeIndexView, { props: { recipes } })
    await view.find('#recipe-search').setValue('caramelised')
    expect(view.text()).toContain('Tarte Tatin')

    await view.find('#recipe-search').setValue('vegan')
    expect(view.text()).toContain('Guacamole')
    expect(view.text()).not.toContain('Tarte Tatin')
  })

  it('filters by tag and offers every tag once, sorted', async () => {
    const view = await mountView(RecipeIndexView, { props: { recipes } })
    const labels = view.findAll('button').map(button => button.text())
    expect(labels).toEqual(['Toutes', 'dessert', 'sauce', 'vegan'])

    await view.findAll('button')[1].trigger('click')
    expect(view.text()).toContain('Tarte Tatin')
    expect(view.text()).not.toContain('Guacamole')
  })

  it('shows the empty state when nothing matches', async () => {
    const view = await mountView(RecipeIndexView, { props: { recipes } })
    await view.find('#recipe-search').setValue('zzzz')
    expect(view.text()).toContain('Aucune recette trouvée')
  })

  it('links each card to its recipe', async () => {
    const view = await mountView(RecipeIndexView, { props: { recipes } })
    const hrefs = view.findAll('a').map(link => link.attributes('href'))
    expect(hrefs).toContain('/r/guac')
  })

  it('titles the page once', async () => {
    const view = await mountView(RecipeIndexView, { props: { recipes } })
    const headings = view.findAll('h1')

    expect(headings).toHaveLength(1)
    expect(headings[0].text()).toBe('Recettes')
  })

  it('follows the active locale', async () => {
    const view = await mountView(RecipeIndexView, { props: { recipes } })
    expect(view.text()).toContain('3 ingrédients')

    i18n.global.locale.value = 'en'
    await view.vm.$nextTick()
    expect(view.text()).toContain('3 ingredients')
  })
})
