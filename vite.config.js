import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * The only files whose contents decide what useRecipes stores in localStorage:
 * which repository is read, how a recipe file is parsed, and the shape each
 * cached entry ends up with. Nothing that merely renders a recipe belongs
 * here - a version bump makes every visitor re-download the whole cookbook
 * from GitHub, and doing that on every deploy was enough unauthenticated
 * traffic to earn a 403 after two deploys in a row.
 *
 * Renaming one of these files breaks the build rather than silently narrowing
 * what the version covers. Structural cache breaks stay the job of CACHE_KEY
 * in src/services/storage.js.
 */
const CACHE_RELEVANT_FILES = [
  'src/config.js',
  'src/composables/useRecipes.js',
  'src/services/github.js',
  'src/services/recipemd.js',
  'src/services/units.js'
]

const appVersion = createHash('sha256')
  .update(CACHE_RELEVANT_FILES.map(file => readFileSync(new URL(file, import.meta.url), 'utf8')).join('\0'))
  .digest('hex')
  .slice(0, 12)

export default defineConfig({
  base: '/',
  define: {
    // Composition API only: keeps the deprecated Legacy API out of the bundle.
    __VUE_I18N_LEGACY_API__: false,
    __INTLIFY_PROD_DEVTOOLS__: false,
    __APP_VERSION__: JSON.stringify(appVersion)
  },
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Cookbook',
        short_name: 'Cookbook',
        description: 'RecipeMD cookbook and shopping list',
        theme_color: '#f8fafc',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: []
      },
      workbox: {
        navigateFallback: 'index.html'
      }
    })
  ]
})
