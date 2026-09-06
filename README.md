# Cookbook

A small read-only Vue 3 cookbook for the [`ssaunier/recipes`](https://github.com/ssaunier/recipes)
[RecipeMD](https://recipemd.org/specification.html) repository, served at
[cookbook.saunier.me](https://cookbook.saunier.me).

There is no backend. The app reads the recipe repository straight from the GitHub API in
the browser, parses the RecipeMD documents client-side, and keeps the result in
`localStorage` until the repository's HEAD commit changes. The UI is available in French
(default) and English, and it can scale a recipe into a shopping list.

## Running it

```bash
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm test` | Full Vitest suite |
| `npm run test:watch` | The suite in watch mode |
| `npm run coverage` | Coverage report |

Node 22 or newer is required.

## Pointing it at your own recipes

Everything about the source repository lives in [`src/config.js`](src/config.js):

```js
export const recipesRepo = {
  owner: 'ssaunier',
  repo: 'recipes',
  branch: 'main',
  directory: 'recipes'
}
```

Change those four values and the downloader, the recipe slugs and the footer link all
follow. `directory` is where the recipes live inside the repository — set it to `''` to
scan the whole thing. Every `.md` file below it is parsed as a RecipeMD document; a file
that does not parse is skipped with a console warning rather than breaking the app.

The repository has to be **public**: the browser calls the GitHub API without a token,
so a private repository would return 404. The unauthenticated API also allows 60 requests
per hour per IP, which is plenty here — a load costs two requests plus one per recipe
file, and the result is cached until the repository's HEAD moves.

Recipes must follow the [RecipeMD specification](https://recipemd.org/specification.html).
Note in particular that amounts are wrapped in emphasis:

```markdown
# Pâte à tartiner

*270 g* noisettes, *200 g* chocolat au lait

---

- *270 g* noisettes
- *200 g* chocolat au lait

---

1. Torréfier les noisettes 15 minutes à 150 °C.
```

## Deploying your fork

The site builds to static files and ships to GitHub Pages from
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Pushing to `main` runs
the test suite first, and the build only starts if it passes.

Two things to change in a fork:

**`public/CNAME`** holds the custom domain — `cookbook.saunier.me`. It sits in `public/`
so that Vite copies it into `dist/`, which is what gets published. **Delete this file
when you fork**, or your deploy will keep claiming a domain you do not own. If you want
your own custom domain, put it in there and point a `CNAME` DNS record at
`<your-user>.github.io`, then set the same domain under *Settings → Pages → Custom
domain*.

**`base` in [`vite.config.js`](vite.config.js)** is `'/'`, which is correct for a custom
domain or a `<user>.github.io` repository. Without a custom domain your fork is served
from `https://<user>.github.io/<repo>/`, and the asset URLs need to know that:

```js
export default defineConfig({
  base: '/cookbook/',
  // …
})
```

Set *Settings → Pages → Source* to **GitHub Actions** either way, otherwise the workflow
has nothing to publish to.

## Layout

```
src/
  config.js            source repository — the one file a fork needs to edit
  services/
    recipemd.js        RecipeMD 2.4.0 parser, written from the specification
    github.js          GitHub API client and the recipe shape the views consume
    storage.js         localStorage: recipe cache and locale
  composables/         shared state: recipes, shopping list, locale
  i18n/                fr.js / en.js message catalogues
  views/               one per route
test/                  Vitest suite, mirroring src/
```

The parser is the interesting part: it implements the specification directly rather than
guessing at the format, including ingredient groups, fractions and unicode vulgars,
decimal commas, link ingredients and the invalid cases the spec calls out. It was
developed against the official RecipeMD conformance suite and passed all 30 of its cases,
but those fixtures are LGPL-3.0 and are deliberately not vendored here — the committed
fixtures in `test/fixtures/recipemd/` are our own.

## License

[MIT](LICENSE) © Sébastien Saunier. The recipes themselves live in a separate repository
and are not covered by it.
