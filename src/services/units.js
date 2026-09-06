/**
 * Unit handling for the shopping list.
 *
 * Recipes measure the same ingredient in whichever unit their author found
 * convenient: one writes "500 g lait", another "500 cL". A shopping list wants
 * a single line per thing to buy, so every metric amount is converted to one
 * canonical unit before the rows are merged.
 *
 * That canonical unit is the gram, and a millilitre is treated as a gram. It
 * is not true in physics — a litre of oil is not a kilo — but it is what a
 * cook means when they write milk as either, and it is the only way to put
 * two differently-measured lines of the same ingredient onto one row.
 */

/** How many grams one of each metric unit is worth. */
const GRAMS_PER_UNIT = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  ml: 1,
  cl: 10,
  dl: 100,
  l: 1000
}

/** Spellings that mean one of the units above. Lower-cased before lookup. */
const ALIASES = {
  gr: 'g',
  gram: 'g',
  grams: 'g',
  gramme: 'g',
  grammes: 'g',
  kilo: 'kg',
  kilos: 'kg',
  kilogramme: 'kg',
  kilogrammes: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  milligramme: 'mg',
  milligrammes: 'mg',
  litre: 'l',
  litres: 'l',
  liter: 'l',
  liters: 'l',
  centilitre: 'cl',
  centilitres: 'cl',
  decilitre: 'dl',
  decilitres: 'dl',
  millilitre: 'ml',
  millilitres: 'ml',
  milliliter: 'ml',
  milliliters: 'ml'
}

/** Above this many grams, the amount reads better in kilos. */
const KILO_THRESHOLD = 1000

function canonicalUnit(unit) {
  const key = (unit || '').trim().toLowerCase()
  return ALIASES[key] || key
}

/**
 * The amount as it is stored and merged: metric units collapse to grams, and
 * anything else — spoons, pinches, "4 oeufs" — is left exactly as written,
 * since there is no sensible conversion for it.
 */
export function toBaseAmount(quantity, unit) {
  const grams = GRAMS_PER_UNIT[canonicalUnit(unit)]
  if (!grams) return { quantity, unit }
  if (quantity == null) return { quantity, unit: 'g' }
  return { quantity: quantity * grams, unit: 'g' }
}

/**
 * The amount as it is shown: a gram figure past the kilo threshold reads
 * better in kilos, so 1200 g becomes 1.2 kg while 200 g stays as it is.
 */
export function toDisplayAmount(quantity, unit) {
  if (unit === 'g' && quantity != null && Math.abs(quantity) >= KILO_THRESHOLD) {
    return { quantity: quantity / KILO_THRESHOLD, unit: 'kg' }
  }
  return { quantity, unit }
}

/** Decimals kept when an amount is written out. */
const PRECISION = 1000

/**
 * An amount as a recipe writes it: a rounded figure followed by its unit, if
 * it has one. A missing quantity formats as nothing at all, so a caller can
 * pass one straight through without a guard of its own.
 */
export function formatAmount(quantity, unit) {
  if (quantity == null) return ''
  const rounded = Math.round(quantity * PRECISION) / PRECISION
  return [rounded, unit].filter(value => value || value === 0).join(' ')
}
