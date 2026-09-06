import { describe, expect, it } from 'vitest'
import { recipesRepo, repositoryLabel, repositoryUrl } from '../src/config.js'

// A fork redirects the app by editing src/config.js and nothing else, so these
// guard the shape the rest of the code destructures.
describe('config', () => {
  it('names a repository, a branch and a directory', () => {
    expect(recipesRepo).toMatchObject({
      owner: expect.any(String),
      repo: expect.any(String),
      branch: expect.any(String),
      directory: expect.any(String)
    })
  })

  it('derives the footer link from it', () => {
    expect(repositoryLabel).toBe(`${recipesRepo.owner}/${recipesRepo.repo}`)
    expect(repositoryUrl).toBe(`https://github.com/${repositoryLabel}`)
  })
})
