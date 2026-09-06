/**
 * Inline markdown rendering for the bits of a recipe the views print verbatim:
 * ingredient names and instruction steps.
 *
 * RecipeMD keeps those as raw markdown, so `*1* boite d'[Slider](https://…)`
 * has to become a real link rather than the literal brackets. Only *inline*
 * constructs are rendered — a step is a single line of prose, never a nested
 * document.
 *
 * `marked` does the parsing; the HTML is emitted here rather than by marked's
 * renderer so that every tag in the output is one this module constructed and
 * every piece of text is escaped. That keeps `v-html` safe without a separate
 * sanitizer: raw HTML in a recipe is shown as text, and only http(s), mailto
 * and tel links (plus relative ones) survive as hrefs.
 */

import { Lexer } from 'marked'

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => HTML_ESCAPES[char])

/** Schemes we are willing to put in an `href`. */
const SAFE_SCHEME = /^(?:https?:|mailto:|tel:)/i
/** Any scheme at all — a destination without one is a relative link. */
const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i

function safeHref(href) {
  const value = String(href ?? '').trim()
  if (!value) return null
  if (SAFE_SCHEME.test(value)) return value
  return ANY_SCHEME.test(value) ? null : value
}

const inlineTokens = markdown => new Lexer().inlineTokens(String(markdown))

// --- HTML ------------------------------------------------------------------

function renderTokens(tokens) {
  return tokens.map(renderToken).join('')
}

/** The rendered children of a token, falling back to its escaped text. */
const renderChildren = token => (token.tokens ? renderTokens(token.tokens) : escapeHtml(token.text))

function renderToken(token) {
  switch (token.type) {
    case 'em':
      return `<em>${renderChildren(token)}</em>`
    case 'strong':
      return `<strong>${renderChildren(token)}</strong>`
    case 'del':
      return `<del>${renderChildren(token)}</del>`
    case 'codespan':
      return `<code>${escapeHtml(token.text)}</code>`
    case 'br':
      return '<br>'
    case 'link': {
      const href = safeHref(token.href)
      const label = renderChildren(token)
      if (!href) return label
      return `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${label}</a>`
    }
    // An image would break the line box it sits in, so only its alt text is kept.
    case 'image':
      return escapeHtml(token.text)
    // `html` lands here too: embedded markup is printed, never trusted.
    default:
      return escapeHtml(token.text ?? token.raw)
  }
}

/** Render one line of inline markdown as HTML that is safe to pass to `v-html`. */
export function renderInline(markdown) {
  if (!markdown) return ''
  return renderTokens(inlineTokens(markdown))
}

// --- Plain text ------------------------------------------------------------

function textOf(token) {
  switch (token.type) {
    case 'em':
    case 'strong':
    case 'del':
    case 'link':
      return token.tokens ? token.tokens.map(textOf).join('') : String(token.text ?? '')
    case 'br':
      return ' '
    default:
      return String(token.text ?? token.raw ?? '')
  }
}

/**
 * The same content with its markup dropped, for the places that cannot render
 * HTML — `window.confirm()` messages, sorting keys and the document title.
 */
export function stripInline(markdown) {
  if (!markdown) return ''
  return inlineTokens(markdown).map(textOf).join('')
}
