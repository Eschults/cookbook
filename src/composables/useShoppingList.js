import { computed, reactive } from 'vue'
import { loadAppState, saveAppState } from '../services/storage.js'
import { toBaseAmount } from '../services/units.js'

const state = reactive(loadAppState())

function persist() {
  saveAppState({
    menu: state.menu,
    checked: state.checked,
    excluded: state.excluded
  })
}

/** Identifies the same thing to buy across recipes: two recipes that both want butter share one row. */
const itemKey = (name, unit) => `${name} ${unit}`

export function useShoppingList() {
  /**
   * The list is rebuilt from the menu's recipes on every read instead of
   * being stored as its own snapshot. That is what lets two different
   * recipes that both need butter collapse onto a single row with the
   * summed quantity — a snapshot-per-recipe only ever merged an ingredient
   * against itself, so the same ingredient coming from two recipes produced
   * two separate lines.
   *
   * Amounts are converted to a canonical unit before they are keyed, so the
   * same ingredient measured two different ways — "500 g lait" in one recipe,
   * "500 cL" in another — merges rather than splitting into two rows that
   * each read in their own unit.
   */
  const shoppingList = computed(() => {
    const rows = new Map()
    for (const entry of state.menu) {
      for (const ingredient of entry.ingredients) {
        const scaled = ingredient.quantity == null ? null : ingredient.quantity * entry.multiplier
        const amount = toBaseAmount(scaled, ingredient.unit)
        const key = itemKey(ingredient.name, amount.unit)
        if (state.excluded.includes(key)) continue
        const existing = rows.get(key)
        if (existing) {
          if (amount.quantity != null) existing.quantity = (existing.quantity ?? 0) + amount.quantity
        } else {
          rows.set(key, {
            id: key,
            name: ingredient.name,
            unit: amount.unit,
            quantity: amount.quantity,
            checked: Boolean(state.checked[key]),
            checkedAt: state.checked[key] || null
          })
        }
      }
    }
    return [...rows.values()]
  })

  const itemCount = computed(() => shoppingList.value.filter(item => !item.checked).length)
  const totalCount = computed(() => shoppingList.value.length)
  const menuCount = computed(() => state.menu.length)

  /**
   * Adding a recipe that is already on the menu raises its multiplier
   * instead of listing its ingredients a second time, and refreshes the
   * ingredient snapshot to whatever the recipe currently declares.
   */
  function addRecipe(recipe, multiplier) {
    const entry = state.menu.find(item => item.recipeId === recipe.id)
    const ingredients = recipe.ingredients.map(ingredient => ({
      name: ingredient.name,
      unit: ingredient.unit || '',
      quantity: ingredient.quantity
    }))

    if (entry) {
      entry.multiplier += multiplier
      entry.ingredients = ingredients
      entry.recipeTitle = recipe.title
      entry.addedAt = new Date().toISOString()
    } else {
      state.menu.push({
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        multiplier,
        ingredients,
        addedAt: new Date().toISOString()
      })
    }

    persist()
  }

  function toggleItem(id) {
    if (state.checked[id]) delete state.checked[id]
    else state.checked[id] = Date.now()
    persist()
  }

  /** Excludes the ingredient from the derived list, e.g. because it's already in the pantry. */
  function removeItem(id) {
    if (!state.excluded.includes(id)) state.excluded.push(id)
    delete state.checked[id]
    persist()
  }

  function clearList() {
    state.menu = []
    state.checked = {}
    state.excluded = []
    persist()
  }

  function removeRecipe(recipeId) {
    state.menu = state.menu.filter(item => item.recipeId !== recipeId)
    persist()
  }

  return {
    state,
    shoppingList,
    itemCount,
    totalCount,
    menuCount,
    addRecipe,
    toggleItem,
    removeItem,
    clearList,
    removeRecipe
  }
}
