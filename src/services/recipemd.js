/**
 * RecipeMD parser.
 *
 * Implements version 2.4.0 of the RecipeMD specification:
 * https://recipemd.org/specification.html
 *
 * The specification is expressed in terms of CommonMark blocks. Rather than
 * pulling in a full CommonMark implementation, this module tokenises the
 * markdown subset RecipeMD relies on — ATX and setext headings, thematic
 * breaks, fenced code, paragraphs and lists — and then follows the parsing
 * strategy from the spec step by step.
 *
 * This parser was developed against the official RecipeMD conformance suite
 * (RecipeMD/RecipeMD, `testcases/cases`) and passed all 30 of its cases. Those
 * fixtures are LGPL-3.0 licensed and are deliberately not vendored here, so the
 * committed tests in `test/fixtures/recipemd/` are our own and cover the same
 * behaviour without proving third-party conformance. Run them with `npm test`.
 *
 * Deliberate leniency: a line made only of `-`, `*` or `_` is always read as a
 * thematic break, even directly after a paragraph where CommonMark would read
 * `---` as a setext heading. Recipes in the wild routinely omit the blank line
 * before a divider, and the heading reading makes the document unparseable.
 */

export class RecipeMDError extends Error {
  constructor(message) {
    super(message)
    this.name = 'RecipeMDError'
  }
}

const VULGAR_FRACTIONS = {
  '↉': 0, '⅒': 0.1, '⅑': 1 / 9, '⅛': 0.125, '⅐': 1 / 7, '⅙': 1 / 6,
  '⅕': 0.2, '¼': 0.25, '⅓': 1 / 3, '⅜': 0.375, '⅖': 0.4, '½': 0.5,
  '⅗': 0.6, '⅝': 0.625, '⅔': 2 / 3, '¾': 0.75, '⅘': 0.8, '⅚': 5 / 6,
  '⅞': 0.875
}
const VULGAR = Object.keys(VULGAR_FRACTIONS).join('')

const THEMATIC_BREAK = /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/
const ATX_HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/
const SETEXT_H1 = /^ {0,3}=+[ \t]*$/
const FENCE = /^ {0,3}(`{3,}|~{3,})/
const LIST_ITEM = /^( {0,3})([-+*]|\d{1,9}[.)])([ \t]+)(.*)$/

/** A paragraph whose whole content is strong emphasis, e.g. `**4 Servings**`. */
const STRONG_ONLY = /^(?:\*\*((?:(?!\*\*)[\s\S])+)\*\*|__((?:(?!__)[\s\S])+)__)$/
/** A paragraph whose whole content is emphasis, e.g. `*sauce, vegan*`. */
const EMPHASIS_ONLY = /^(?:\*(?!\*)([^*]+)\*|_(?!_)([^_]+)_)$/
/** Emphasis opening an inline string, e.g. the `*270 g*` of an ingredient. */
const LEADING_EMPHASIS = /^(?:\*(?!\*)([^*]+)\*|_(?!_)([^_]+)_)/
/** A string consisting of nothing but one inline link. */
const INLINE_LINK = /^\[((?:[^\][]|\[[^\][]*\])*)\]\(\s*(?:<([^>]*)>|([^\s)]*))(?:\s+(?:"[^"]*"|'[^']*'|\([^()]*\)))?\s*\)$/

const isBlank = line => !line.trim()
const indentOf = line => line.length - line.trimStart().length

// --- Block tokenizer -------------------------------------------------------

/**
 * Read one list item starting at `start`, returning the source range it spans.
 * Continuation lines are those indented to the marker's content column, plus
 * CommonMark's lazy continuation of the item's final paragraph.
 */
function scanListItem(lines, start) {
  const match = lines[start].match(LIST_ITEM)
  const contentIndent = match[1].length + match[2].length + match[3].length

  let end = start
  let index = start + 1
  let afterBlank = false

  while (index < lines.length) {
    const line = lines[index]

    if (isBlank(line)) {
      afterBlank = true
      index += 1
      continue
    }

    const startsNewBlock = LIST_ITEM.test(line) || THEMATIC_BREAK.test(line) ||
      ATX_HEADING.test(line) || FENCE.test(line)

    if (indentOf(line) >= contentIndent || (!afterBlank && !startsNewBlock)) {
      end = index
      afterBlank = false
      index += 1
      continue
    }

    break
  }

  return { start, end, contentIndent }
}

/**
 * The verbatim contents of a list item, with the marker removed.
 *
 * Continuation lines keep their original indentation, but the last line of
 * each paragraph is stripped of trailing whitespace — that is what CommonMark
 * treats as the paragraph's content, and the conformance suite checks for it.
 */
function itemContent(lines, item) {
  const parts = [lines[item.start].slice(item.contentIndent), ...lines.slice(item.start + 1, item.end + 1)]

  for (let i = 0; i < parts.length; i += 1) {
    const next = parts[i + 1]
    if (!isBlank(parts[i]) && (next === undefined || isBlank(next))) {
      parts[i] = parts[i].replace(/[ \t]+$/, '')
    }
  }

  return parts.join('\n').replace(/^\s+/, '').replace(/\s+$/, '')
}

/** Tokenize markdown into a flat list of blocks carrying their source range. */
function tokenize(lines) {
  const blocks = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (isBlank(line)) {
      index += 1
      continue
    }

    const fence = line.match(FENCE)
    if (fence) {
      const start = index
      const closing = new RegExp(`^ {0,3}${fence[1][0]}{${fence[1].length},}[ \\t]*$`)
      index += 1
      while (index < lines.length && !closing.test(lines[index])) index += 1
      if (index < lines.length) index += 1
      blocks.push({ type: 'code', start, end: index - 1 })
      continue
    }

    if (THEMATIC_BREAK.test(line)) {
      blocks.push({ type: 'break', start: index, end: index })
      index += 1
      continue
    }

    const heading = line.match(ATX_HEADING)
    if (heading) {
      const text = (heading[2] || '').replace(/[ \t]+#+[ \t]*$/, '').trim()
      blocks.push({ type: 'heading', level: heading[1].length, text, start: index, end: index })
      index += 1
      continue
    }

    if (LIST_ITEM.test(line)) {
      const start = index
      const items = []
      let end = index

      for (;;) {
        const item = scanListItem(lines, index)
        items.push({ text: itemContent(lines, item), singleLine: item.end === item.start })
        end = item.end

        let next = item.end + 1
        while (next < lines.length && isBlank(lines[next])) next += 1
        if (next < lines.length && LIST_ITEM.test(lines[next])) {
          index = next
          continue
        }
        index = item.end + 1
        break
      }

      blocks.push({ type: 'list', items, start, end })
      continue
    }

    // Paragraph: runs until a blank line or another block-level construct.
    const start = index
    const text = []
    while (index < lines.length && !isBlank(lines[index]) && !THEMATIC_BREAK.test(lines[index]) &&
      !ATX_HEADING.test(lines[index]) && !LIST_ITEM.test(lines[index]) && !FENCE.test(lines[index])) {
      if (SETEXT_H1.test(lines[index]) && text.length) break
      text.push(lines[index].trim())
      index += 1
    }

    if (index < lines.length && SETEXT_H1.test(lines[index]) && text.length) {
      blocks.push({ type: 'heading', level: 1, text: text.join(' ').trim(), start, end: index })
      index += 1
      continue
    }

    blocks.push({ type: 'paragraph', text: text.join('\n').trim(), start, end: index - 1 })
  }

  return blocks
}

/** Raw source for a line range, with blank lines trimmed but indentation kept. */
function rawSlice(lines, from, to) {
  const slice = lines.slice(from, to)
  while (slice.length && isBlank(slice[0])) slice.shift()
  while (slice.length && isBlank(slice[slice.length - 1])) slice.pop()
  return slice.length ? slice.join('\n') : null
}

// --- Amounts ---------------------------------------------------------------

/**
 * Split a comma separated list. Per the spec a comma is not a divider when the
 * characters directly before and after it are both ASCII digits, so decimal
 * commas survive inside a list.
 */
export function splitCommaList(text) {
  const parts = []
  let current = ''

  for (let i = 0; i < text.length; i += 1) {
    const inNumber = /\d/.test(text[i - 1] || '') && /\d/.test(text[i + 1] || '')
    if (text[i] === ',' && !inNumber) {
      parts.push(current)
      current = ''
    } else {
      current += text[i]
    }
  }
  parts.push(current)

  return parts.map(part => part.trim()).filter(Boolean)
}

const AMOUNT_PATTERNS = [
  // improper fraction, e.g. 1 1/5
  [new RegExp('^(\\d+)[ \\t]+(\\d+)[ \\t]*/[ \\t]*(\\d+)'), m => Number(m[1]) + Number(m[2]) / Number(m[3])],
  // improper fraction with a unicode vulgar fraction, e.g. 1 ½
  [new RegExp(`^(\\d+)[ \\t]+([${VULGAR}])`), m => Number(m[1]) + VULGAR_FRACTIONS[m[2]]],
  // proper fraction, e.g. 3/7
  [new RegExp('^(\\d+)[ \\t]*/[ \\t]*(\\d+)'), m => Number(m[1]) / Number(m[2])],
  // a unicode vulgar fraction on its own, e.g. ½
  [new RegExp(`^([${VULGAR}])`), m => VULGAR_FRACTIONS[m[1]]],
  // decimal with "." or "," as the divider; the whole part may be omitted
  [new RegExp('^(\\d*)[.,](\\d+)'), m => Number(`${m[1] || '0'}.${m[2]}`)],
  // plain integer
  [new RegExp('^(\\d+)'), m => Number(m[1])]
]

/**
 * Parse an amount, per "Parsing an Amount".
 *
 * @returns {{factor: number, unit: string|null}|null} `null` for an empty
 *   string; throws when there is text but no leading number, since a unit
 *   without a factor is not a valid amount.
 */
export function parseAmount(input) {
  let rest = String(input ?? '').trim()

  let negative = false
  if (rest.startsWith('-')) {
    negative = true
    rest = rest.slice(1).trimStart()
  }

  let factor = null
  for (const [pattern, compute] of AMOUNT_PATTERNS) {
    const match = rest.match(pattern)
    if (match) {
      factor = compute(match)
      rest = rest.slice(match[0].length)
      break
    }
  }

  const unit = rest.trim() || null

  if (factor === null) {
    if (unit !== null) throw new RecipeMDError(`"${String(input).trim()}" is not a valid amount: it has no factor`)
    return null
  }

  return { factor: negative ? -factor : factor, unit }
}

// --- Ingredients -----------------------------------------------------------

function decodeDestination(destination) {
  return destination.replace(/ /g, '%20')
}

/** Parse one list item into an ingredient, per "Parsing an Ingredient". */
export function parseIngredient(item) {
  const source = typeof item === 'string' ? item.trim() : item.text
  const singleLine = typeof item === 'string' ? !item.includes('\n') : item.singleLine

  let amount = null
  let rest = source

  const emphasis = source.match(LEADING_EMPHASIS)
  if (emphasis) {
    amount = parseAmount(emphasis[1] ?? emphasis[2])
    rest = source.slice(emphasis[0].length).replace(/^\s+/, '')
  }

  // A link is only the ingredient's link when it makes up the entire item.
  if (singleLine) {
    const link = rest.match(INLINE_LINK)
    if (link) {
      const destination = link[2] !== undefined ? decodeDestination(link[2]) : link[3]
      return { name: link[1].trim(), amount, link: destination || null }
    }
  }

  if (!rest) throw new RecipeMDError('An ingredient must have a name')

  return { name: rest, amount, link: null }
}

/** "Parsing Ingredient Groups" — builds the group tree from heading blocks. */
function parseIngredientGroups(blocks, index, parentLevel) {
  const groups = []
  let cursor = index

  while (cursor < blocks.length && blocks[cursor].type === 'heading') {
    const level = blocks[cursor].level
    if (level <= parentLevel) break

    const group = { title: blocks[cursor].text, ingredients: [], groups: [] }
    cursor += 1

    while (cursor < blocks.length && blocks[cursor].type === 'list') {
      group.ingredients.push(...blocks[cursor].items.map(parseIngredient))
      cursor += 1
    }

    const nested = parseIngredientGroups(blocks, cursor, level)
    group.groups = nested.groups
    cursor = nested.next

    groups.push(group)
  }

  return { groups, next: cursor }
}

// --- Recipe ----------------------------------------------------------------

/**
 * Parse a RecipeMD document.
 *
 * @param {string} markdown
 * @returns {{
 *   title: string,
 *   description: string|null,
 *   tags: string[],
 *   yields: {factor: number, unit: string|null}[],
 *   ingredients: {name: string, amount: object|null, link: string|null}[],
 *   ingredientGroups: object[],
 *   instructions: string|null
 * }}
 * @throws {RecipeMDError} when the document does not follow the specification.
 */
export function parseRecipe(markdown) {
  const lines = String(markdown ?? '').replace(/\r\n?/g, '\n').split('\n')
  const blocks = tokenize(lines)
  let cursor = 0

  const recipe = {
    title: '',
    description: null,
    tags: [],
    yields: [],
    ingredients: [],
    ingredientGroups: [],
    instructions: null
  }

  // Title: a first level heading, and nothing else, may open the document.
  if (blocks[cursor]?.type !== 'heading' || blocks[cursor].level !== 1) {
    throw new RecipeMDError('A recipe must start with a first level heading')
  }
  recipe.title = blocks[cursor].text
  cursor += 1

  // Description: every block up to the tags, the yields or the first divider.
  const descriptionStart = blocks[cursor]?.start
  let descriptionEnd = null
  while (cursor < blocks.length) {
    const block = blocks[cursor]
    if (block.type === 'break') break
    if (block.type === 'paragraph' && (STRONG_ONLY.test(block.text) || EMPHASIS_ONLY.test(block.text))) break
    descriptionEnd = block.end
    cursor += 1
  }
  if (descriptionEnd !== null) {
    recipe.description = rawSlice(lines, descriptionStart, descriptionEnd + 1)
  }

  // Tags and yields, in either order, each allowed at most once.
  let tagsSeen = false
  let yieldsSeen = false
  while (cursor < blocks.length && blocks[cursor].type === 'paragraph') {
    const strong = blocks[cursor].text.match(STRONG_ONLY)
    const emphasis = blocks[cursor].text.match(EMPHASIS_ONLY)

    if (strong) {
      if (yieldsSeen) throw new RecipeMDError('A recipe may only declare its yields once')
      yieldsSeen = true
      recipe.yields = splitCommaList(strong[1] ?? strong[2]).map(parseAmount).filter(Boolean)
    } else if (emphasis) {
      if (tagsSeen) throw new RecipeMDError('A recipe may only declare its tags once')
      tagsSeen = true
      recipe.tags = splitCommaList(emphasis[1] ?? emphasis[2])
    } else {
      break
    }
    cursor += 1
  }

  // The divider before the ingredients is mandatory.
  if (blocks[cursor]?.type !== 'break') {
    throw new RecipeMDError('Expected a horizontal line before the ingredients')
  }
  cursor += 1

  // Ingredients: ungrouped lists first, then any heading-delimited groups.
  while (cursor < blocks.length && blocks[cursor].type === 'list') {
    recipe.ingredients.push(...blocks[cursor].items.map(parseIngredient))
    cursor += 1
  }
  if (blocks[cursor]?.type === 'heading') {
    const parsed = parseIngredientGroups(blocks, cursor, -1)
    recipe.ingredientGroups = parsed.groups
    cursor = parsed.next
  }

  // Instructions: everything after the second divider.
  if (cursor < blocks.length) {
    if (blocks[cursor].type !== 'break') {
      throw new RecipeMDError('Expected a horizontal line before the instructions')
    }
    cursor += 1
    if (cursor < blocks.length) {
      recipe.instructions = rawSlice(lines, blocks[cursor].start, lines.length)
    }
  }

  return recipe
}

/** Depth-first walk of the group tree, yielding every ingredient in order. */
export function flattenIngredients(recipe) {
  const flat = recipe.ingredients.map(ingredient => ({ ...ingredient, group: null }))

  const walk = (groups, trail) => {
    for (const group of groups) {
      const path = group.title ? [...trail, group.title] : trail
      for (const ingredient of group.ingredients) {
        flat.push({ ...ingredient, group: path.join(' › ') || null })
      }
      walk(group.groups, path)
    }
  }
  walk(recipe.ingredientGroups, [])

  return flat
}
