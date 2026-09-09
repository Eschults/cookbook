import { beforeEach, describe, expect, it, vi } from 'vitest'
import MenuView from '../../src/views/MenuView.vue'
import { useShoppingList } from '../../src/composables/useShoppingList.js'
import { makeRecipe, mountView } from '../helpers.js'

const list = useShoppingList()

beforeEach(() => list.clearList())

const clearAll = view => view.findAll('button').find(button => button.text() === 'Clear all')
// Icon-only: its accessible name is the only thing to find it by.
const removeButton = view => view.findAll('button').find(button => button.attributes('aria-label') === 'Remove')

describe('MenuView', () => {
  it('shows the empty state', async () => {
    const view = await mountView(MenuView, { props: { recipes: [] } })
    expect(view.text()).toContain('No recipes in your menu')
  })

  it('lists each planned recipe with its multiplier', async () => {
    list.addRecipe(makeRecipe(), 2)
    const view = await mountView(MenuView, { props: { recipes: [makeRecipe()] } })

    expect(view.text()).toContain('Guacamole')
    expect(view.find('a[href="/r/guacamole"]').exists()).toBe(true)
    expect(view.text()).toContain('×2')
  })

  it('shortens the open link on a phone, keeping the full label for readers', async () => {
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(MenuView, { props: { recipes: [makeRecipe()] } })
    const link = view.find('a[href="/r/guacamole"]')

    expect(link.find('.sm\\:hidden').text()).toBe('View')
    expect(link.find('.sm\\:inline').text()).toBe('Open recipe')
    expect(link.attributes('aria-label')).toBe('Open recipe')
  })

  it('counts the planned meals', async () => {
    const view = await mountView(MenuView, { props: { recipes: [] } })
    expect(view.text()).toContain('0 meals planned')

    list.addRecipe(makeRecipe(), 1)
    list.addRecipe(makeRecipe({ slug: 'soup', title: 'Soup' }), 1)
    const planned = await mountView(MenuView, { props: { recipes: [] } })
    expect(planned.text()).toContain('2 meals planned')
  })

  it('flags a recipe that has left the source repository', async () => {
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(MenuView, { props: { recipes: [] } })

    expect(view.text()).toContain('is no longer present in the source repository')
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
    expect(window.confirm).toHaveBeenCalledWith('Clear the whole menu and the shopping list?')
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

    await removeButton(view).trigger('click')

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Guacamole'))
    expect(list.state.menu).toEqual([])
    expect(list.shoppingList.value).toEqual([])
  })

  it('keeps the recipe on the menu when the removal is declined', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(MenuView, { props: { recipes: [makeRecipe()] } })

    await removeButton(view).trigger('click')
    expect(list.state.menu).toHaveLength(1)
  })
})
