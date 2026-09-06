import { beforeEach, describe, expect, it, vi } from 'vitest'
import MenuView from '../../src/views/MenuView.vue'
import { useShoppingList } from '../../src/composables/useShoppingList.js'
import { makeRecipe, mountView } from '../helpers.js'

const list = useShoppingList()

beforeEach(() => list.clearList())

const clearAll = view => view.findAll('button').find(button => button.text() === 'Tout effacer')

describe('MenuView', () => {
  it('shows the empty state', async () => {
    const view = await mountView(MenuView, { props: { recipes: [] } })
    expect(view.text()).toContain('Aucune recette à votre menu')
  })

  it('lists each planned recipe with its multiplier', async () => {
    list.addRecipe(makeRecipe(), 2)
    const view = await mountView(MenuView, { props: { recipes: [makeRecipe()] } })

    expect(view.text()).toContain('Guacamole')
    expect(view.find('a[href="/r/guacamole"]').exists()).toBe(true)
    expect(view.text()).toContain('×2')
  })

  it('counts the planned meals', async () => {
    const view = await mountView(MenuView, { props: { recipes: [] } })
    expect(view.text()).toContain('0 repas prévu')

    list.addRecipe(makeRecipe(), 1)
    list.addRecipe(makeRecipe({ slug: 'soup', title: 'Soup' }), 1)
    const planned = await mountView(MenuView, { props: { recipes: [] } })
    expect(planned.text()).toContain('2 repas prévus')
  })

  it('flags a recipe that has left the source repository', async () => {
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(MenuView, { props: { recipes: [] } })

    expect(view.text()).toContain('n’est plus présente dans le dépôt source')
    expect(view.find('a[href="/r/guacamole"]').exists()).toBe(false)
  })

  it('offers no clear-all button while the menu is empty', async () => {
    const view = await mountView(MenuView, { props: { recipes: [] } })
    expect(clearAll(view)).toBeUndefined()
  })

  it('clears the menu and the list once the prompt is accepted', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(MenuView, { props: { recipes: [makeRecipe()] } })

    await clearAll(view).trigger('click')
    expect(window.confirm).toHaveBeenCalledWith('Effacer tout le menu et la liste de courses ?')
    expect(list.state.menu).toEqual([])
    expect(list.shoppingList.value).toEqual([])
  })

  it('keeps the menu when the prompt is declined', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(MenuView, { props: { recipes: [makeRecipe()] } })

    await clearAll(view).trigger('click')
    expect(list.state.menu).toHaveLength(1)
  })

  it('removes a recipe from the menu and the list together once confirmed', async () => {
    const confirm = vi.fn(() => true)
    vi.stubGlobal('confirm', confirm)
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(MenuView, { props: { recipes: [makeRecipe()] } })

    await view.findAll('button').find(b => b.text() === 'Retirer').trigger('click')

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Guacamole'))
    expect(list.state.menu).toEqual([])
    expect(list.shoppingList.value).toEqual([])
  })

  it('keeps the recipe on the menu when the removal is declined', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(MenuView, { props: { recipes: [makeRecipe()] } })

    await view.findAll('button').find(b => b.text() === 'Retirer').trigger('click')
    expect(list.state.menu).toHaveLength(1)
  })
})
