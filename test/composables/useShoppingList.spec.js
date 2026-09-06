import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeRecipe } from '../helpers.js'

let useShoppingList

// The store is a module singleton, so it must be rebuilt for every test.
beforeEach(async () => {
  vi.resetModules()
  ;({ useShoppingList } = await import('../../src/composables/useShoppingList.js'))
})

describe('addRecipe', () => {
  it('adds one row per ingredient and counts them', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)

    expect(list.shoppingList.value).toHaveLength(3)
    expect(list.totalCount.value).toBe(3)
    expect(list.itemCount.value).toBe(3)
  })

  it('scales measurable quantities by the multiplier', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 2.5)

    const byName = name => list.shoppingList.value.find(item => item.name === name)
    expect(byName('avocado').quantity).toBe(2.5)
    expect(byName('salt').quantity).toBe(1.25)
    expect(byName('lemon juice').quantity).toBeNull()
  })

  it('marks every row unchecked to start', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 3)

    expect(list.shoppingList.value.every(item => !item.checked)).toBe(true)
  })

  it('gives every row a unique id', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)
    list.addRecipe(makeRecipe({ id: 'soup', slug: 'soup', title: 'Soup' }), 1)

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
      id: 'curry',
      slug: 'curry',
      title: 'Curry',
      ingredients: [{ name: 'beurre', quantity: 50, unit: 'g', link: null, group: null, original: '50 g beurre', scalable: true }]
    }), 1)
    list.addRecipe(makeRecipe({
      id: 'canneles',
      slug: 'canneles',
      title: 'Cannelés',
      ingredients: [{ name: 'beurre', quantity: 30, unit: 'g', link: null, group: null, original: '30 g beurre', scalable: true }]
    }), 2)

    const butter = list.shoppingList.value.filter(item => item.name === 'beurre')
    expect(butter).toHaveLength(1)
    expect(butter[0].quantity).toBe(110)
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
    list.addRecipe(makeRecipe({ id: 'soup', slug: 'soup', title: 'Soup' }), 1)
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
    list.addRecipe(makeRecipe({ id: 'other', slug: 'other', title: 'Other' }), 1)

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
