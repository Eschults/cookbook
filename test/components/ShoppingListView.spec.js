import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ShoppingListView from '../../src/views/ShoppingListView.vue'
import { useShoppingList } from '../../src/composables/useShoppingList.js'
import { i18n } from '../../src/i18n/index.js'
import { makeRecipe, mountView } from '../helpers.js'

const list = useShoppingList()

beforeEach(() => list.clearList())
afterEach(() => vi.unstubAllGlobals())

describe('ShoppingListView', () => {
  it('shows the empty state', async () => {
    const view = await mountView(ShoppingListView)
    expect(view.text()).toContain('Votre panier est vide')
  })

  it('lists items grouped by whether they carry a unit', async () => {
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)

    expect(view.text()).toContain('Articles mesurés')
    expect(view.text()).toContain('Autres')
    expect(view.text()).toContain('0.5 teaspoon')
    expect(view.text()).toContain('Lemon juice')
  })

  it('counts what is left against the total', async () => {
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)
    expect(view.text()).toContain('3 restants')
    expect(view.text()).toContain('3 au total')
  })

  it('checks an item off', async () => {
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)

    await view.find('[aria-label="Cocher l’article"]').trigger('click')
    expect(list.itemCount.value).toBe(2)
    expect(view.text()).toContain('2 restants')
    expect(view.find('[aria-label="Décocher l’article"]').exists()).toBe(true)
  })

  it('checks an item off by clicking anywhere on the row', async () => {
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)

    await view.find('li').trigger('click')
    expect(list.itemCount.value).toBe(2)
  })

  it('toggles only once when the checkbox itself is clicked', async () => {
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)

    // The row handler must not fire as well, or the item would toggle back.
    await view.find('[aria-label="Cocher l’article"]').trigger('click')
    expect(list.itemCount.value).toBe(2)
  })

  it('removes an item once the confirmation is accepted', async () => {
    const confirm = vi.fn(() => true)
    vi.stubGlobal('confirm', confirm)
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)

    await view.findAll('button').find(b => b.text() === 'Retirer').trigger('click')

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Avocado'))
    expect(list.state.shoppingList).toHaveLength(2)
  })

  it('keeps the item when the confirmation is dismissed', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)

    await view.findAll('button').find(b => b.text() === 'Retirer').trigger('click')
    expect(list.state.shoppingList).toHaveLength(3)
  })

  it('does not check the item off while removing it', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)

    await view.findAll('button').find(b => b.text() === 'Retirer').trigger('click')
    expect(list.itemCount.value).toBe(3)
  })

  it('clears the checked items only', async () => {
    list.addRecipe(makeRecipe(), 1)
    list.toggleItem(list.state.shoppingList[0].id)
    const view = await mountView(ShoppingListView)

    await view.findAll('button').find(b => b.text() === 'Effacer les articles cochés').trigger('click')
    expect(list.state.shoppingList).toHaveLength(2)
  })

  it('leads with the ingredient name and trails the quantity', async () => {
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)
    const salt = view.findAll('li').find(row => row.text().includes('Salt'))

    // .text() drops the whitespace between the two spans, hence the tight match.
    expect(salt.text()).toMatch(/^Salt0\.5 teaspoon/)
    expect(salt.find('span.font-bold').text()).toBe('Salt')
  })

  it('orders each group alphabetically by ingredient name', async () => {
    list.addRecipe(makeRecipe({
      ingredients: [
        { name: 'zucchini', quantity: 2, unit: '', link: null, group: null, original: '2 zucchini', scalable: true },
        { name: 'échalote', quantity: 1, unit: '', link: null, group: null, original: '1 échalote', scalable: true },
        { name: 'ail', quantity: 3, unit: '', link: null, group: null, original: '3 ail', scalable: true }
      ]
    }), 1)
    const view = await mountView(ShoppingListView)
    const names = view.findAll('li span.font-bold').map(node => node.text())

    expect(names).toEqual(['Ail', 'Échalote', 'Zucchini'])
  })

  it('clears the whole list once the confirmation is accepted', async () => {
    const confirm = vi.fn(() => true)
    vi.stubGlobal('confirm', confirm)
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)

    await view.findAll('button').find(b => b.text() === 'Tout effacer').trigger('click')

    expect(confirm).toHaveBeenCalledWith('Effacer toute la liste de courses\u00A0?')
    expect(list.state.shoppingList).toHaveLength(0)
  })

  it('keeps the list when the clear confirmation is dismissed', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)

    await view.findAll('button').find(b => b.text() === 'Tout effacer').trigger('click')
    expect(list.state.shoppingList).toHaveLength(3)
  })

  it('scales the displayed quantity by the multiplier', async () => {
    list.addRecipe(makeRecipe(), 3)
    const view = await mountView(ShoppingListView)
    expect(view.text()).toContain('1.5 teaspoon')
  })

  it('keeps group identity stable across a locale change', async () => {
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)
    expect(view.text()).toContain('Articles mesurés')

    i18n.global.locale.value = 'en'
    await view.vm.$nextTick()
    expect(view.text()).toContain('Measured items')
    expect(view.text()).toContain('3 remaining')
  })
})
