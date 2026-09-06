import { describe, expect, it } from 'vitest'
import { renderInline, stripInline } from '../../src/services/markdown.js'

describe('renderInline', () => {
  it('returns an empty string for nothing to render', () => {
    expect(renderInline('')).toBe('')
    expect(renderInline(null)).toBe('')
    expect(renderInline(undefined)).toBe('')
  })

  it('renders emphasis, strong emphasis and code', () => {
    expect(renderInline('a _b_ **c** `d`')).toBe('a <em>b</em> <strong>c</strong> <code>d</code>')
  })

  it('renders strikethrough and a hard line break', () => {
    expect(renderInline('a ~~b~~ c')).toBe('a <del>b</del> c')
    // An ingredient item may span lines, which is where a hard break shows up.
    expect(renderInline('one  \ntwo')).toBe('one<br>two')
  })

  it('opens links in a new tab', () => {
    expect(renderInline('[Slider](https://example.org/a?b=1)'))
      .toBe('<a href="https://example.org/a?b=1" target="_blank" rel="noreferrer">Slider</a>')
  })

  it('renders markdown inside a link label', () => {
    expect(renderInline("boite d'[agent de graîssage _Slider_](https://example.org/)"))
      .toBe('boite d&#39;<a href="https://example.org/" target="_blank" rel="noreferrer">agent de graîssage <em>Slider</em></a>')
  })

  it('escapes text that would otherwise be read as markup', () => {
    expect(renderInline('5 < 6 & "7"')).toBe('5 &lt; 6 &amp; &quot;7&quot;')
  })

  it('prints embedded HTML instead of trusting it', () => {
    expect(renderInline('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;')
    expect(renderInline('<script>alert(1)</script>')).not.toContain('<script>')
  })

  it('drops a link whose scheme is not one we allow, keeping its label', () => {
    expect(renderInline('[click](javascript:alert(1))')).toBe('click')
    expect(renderInline('[click](data:text/html,x)')).toBe('click')
  })

  it('keeps a relative destination', () => {
    expect(renderInline('[here](/recipes/x)'))
      .toBe('<a href="/recipes/x" target="_blank" rel="noreferrer">here</a>')
  })

  it('reduces an image to its alt text', () => {
    expect(renderInline('![a cake](https://example.org/cake.png)')).toBe('a cake')
  })
})

describe('stripInline', () => {
  it('drops the markup and keeps the words', () => {
    expect(stripInline("boite d'[agent de graîssage _Slider_](https://example.org/)"))
      .toBe("boite d'agent de graîssage Slider")
    expect(stripInline('**500 g** de `farine`')).toBe('500 g de farine')
  })

  it('flattens a hard line break to a space', () => {
    expect(stripInline('a ~~b~~ c')).toBe('a b c')
    expect(stripInline('one  \ntwo')).toBe('one two')
  })

  it('returns an empty string for nothing to strip', () => {
    expect(stripInline('')).toBe('')
    expect(stripInline(null)).toBe('')
  })
})
