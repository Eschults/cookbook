import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Identifies the build that wrote a given recipe cache, so useRecipes can
// tell a cache left over from an older deploy from a merely unchanged one.
const appVersion = execSync('git rev-parse --short HEAD').toString().trim()

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
