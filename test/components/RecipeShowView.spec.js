import { describe, expect, it } from 'vitest'
import RecipeShowView from '../../src/views/RecipeShowView.vue'
import { toRecipe } from '../../src/services/github.js'
import { makeRecipe, mountView } from '../helpers.js'

const show = (recipes, slug) =>
  mountView(RecipeShowView, { props: { recipes }, route: `/recipes/${slug}` })

describe('RecipeShowView', () => {
  it('renders the recipe matching the route', async () => {
    const view = await show([makeRecipe()], 'guacamole')
    expect(view.text()).toContain('Guacamole')
    expect(view.text()).toContain('Some people call it guac.')
  })

  it('shows quantities, units and the yield', async () => {
    const view = await show([makeRecipe()], 'guacamole')
    expect(view.text()).toContain('0.5 teaspoon')
    expect(view.text()).toContain('Pour 4 Servings')
  })

  it('marks an ingredient with no quantity as needed to taste', async () => {
    const view = await show([makeRecipe()], 'guacamole')
    expect(view.text()).toContain('Selon le goût')
  })

  it('numbers the steps', async () => {
    const view = await show([makeRecipe()], 'guacamole')
    const steps = view.findAll('ol li').map(item => item.text())
    expect(steps).toHaveLength(2)
    expect(steps[0]).toContain('Mash the avocado.')
  })

  it('groups ingredients under their group heading', async () => {
    const markdown = '# Cake\n\n---\n\n- *1 pinch* salt\n\n## Sponge\n\n- *200 g* flour\n'
    const view = await show([toRecipe(markdown, 'recipes/cake/recipe.md')], 'cake')

    expect(view.text()).toContain('Sponge')
    expect(view.text()).toContain('200 g')
  })

  it('renders source links', async () => {
    const recipe = makeRecipe({ sources: [{ title: 'Blog', url: 'https://example.org/a' }] })
    const view = await show([recipe], 'guacamole')

    const link = view.findAll('a').find(a => a.text() === 'Blog')
    expect(link.attributes('href')).toBe('https://example.org/a')
  })

  it('links an ingredient that points at another recipe', async () => {
    const recipe = makeRecipe({
      ingredients: [{ name: 'pesto', quantity: null, unit: '', link: './pesto.md', group: null, original: 'pesto', scalable: false }]
    })
    const view = await show([recipe], 'guacamole')
    expect(view.findAll('a').some(a => a.attributes('href') === './pesto.md')).toBe(true)
  })

  it('says so when the slug matches nothing', async () => {
    const view = await show([makeRecipe()], 'missing')
    expect(view.text()).toContain('Recette introuvable')
  })

  it('handles a recipe with no ingredients or instructions', async () => {
    const view = await show([makeRecipe({ ingredients: [], steps: [] })], 'guacamole')
    expect(view.text()).toContain('Cette recette ne liste aucun ingrédient.')
    expect(view.text()).toContain('Cette recette n’a pas d’instructions.')
  })

  it('opens the scaling dialog', async () => {
    const view = await show([makeRecipe()], 'guacamole')
    expect(view.text()).not.toContain('Multiplicateur')

    await view.findAll('button').find(b => b.text().includes('Ajouter')).trigger('click')
    expect(view.text()).toContain('Multiplicateur')
  })
})
