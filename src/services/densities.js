/**
 * Volumetric mass densities, in grams per millilitre at room temperature.
 *
 * The shopping list stores every amount in grams, because mass is the one
 * scale two differently-measured recipes can be merged on. Turning that back
 * into the litres a shop sells by needs a real density: 1 L of olive oil is
 * about 915 g, not 1000 g, so treating them as interchangeable would overstate
 * a bottle by nearly a tenth.
 *
 * The oil figures are the relative densities published at
 * https://www.aceitedelasvaldesas.com/fr/faq/varios/densidad-del-aceite/
 * (relative to water at 20 °C, so numerically the same as g/mL); where that
 * source gives a range, the midpoint is used. The remaining liquids are
 * standard room-temperature values.
 *
 * Only the shopping list consults these. An ingredient on a recipe page is
 * going onto a scale, so it keeps the unit its author wrote it in.
 */

/** Water at 20 °C, and the assumption for any ingredient not listed below. */
export const WATER_DENSITY = 1

/**
 * The liquids themselves, keyed by the word that identifies one. A name has
 * to contain one of these to be treated as a liquid at all.
 */
const LIQUID_DENSITIES = {
  // French
  huile: 0.918,
  lait: 1.03,
  eau: 1,
  jus: 1.05,
  vinaigre: 1.01,
  vin: 0.99,
  biere: 1.01,
  cidre: 1.01,
  bouillon: 1,
  creme: 1.01,
  sirop: 1.32,
  rhum: 0.94,
  liqueur: 1.04,
  // English
  oil: 0.918,
  milk: 1.03,
  water: 1,
  juice: 1.05,
  vinegar: 1.01,
  wine: 0.99,
  beer: 1.01,
  broth: 1,
  stock: 1,
  cream: 1.01,
  syrup: 1.32,
  rum: 0.94
}

/**
 * Varieties that pin down a liquid already identified above. These are only
 * consulted once a liquid word has matched, so "olives" on their own stay a
 * fruit sold by weight rather than becoming oil.
 */
const VARIETY_DENSITIES = {
  olive: 0.915,
  tournesol: 0.920,
  sunflower: 0.920,
  soja: 0.922,
  soybean: 0.922,
  arachide: 0.916,
  peanut: 0.916,
  coco: 0.915,
  coconut: 0.915,
  mais: 0.921,
  corn: 0.921,
  colza: 0.915,
  rapeseed: 0.915,
  lin: 0.928,
  linseed: 0.928,
  palme: 0.895,
  palm: 0.895
}

/**
 * Splits a name into comparable words: lower-cased, stripped of accents and
 * cut on anything that is not a letter. That last part is what lets a name
 * carrying markdown ("**huile** d'olive") match the same as a plain one, and
 * why matching is per word — "vin" cannot be read out of "vinaigre", and both
 * are listed in their own right.
 */
function words(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .split(/[^a-z]+/)
    .filter(Boolean)
}

/**
 * The density of an ingredient sold by volume, or `null` for anything bought
 * by weight. A `null` here is what tells the shopping list to keep showing an
 * amount in grams and kilos.
 */
export function densityOf(name) {
  const parts = words(name)

  const liquid = parts.find(word => word in LIQUID_DENSITIES)
  if (liquid === undefined) return null

  const variety = parts.find(word => word in VARIETY_DENSITIES)
  return variety === undefined ? LIQUID_DENSITIES[liquid] : VARIETY_DENSITIES[variety]
}
