import { beforeEach, describe, expect, it } from 'vitest'
import MenuView from '../../src/views/MenuView.vue'
import { useShoppingList } from '../../src/composables/useShoppingList.js'
import { makeRecipe, mountView } from '../helpers.js'

const list = useShoppingList()

beforeEach(() => list.clearList())

describe('MenuView', () => {
  it('shows the empty state', async () => {
    const view = await mountView(MenuView, { props: { recipes: [] } })
    expect(view.text()).toContain('Aucune recette à votre menu')
  })

  it('lists each planned recipe with its multiplier', async () => {
    list.addRecipe(makeRecipe(), 2)
    const view = await mountView(MenuView, { props: { recipes: [makeRecipe()] } })

    expect(view.text()).toContain('Guacamole')
    expect(view.text()).toContain('×2')
    expect(view.find('a[href="/recipes/guacamole"]').exists()).toBe(true)
  })

  it('flags a recipe that has left the source repository', async () => {
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(MenuView, { props: { recipes: [] } })

    expect(view.text()).toContain('n’est plus présente dans le dépôt source')
    expect(view.find('a[href="/recipes/guacamole"]').exists()).toBe(false)
  })

  it('removes a recipe from the menu and the list together', async () => {
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(MenuView, { props: { recipes: [makeRecipe()] } })

    await view.findAll('button').find(b => b.text() === 'Retirer').trigger('click')
    expect(list.state.menu).toEqual([])
    expect(list.state.shoppingList).toEqual([])
  })
})
