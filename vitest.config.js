import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Deliberately separate from vite.config.js: the app build needs Tailwind and
// the PWA plugin, the tests need neither.
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    // Reuses jsdom across files in a worker instead of recreating it per
    // file, while keeping each file's module registry isolated.
    pool: 'vmThreads',
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.spec.js'],
    // Every spec imports what it uses from vitest, so `globals` stays off.
    // These two undo `vi.spyOn` and `vi.stubGlobal` between tests, which
    // saves each file from having to remember its own teardown hook.
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js', 'src/**/*.vue'],
      exclude: ['src/main.js']
    }
  }
})
