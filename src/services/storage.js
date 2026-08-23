const CACHE_KEY = 'cookbook:recipe-cache:v1'
const STATE_KEY = 'cookbook:app-state:v1'

export function loadRecipeCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
  } catch {
    return null
  }
}

export function saveRecipeCache(value) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(value))
}

export function loadAppState() {
  try {
    const value = JSON.parse(localStorage.getItem(STATE_KEY) || '{}')
    return {
      shoppingList: Array.isArray(value.shoppingList) ? value.shoppingList : [],
      menu: Array.isArray(value.menu) ? value.menu : []
    }
  } catch {
    return { shoppingList: [], menu: [] }
  }
}

export function saveAppState(value) {
  localStorage.setItem(STATE_KEY, JSON.stringify(value))
}
