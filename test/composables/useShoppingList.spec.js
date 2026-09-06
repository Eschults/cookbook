import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeRecipe } from '../helpers.js'

let useShoppingList

// The store is a module singleton, so it must be rebuilt for every test.
beforeEach(async () => {
  vi.resetModules()
  ;({ useShoppingList } = await import('../../src/composables/useShoppingList.js'))
})

describe('addRecipe', () => {
  it('adds one line per ingredient and counts them', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)

    expect(list.state.shoppingList).toHaveLength(3)
    expect(list.totalCount.value).toBe(3)
    expect(list.itemCount.value).toBe(3)
  })

  it('scales measurable quantities by the multiplier', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 2.5)

    const [avocado, salt, lemon] = list.state.shoppingList
    expect(avocado.quantity).toBe(2.5)
    expect(salt.quantity).toBe(1.25)
    expect(lemon.quantity).toBeNull()
  })

  it('carries the recipe title and multiplier onto every line', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 3)

    for (const item of list.state.shoppingList) {
      expect(item.recipeTitle).toBe('Guacamole')
      expect(item.multiplier).toBe(3)
      expect(item.checked).toBe(false)
    }
  })

  it('gives every line a unique id', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)
    list.addRecipe(makeRecipe(), 1)

    const ids = list.state.shoppingList.map(item => item.id)
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
    expect(list.state.shoppingList).toHaveLength(6)
  })
})

describe('mutations', () => {
  it('toggles an item and updates the outstanding count', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)
    const [first] = list.state.shoppingList

    list.toggleItem(first.id)
    expect(first.checked).toBe(true)
    expect(list.itemCount.value).toBe(2)
    expect(list.totalCount.value).toBe(3)

    list.toggleItem(first.id)
    expect(first.checked).toBe(false)
  })

  it('ignores a toggle for an unknown id', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)
    expect(() => list.toggleItem('nope')).not.toThrow()
    expect(list.itemCount.value).toBe(3)
  })

  it('removes a single item', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)
    list.removeItem(list.state.shoppingList[0].id)
    expect(list.state.shoppingList).toHaveLength(2)
  })

  it('clears only the checked items', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)
    list.toggleItem(list.state.shoppingList[0].id)
    list.clearChecked()

    expect(list.state.shoppingList).toHaveLength(2)
    expect(list.state.shoppingList.every(item => !item.checked)).toBe(true)
  })

  it('clears the list and the menu together', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)
    list.clearList()

    expect(list.state.shoppingList).toEqual([])
    expect(list.state.menu).toEqual([])
  })

  it('removes one recipe from both the list and the menu', () => {
    const list = useShoppingList()
    list.addRecipe(makeRecipe(), 1)
    list.addRecipe(makeRecipe({ id: 'other', slug: 'other', title: 'Other' }), 1)

    list.removeRecipe('guacamole')
    expect(list.state.menu.map(entry => entry.recipeId)).toEqual(['other'])
    expect(list.state.shoppingList.every(item => item.recipeId === 'other')).toBe(true)
  })
})

describe('persistence', () => {
  it('survives a reload', async () => {
    useShoppingList().addRecipe(makeRecipe(), 2)

    vi.resetModules()
    const reloaded = (await import('../../src/composables/useShoppingList.js')).useShoppingList()

    expect(reloaded.state.shoppingList).toHaveLength(3)
    expect(reloaded.state.menu[0].multiplier).toBe(2)
  })
})
