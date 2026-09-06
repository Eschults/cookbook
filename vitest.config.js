import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Deliberately separate from vite.config.js: the app build needs Tailwind and
// the PWA plugin, the tests need neither.
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.spec.js'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js', 'src/**/*.vue'],
      exclude: ['src/main.js']
    }
  }
})
