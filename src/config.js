/**
 * Where the cookbook gets its recipes.
 *
 * Forked this project? Point these four values at your own RecipeMD
 * repository and you are done: the downloader, the slugs and the footer link
 * all read from here. The repository has to be public — the app talks to the
 * GitHub API from the browser, with no token.
 *
 * See README.md for the rest of the fork checklist (custom domain, base path).
 */
export const recipesRepo = {
  owner: 'ssaunier',
  repo: 'recipes',
  branch: 'main',

  /**
   * Directory holding the recipes, relative to the repository root. Every
   * `.md` file below it is treated as a RecipeMD document. Use '' to scan the
   * whole repository.
   */
  directory: 'recipes'
}

export const repositoryUrl = `https://github.com/${recipesRepo.owner}/${recipesRepo.repo}`
