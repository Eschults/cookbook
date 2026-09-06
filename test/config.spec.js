import { describe, expect, it } from 'vitest'
import { recipesRepo } from '../src/config.js'

// src/config.js is the one file a fork is told to edit. Its four values are
// interpolated straight into GitHub URLs, where a missing or blank one
// surfaces as a 404 that gives no hint of where it came from.
describe('config', () => {
  it.each(['owner', 'repo', 'branch'])('has a non-empty %s', key => {
    expect(recipesRepo[key]).toEqual(expect.any(String))
    expect(recipesRepo[key]).not.toBe('')
  })

  it('has a directory, which may be empty to scan the whole repository', () => {
    expect(recipesRepo.directory).toEqual(expect.any(String))
  })
})
