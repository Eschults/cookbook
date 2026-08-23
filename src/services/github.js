const OWNER = 'ssaunier'
const REPO = 'recipes'
const BRANCH = 'main'
const API = `https://api.github.com/repos/${OWNER}/${REPO}`
const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`

async function githubFetch(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github+json' }
  })
  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status} for ${url}`)
  }
  return response.json()
}

export async function getLatestSha() {
  const commit = await githubFetch(`${API}/commits/${BRANCH}`)
  return commit.sha
}

export async function downloadRecipes() {
  const tree = await githubFetch(`${API}/git/trees/${BRANCH}?recursive=1`)
  if (tree.truncated) {
    throw new Error('GitHub returned a truncated repository tree. The source repository is too large for the simple client-side loader.')
  }

  const paths = tree.tree
    .filter(item => item.type === 'blob' && /(^|\/)recipe\.md$/i.test(item.path))
    .map(item => item.path)

  const results = await Promise.all(paths.map(async path => {
    const response = await fetch(`${RAW}/${path}`)
    if (!response.ok) throw new Error(`Unable to download ${path}`)
    const markdown = await response.text()
    return parseRecipeMD(markdown, path)
  }))

  return results
    .filter(Boolean)
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
}

function parseRecipeMD(markdown, path) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const title = (lines.find(line => /^#\s+/.test(line)) || '').replace(/^#\s+/, '').trim()
  if (!title) return null

  const slug = path.replace(/^recipes\//, '').replace(/\/recipe\.md$/i, '')
  const separatorIndexes = lines
    .map((line, index) => /^---\s*$/.test(line) ? index : -1)
    .filter(index => index >= 0)

  const firstSep = separatorIndexes[0]
  const secondSep = separatorIndexes[1]
  const bodyStart = secondSep >= 0 ? secondSep + 1 : 1

  const body = lines.slice(bodyStart)
  const sourceIndex = body.findIndex(line => /^Source:\s*$/i.test(line))
  const recipeBody = sourceIndex >= 0 ? body.slice(0, sourceIndex) : body

  const headingIndex = recipeBody.findIndex(line => /^#\s+/.test(line))
  const titleIndex = headingIndex >= 0 ? headingIndex : 0
  const meta = recipeBody.slice(titleIndex + 1)

  const ingredientStart = meta.findIndex(line => /^\s*\*\s+/.test(line))
  const numberedStart = meta.findIndex(line => /^\s*\d+\.\s+/.test(line))

  let description = ''
  let tags = []
  let servings = null

  if (ingredientStart > 0) {
    const preIngredients = meta.slice(0, ingredientStart).map(s => s.trim()).filter(Boolean)
    description = preIngredients.find(line => !/^[\wÀ-ÿ ,.-]+$/.test(line) || line.includes(',') || line.length > 20) || preIngredients[0] || ''
    tags = preIngredients.find(line => line.includes(',') && line.length < 120)?.split(',').map(s => s.trim()).filter(Boolean) || []
    const servingLine = preIngredients.find(line => /\b(serves?|servings?|portions?|g|kg|ml|l)\b/i.test(line))
    const match = servingLine?.match(/(\d+(?:[.,]\d+)?)\s*(?:servings?|portions?)/i)
    if (match) servings = Number(match[1].replace(',', '.'))
  }

  const ingredientLines = numberedStart > ingredientStart
    ? meta.slice(ingredientStart, numberedStart)
    : meta.slice(ingredientStart >= 0 ? ingredientStart : 0)

  const ingredients = ingredientLines
    .filter(line => /^\s*\*\s+/.test(line))
    .map(line => parseIngredient(line.replace(/^\s*\*\s+/, '').trim()))
    .filter(Boolean)

  const instructionLines = numberedStart >= 0
    ? meta.slice(numberedStart).filter(line => /^\s*\d+\.\s+/.test(line)).map(line => line.replace(/^\s*\d+\.\s+/, '').trim())
    : []

  const servingsFromYield = meta.join(' ').match(/(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l)\s+(?:de\s+)?/i)
  if (!servings && servingsFromYield) servings = null

  return {
    id: slug,
    slug,
    title,
    description,
    tags,
    servings,
    ingredients,
    instructions: instructionLines,
    sourcePath: path
  }
}

function parseIngredient(text) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  const match = normalized.match(/^((?:\d+(?:[.,]\d+)?|\d+\s*\/\s*\d+|\d+\s+\d+\s*\/\s*\d+))\s*([a-zA-ZÀ-ÿµ%]+)?\s+(.+)$/)

  if (!match) {
    return {
      original: normalized,
      quantity: null,
      unit: '',
      name: normalized,
      scalable: false
    }
  }

  const quantity = parseQuantity(match[1])
  const unit = normalizeUnit(match[2] || '')
  const name = match[3].trim()

  return {
    original: normalized,
    quantity,
    unit,
    name,
    scalable: Number.isFinite(quantity)
  }
}

function parseQuantity(value) {
  const clean = value.replace(',', '.').trim()
  if (clean.includes(' ')) {
    const [whole, fraction] = clean.split(/\s+/)
    if (fraction?.includes('/')) {
      const [a, b] = fraction.split('/').map(Number)
      return Number(whole) + a / b
    }
  }
  if (clean.includes('/')) {
    const [a, b] = clean.split('/').map(Number)
    return a / b
  }
  return Number(clean)
}

function normalizeUnit(unit) {
  const key = unit.toLowerCase()
  const aliases = {
    g: 'g',
    kg: 'kg',
    mg: 'mg',
    ml: 'ml',
    l: 'l',
    cl: 'cl',
    tbsp: 'tbsp',
    tsp: 'tsp',
    c: 'cup',
    cups: 'cups',
    cup: 'cup',
    oz: 'oz',
    lb: 'lb',
    lbs: 'lb'
  }
  return aliases[key] || unit
}