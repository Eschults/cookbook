/**
 * Ingredient names in the source recipes are written in the singular — "2
 * oeuf", not "2 oeufs" — since the recipe author names the thing, not the
 * count of it. This module puts the plural back for display when the count
 * calls for it.
 *
 * Only counted ingredients pluralize: a bare number with no unit, like "2
 * oignon". An ingredient measured in grams, litres, spoons and the like
 * keeps its name as written — "500 g farine" has nothing to pluralize, and
 * "2 cuillères à soupe" already carries its own plural in the unit.
 */

/** A count only reads as plural in French from 2 upward; 0 and 1 stay singular. */
export function shouldPluralize(quantity, unit) {
  return !unit && quantity != null && Number.isInteger(quantity) && quantity >= 2
}

/** Endings that take an "x" rather than an "s": gâteau → gâteaux, noyau → noyaux. */
const X_PLURAL = /e?au$/i

function pluralizeWord(word) {
  if (/[sxz]$/i.test(word)) return word
  if (X_PLURAL.test(word)) return `${word}x`
  return `${word}s`
}

/**
 * Pluralizes an ingredient name. Recipes name a counted ingredient noun
 * first — "gousse d'ail", "feuille de lasagne précuite" — so only that first
 * word is put in the plural; anything after it (a "de" complement, a
 * trailing adjective) is left exactly as written.
 */
export function pluralizeIngredientName(name) {
  const [first, ...rest] = name.split(' ')
  return [pluralizeWord(first), ...rest].join(' ')
}
