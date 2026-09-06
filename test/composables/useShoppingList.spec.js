import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ingredient, makeRecipe } from '../helpers.js'

let useShoppingList

// The store is a module singleton, so it must be rebuilt for every test.
beforeEach(async () => {
  vi.resetModules()
  ;({ useShoppingList } = await import('../../src/composables/useShoppingList.js'))
})

describe('addRecipe', () => {
  it('adds one unchecked row per ingredient and counts them', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)

    expect(list.shoppingList.value).toHaveLength(3)
    expect(list.totalCount.value).toBe(3)
    expect(list.itemCount.value).toBe(3)
    expect(list.shoppingList.value.every(item => !item.checked)).toBe(true)
  })

  it('scales measurable quantities by the multiplier', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 2.5)

    const byName = name => list.shoppingList.value.find(item => item.name === name)
    expect(byName('avocado').quantity).toBe(2.5)
    expect(byName('salt').quantity).toBe(1.25)
    expect(byName('lemon juice').quantity).toBeNull()
  })

  it('gives every row a unique id', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)
    list.addRecipe(makeRecipe({ slug: 'soup', title: 'Soup' }), 1)

    const ids = list.shoppingList.value.map(item => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('records the recipe on the menu', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 2)

    expect(list.menuCount.value).toBe(1)
    expect(list.state.menu[0]).toMatchObject({ recipeId: 'guacamole', multiplier: 2 })
  })

  it('accumulates the multiplier when a recipe is added twice', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 2)
    list.addRecipe(makeRecipe(), 1.5)

    expect(list.state.menu).toHaveLength(1)
    expect(list.state.menu[0].multiplier).toBe(3.5)
  })

  it('merges the second addition into the rows of the first', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 2)
    list.addRecipe(makeRecipe(), 1.5)

    // Three ingredients, still three rows, each scaled to the combined 3.5.
    expect(list.shoppingList.value).toHaveLength(3)
    expect(list.shoppingList.value.map(item => [item.name, item.quantity])).toEqual([
      ['avocado', 3.5], ['salt', 1.75], ['lemon juice', null]
    ])
  })

  it('merges an ingredient shared by two different recipes onto one row', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe({
      slug: 'curry',
      title: 'Curry',
      ingredients: [ingredient('beurre', 50, 'g')]
    }), 1)
    list.addRecipe(makeRecipe({
      slug: 'canneles',
      title: 'Cannelés',
      ingredients: [ingredient('beurre', 30, 'g')]
    }), 2)

    const butter = list.shoppingList.value.filter(item => item.name === 'beurre')
    expect(butter).toHaveLength(1)
    expect(butter[0].quantity).toBe(110)
  })

  it('merges an ingredient the two recipes measure in different units', () => {
    const list = useShoppingList()
    // Crêpes writes milk as "500 g", Cannelés writes it as "500 cL"; both
    // mean the same trip to the same shelf, so they belong on one row.
    list.addRecipe(makeRecipe({
      slug: 'crepes',
      title: 'Crêpes',
      ingredients: [ingredient('lait', 500, 'g')]
    }), 1)
    list.addRecipe(makeRecipe({
      slug: 'canneles',
      title: 'Cannelés',
      ingredients: [ingredient('lait', 500, 'cL')]
    }), 1)

    expect(list.shoppingList.value).toEqual([
      expect.objectContaining({ name: 'lait', quantity: 5500, unit: 'g' })
    ])
  })

  it('keeps an item ticked off when the recipe is added again', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)
    const salt = list.shoppingList.value.find(item => item.name === 'salt')
    list.toggleItem(salt.id)

    list.addRecipe(makeRecipe(), 1)

    expect(list.shoppingList.value.find(item => item.name === 'salt')).toMatchObject({
      checked: true,
      quantity: 1
    })
    expect(list.shoppingList.value.filter(item => item.checked)).toHaveLength(1)
  })

  it('keeps the rows of other recipes untouched', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe({ slug: 'soup', title: 'Soup' }), 1)
    list.addRecipe(makeRecipe(), 1)
    list.addRecipe(makeRecipe(), 1)

    // The two additions of the same recipe merge into its three rows, and
    // the unrelated soup recipe's three rows are untouched by that merge.
    expect(list.shoppingList.value).toHaveLength(3)
    expect(list.state.menu.find(entry => entry.recipeId === 'soup').multiplier).toBe(1)
  })
})

describe('mutations', () => {
  it('toggles an item and updates the outstanding count', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)
    const [first] = list.shoppingList.value

    list.toggleItem(first.id)
    expect(list.shoppingList.value.find(item => item.id === first.id).checked).toBe(true)
    expect(list.itemCount.value).toBe(2)
    expect(list.totalCount.value).toBe(3)

    list.toggleItem(first.id)
    expect(list.shoppingList.value.find(item => item.id === first.id).checked).toBe(false)
  })

  it('ignores a toggle for an unknown id', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)
    expect(() => list.toggleItem('nope')).not.toThrow()
    expect(list.itemCount.value).toBe(3)
  })

  it('excludes a single item from the list', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)
    list.removeItem(list.shoppingList.value[0].id)
    expect(list.shoppingList.value).toHaveLength(2)
  })

  it('clears the list and the menu together', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)
    list.clearList()

    expect(list.shoppingList.value).toEqual([])
    expect(list.state.menu).toEqual([])
  })

  it('removes one recipe from both the list and the menu', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)
    list.addRecipe(makeRecipe({ slug: 'other', title: 'Other' }), 1)

    list.removeRecipe('guacamole')
    expect(list.state.menu.map(entry => entry.recipeId)).toEqual(['other'])
    expect(list.shoppingList.value).toHaveLength(3)
  })
})

describe('persistence', () => {
  it('survives a reload', async () => {
    useShoppingList().addRecipe(makeRecipe(), 2)

    vi.resetModules()
    const reloaded = (await import('../../src/composables/useShoppingList.js')).useShoppingList()

    expect(reloaded.shoppingList.value).toHaveLength(3)
    expect(reloaded.state.menu[0].multiplier).toBe(2)
  })
})
