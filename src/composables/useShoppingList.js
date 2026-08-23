import { computed, reactive } from 'vue'
import { loadAppState, saveAppState } from '../services/storage.js'

const state = reactive(loadAppState())

function persist() {
  saveAppState({
    shoppingList: state.shoppingList,
    menu: state.menu
  })
}

export function useShoppingList() {
  const itemCount = computed(() => state.shoppingList.filter(item => !item.checked).length)
  const totalCount = computed(() => state.shoppingList.length)
  const menuCount = computed(() => state.menu.length)

  function addRecipe(recipe, multiplier) {
    const entryId = `${recipe.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const items = recipe.ingredients.map((ingredient, index) => ({
      id: `${entryId}-${index}`,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      multiplier,
      original: ingredient.original,
      name: ingredient.name,
      quantity: ingredient.quantity == null ? null : ingredient.quantity * multiplier,
      unit: ingredient.unit || '',
      checked: false,
      scalable: ingredient.scalable !== false
    }))

    state.shoppingList.push(...items)

    const existing = state.menu.find(item => item.recipeId === recipe.id)
    if (existing) {
      existing.multiplier += multiplier
      existing.addedAt = new Date().toISOString()
    } else {
      state.menu.push({
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        multiplier,
        addedAt: new Date().toISOString()
      })
    }

    persist()
  }

  function toggleItem(id) {
    const item = state.shoppingList.find(item => item.id === id)
    if (item) {
      item.checked = !item.checked
      persist()
    }
  }

  function removeItem(id) {
    state.shoppingList = state.shoppingList.filter(item => item.id !== id)
    persist()
  }

  function clearChecked() {
    state.shoppingList = state.shoppingList.filter(item => !item.checked)
    persist()
  }

  function clearList() {
    state.shoppingList = []
    state.menu = []
    persist()
  }

  function removeRecipe(recipeId) {
    state.shoppingList = state.shoppingList.filter(item => item.recipeId !== recipeId)
    state.menu = state.menu.filter(item => item.recipeId !== recipeId)
    persist()
  }

  return {
    state,
    itemCount,
    totalCount,
    menuCount,
    addRecipe,
    toggleItem,
    removeItem,
    clearChecked,
    clearList,
    removeRecipe
  }
}