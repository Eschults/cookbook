/**
 * Ingredients that never belong on a shopping list, no matter which recipe
 * calls for them or how much of it — kitchen staples nobody actually shops
 * for, like tap water.
 *
 * Add a name here to exclude another one; the check ignores case and
 * surrounding whitespace, so it matches however a recipe happens to spell it.
 */
const ALWAYS_EXCLUDED_NAMES = ['eau', 'sel', 'poivre', 'huile d’olive']

export function isAlwaysExcludedIngredient(name) {
  return ALWAYS_EXCLUDED_NAMES.includes((name || '').trim().toLowerCase())
}
