import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ShoppingListView from '../../src/views/ShoppingListView.vue'
import { useShoppingList } from '../../src/composables/useShoppingList.js'
import { i18n } from '../../src/i18n/index.js'
import { ingredient, makeRecipe, mountView } from '../helpers.js'

const list = useShoppingList()

/** Three ingredients whose names sort differently from their written order. */
const greengrocer = [ingredient('zucchini', 2), ingredient('échalote', 1), ingredient('ail', 3)]

beforeEach(() => list.clearList())
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('ShoppingListView', () => {
  it('shows the empty state', async () => {
    const view = await mountView(ShoppingListView)
    expect(view.text()).toContain('Votre panier est vide')
  })

  it('lists every ingredient as one flat list', async () => {
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)

    expect(view.text()).toContain('Avocado')
    expect(view.text()).toContain('Lemon juice')
    expect(view.findAll('li')).toHaveLength(3)
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

    // The click handler lives on the row's content div, not the <li> itself,
    // since the <li> also hosts the swipe-to-delete overlay on mobile.
    await view.find('li > div').trigger('click')
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

    // The desktop text button asks for confirmation; the mobile swipe
    // button (below) does not, since the swipe itself is the confirmation.
    await view.find('button.sm\\:inline-block').trigger('click')

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Avocado'))
    expect(list.shoppingList.value).toHaveLength(2)
  })

  it('keeps the item when the confirmation is dismissed', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)

    await view.find('button.sm\\:inline-block').trigger('click')
    expect(list.shoppingList.value).toHaveLength(3)
  })

  it('does not check the item off while removing it', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)

    await view.find('button.sm\\:inline-block').trigger('click')
    expect(list.itemCount.value).toBe(3)
  })

  it('removes an item on mobile with a tap, without confirmation', async () => {
    const confirm = vi.fn(() => true)
    vi.stubGlobal('confirm', confirm)
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)

    await view.find('button.sm\\:hidden').trigger('click')

    expect(confirm).not.toHaveBeenCalled()
    expect(list.shoppingList.value).toHaveLength(2)
  })

  it('leads with the ingredient name and trails the quantity', async () => {
    list.addRecipe(makeRecipe({ ingredients: [ingredient('flour', 200, 'g')] }), 1)
    const view = await mountView(ShoppingListView)
    const flour = view.find('li')

    expect(flour.find('span.font-bold').text()).toBe('Flour')
    expect(flour.find('span.text-slate-500').text()).toBe('200 g')
  })

  it('orders each group alphabetically by ingredient name', async () => {
    list.addRecipe(makeRecipe({ ingredients: greengrocer }), 1)
    const view = await mountView(ShoppingListView)
    const names = view.findAll('li span.font-bold').map(node => node.text())

    expect(names).toEqual(['Ail', 'Échalote', 'Zucchini'])
  })

  it('sinks checked items to the bottom of their group, alphabetical within each half', async () => {
    list.addRecipe(makeRecipe({ ingredients: greengrocer }), 1)
    list.toggleItem(list.shoppingList.value.find(item => item.name === 'zucchini').id)
    const view = await mountView(ShoppingListView)
    const names = view.findAll('li span.font-bold').map(node => node.text())

    expect(names).toEqual(['Ail', 'Échalote', 'Zucchini'])

    await view.find('li > div').trigger('click')
    const reordered = view.findAll('li span.font-bold').map(node => node.text())
    expect(reordered).toEqual(['Échalote', 'Ail', 'Zucchini'])
  })

  it('orders checked items by most recently checked first', async () => {
    list.addRecipe(makeRecipe({ ingredients: greengrocer }), 1)
    // Both checks can land in the same millisecond on a fast machine, so pin
    // Date.now() explicitly rather than relying on real spacing between calls.
    const now = vi.spyOn(Date, 'now')
    now.mockReturnValueOnce(1)
    list.toggleItem(list.shoppingList.value.find(item => item.name === 'zucchini').id)
    now.mockReturnValueOnce(2)
    list.toggleItem(list.shoppingList.value.find(item => item.name === 'ail').id)
    const view = await mountView(ShoppingListView)
    const names = view.findAll('li span.font-bold').map(node => node.text())

    expect(names).toEqual(['Échalote', 'Ail', 'Zucchini'])
  })

  it('clears the whole list once the confirmation is accepted', async () => {
    const confirm = vi.fn(() => true)
    vi.stubGlobal('confirm', confirm)
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)

    await view.findAll('button').find(b => b.text() === 'Tout effacer').trigger('click')

    expect(confirm).toHaveBeenCalledWith('Effacer toute la liste de courses\u00A0?')
    expect(list.shoppingList.value).toHaveLength(0)
  })

  it('keeps the list when the clear confirmation is dismissed', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)

    await view.findAll('button').find(b => b.text() === 'Tout effacer').trigger('click')
    expect(list.shoppingList.value).toHaveLength(3)
  })

  it('scales the displayed quantity by the multiplier', async () => {
    list.addRecipe(makeRecipe({ ingredients: [ingredient('flour', 0.5, 'g')] }), 3)
    const view = await mountView(ShoppingListView)
    expect(view.text()).toContain('1,5 g')
  })

  it('hides the quantity for spoon- and pinch-based units', async () => {
    list.addRecipe(makeRecipe({
      ingredients: [
        ingredient('salt', 0.5, 'teaspoon'),
        ingredient('sugar', 2, 'cuillère à soupe'),
        ingredient('pepper', 1, 'pincée'),
        ingredient('flour', 200, 'g')
      ]
    }), 1)
    const view = await mountView(ShoppingListView)

    expect(view.text()).not.toContain('0,5')
    expect(view.text()).not.toContain('teaspoon')
    expect(view.text()).not.toContain('cuillère')
    expect(view.text()).not.toContain('pincée')
    expect(view.text()).toContain('200 g')
  })

  it('shows a large gram figure in kilos', async () => {
    list.addRecipe(makeRecipe({
      ingredients: [ingredient('flour', 1200, 'g'), ingredient('milk', 150, 'cl')]
    }), 1)
    const view = await mountView(ShoppingListView)

    expect(view.text()).toContain('1,2 kg')
    // 150 cL normalises to 1500 g, which then reads as kilos like any other.
    expect(view.text()).toContain('1,5 kg')
  })

  it('follows the active locale', async () => {
    list.addRecipe(makeRecipe(), 1)
    const view = await mountView(ShoppingListView)
    expect(view.text()).toContain('3 restants')

    i18n.global.locale.value = 'en'
    await view.vm.$nextTick()
    expect(view.text()).toContain('3 remaining')
  })
})
