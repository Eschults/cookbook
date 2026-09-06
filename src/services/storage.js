// Bumped whenever the parsed recipe shape changes, so stale caches are dropped.
import { LOCALES } from '../i18n/locales.js'

const CACHE_KEY = 'cookbook:recipe-cache:v2'
const STATE_KEY = 'cookbook:app-state:v1'
const LOCALE_KEY = 'cookbook:locale:v1'

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
      menu: Array.isArray(value.menu) ? value.menu : [],
      checked: value.checked && typeof value.checked === 'object' ? value.checked : {},
      excluded: Array.isArray(value.excluded) ? value.excluded : []
    }
  } catch {
    return { menu: [], checked: {}, excluded: [] }
  }
}

export function saveAppState(value) {
  localStorage.setItem(STATE_KEY, JSON.stringify(value))
}

/** Returns the stored locale, or null when nothing valid is stored. */
export function loadLocale() {
  try {
    const value = localStorage.getItem(LOCALE_KEY)
    return LOCALES.includes(value) ? value : null
  } catch {
    return null
  }
}

export function saveLocale(value) {
  if (LOCALES.includes(value)) localStorage.setItem(LOCALE_KEY, value)
}
