import { parseRecipe, flattenIngredients, RecipeMDError } from './recipemd.js'
import { formatAmount } from './units.js'
import { recipesRepo } from '../config.js'

const { owner, repo, branch, directory } = recipesRepo
const API = `https://api.github.com/repos/${owner}/${repo}`
const RAW = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`

/** A trailing slash unless the recipes sit at the repository root. */
const PREFIX = directory ? `${directory.replace(/^\/+|\/+$/g, '')}/` : ''

const ESCAPED_PREFIX = PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Recipes live under this directory in the source repository. */
const RECIPE_PATH = new RegExp(`^${ESCAPED_PREFIX}.+\\.md$`, 'i')

/** Yield units that describe a number of eaters rather than a volume. */
const SERVING_UNITS = /^(servings?|portions?|persons?|people|personnes?|pers\.?|parts?|couverts?)$/i

async function githubFetch(url) {
  const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} for ${url}`)
  }
  return response.json()
}

export async function getLatestSha() {
  const commit = await githubFetch(`${API}/commits/${branch}`)
  return commit.sha
}

export async function downloadRecipes() {
  const tree = await githubFetch(`${API}/git/trees/${branch}?recursive=1`)
  if (tree.truncated) {
    throw new Error('GitHub returned a truncated repository tree. The source repository is too large for this client-side loader.')
  }

  const paths = tree.tree
    .filter(item => item.type === 'blob' && RECIPE_PATH.test(item.path))
    .map(item => item.path)

  const results = await Promise.all(paths.map(async path => {
    const response = await fetch(`${RAW}/${encodeURI(path)}`)
    if (!response.ok) throw new Error(`Unable to download ${path}`)
    return toRecipe(await response.text(), path)
  }))

  // Ordering is locale-dependent, so it lives in useRecipes() rather than in
  // the cached payload: the locale can change without a re-download.
  return results.filter(Boolean)
}

/**
 * Turn a RecipeMD document into the shape the views consume. A recipe that
 * does not follow the specification is skipped rather than failing the whole
 * download, so one bad file cannot take the cookbook down.
 */
export function toRecipe(markdown, path) {
  let parsed
  try {
    parsed = parseRecipe(markdown)
  } catch (error) {
    if (error instanceof RecipeMDError) {
      console.warn(`Skipping ${path}: ${error.message}`)
      return null
    }
    throw error
  }

  const { steps, stepGroups, sources } = splitInstructions(parsed.instructions)

  return {
    slug: toSlug(path),
    title: parsed.title,
    description: parsed.description || '',
    tags: parsed.tags,
    yields: parsed.yields.map(amount => ({ ...amount, label: formatAmount(amount.factor, amount.unit) })),
    servings: toServings(parsed.yields),
    ingredients: flattenIngredients(parsed).map(toIngredient),
    steps,
    stepGroups,
    sources
  }
}

/** `recipes/pate-a-tartiner/recipe.md` becomes `pate-a-tartiner`. */
function toSlug(path) {
  return path
    .replace(new RegExp(`^${ESCAPED_PREFIX}`, 'i'), '')
    .replace(/\.md$/i, '')
    .replace(/\/recipe$/i, '')
    .replace(/\//g, '-')
}

function toIngredient(ingredient) {
  return {
    name: ingredient.name,
    quantity: ingredient.amount ? ingredient.amount.factor : null,
    unit: ingredient.amount?.unit || '',
    link: ingredient.link,
    group: ingredient.group
  }
}

/** The first yield expressed in eaters, e.g. `4 Servings`, if there is one. */
function toServings(yields) {
  const serving = yields.find(amount => amount.unit && SERVING_UNITS.test(amount.unit))
  return serving ? serving.factor : null
}

/**
 * The spec keeps the instructions as one markdown blob. Split it into steps for
 * display, and peel off a trailing `Source:` block if the recipe has one.
 *
 * `steps` is the flat list of every step in reading order; `stepGroups` is the
 * same steps arranged under the headings that introduced them, so a recipe
 * written as `## Pâte` / `## Cuisson` keeps those stages apart. A recipe with
 * no headings yields a single untitled group.
 */
function splitInstructions(instructions) {
  if (!instructions) return { steps: [], stepGroups: [], sources: [] }

  const lines = instructions.split('\n')
  const divider = lines.findIndex(line => /^\s*sources?\s*:?\s*$/i.test(line))
  const body = divider >= 0 ? lines.slice(0, divider) : lines
  const tail = divider >= 0 ? lines.slice(divider + 1) : []

  const stepGroups = toStepGroups(body)

  return {
    steps: stepGroups.flatMap(group => group.steps),
    stepGroups,
    sources: toSources(tail)
  }
}

const LIST_ITEM = /^\s*(?:[-+*]|\d{1,9}[.)])\s+(.*)$/
const HEADING = /^ {0,3}#{1,6}[ \t]+(.*?)[ \t]*#*[ \t]*$/
/** A divider inside the instructions separates sections; it is never content. */
const DIVIDER = /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/

/** Cut the instructions at each heading, then read the steps of every section. */
function toStepGroups(lines) {
  const sections = [{ title: null, lines: [] }]

  for (const line of lines) {
    const heading = line.match(HEADING)
    if (heading) sections.push({ title: heading[1].trim(), lines: [] })
    else sections[sections.length - 1].lines.push(line)
  }

  return sections
    .map(section => ({ title: section.title, steps: toSteps(section.lines) }))
    .filter(section => section.steps.length)
}

function toSteps(allLines) {
  const lines = allLines.filter(line => !DIVIDER.test(line))
  const items = []

  for (const line of lines) {
    const match = line.match(LIST_ITEM)
    if (match) {
      items.push(match[1].trim())
    } else if (line.trim() && items.length) {
      // A wrapped continuation of the previous step.
      items[items.length - 1] += ` ${line.trim()}`
    }
  }

  if (items.length) return items

  // No list: fall back to one step per paragraph.
  return lines
    .join('\n')
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim().replace(/\s*\n\s*/g, ' '))
    .filter(Boolean)
}

const MARKDOWN_LINK = /\[([^\]]*)\]\(\s*<?([^\s>)]+)>?[^)]*\)/

function toSources(lines) {
  return lines
    .map(line => line.replace(LIST_ITEM, '$1').trim())
    .filter(Boolean)
    .map(text => {
      const link = text.match(MARKDOWN_LINK)
      if (link) return { title: link[1].trim() || link[2], url: link[2] }
      if (/^https?:\/\//i.test(text)) return { title: text, url: text }
      return { title: text, url: null }
    })
}
