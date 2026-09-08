import { LOCALES } from '../i18n/locales.js'

// Bumped whenever the parsed recipe shape changes, so stale caches are dropped.
// v3: a per-file map keyed by path (blob sha + parsed recipe), replacing a flat recipes array.
const CACHE_KEY = 'cookbook:recipe-cache:v3'
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

/**
 * Keeps only the fields a menu entry still has: `recipeId` and `multiplier`
 * are the app's own state, everything else about a recipe (title,
 * ingredients) belongs to GitHub and is looked up live instead. This also
 * drops the `ingredients`/`recipeTitle` a pre-normalisation entry carried,
 * so an existing menu survives the shape change instead of being wiped.
 */
function normalizeMenuEntry(entry) {
  return { recipeId: entry.recipeId, multiplier: entry.multiplier, addedAt: entry.addedAt }
}

/**
 * A line the user typed rather than one a recipe brought in. Unlike a menu
 * entry there is nothing upstream to look it up against, so the name and
 * amount are the state: an extra is only ever what was typed.
 */
function normalizeExtra(entry) {
  return {
    name: String(entry.name),
    quantity: Number.isFinite(entry.quantity) ? entry.quantity : null,
    unit: typeof entry.unit === 'string' ? entry.unit : '',
    addedAt: entry.addedAt
  }
}

/** An extra with no name has no row to render, so it is dropped on read. */
const hasName = entry => entry && typeof entry.name === 'string' && entry.name.trim()

export function loadAppState() {
  try {
    const value = JSON.parse(localStorage.getItem(STATE_KEY) || '{}')
    return {
      menu: Array.isArray(value.menu) ? value.menu.map(normalizeMenuEntry) : [],
      checked: value.checked && typeof value.checked === 'object' ? value.checked : {},
      excluded: Array.isArray(value.excluded) ? value.excluded : [],
      extras: Array.isArray(value.extras) ? value.extras.filter(hasName).map(normalizeExtra) : []
    }
  } catch {
    return { menu: [], checked: {}, excluded: [], extras: [] }
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
