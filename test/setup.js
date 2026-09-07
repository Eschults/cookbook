import { beforeEach } from 'vitest'
import { i18n } from '../src/i18n/index.js'
import { DEFAULT_LOCALE } from '../src/i18n/locales.js'

// Every test starts from a clean browser and the default locale. The app's
// stores are module singletons, so without this they would leak across tests.
beforeEach(() => {
  localStorage.clear()
  i18n.global.locale.value = DEFAULT_LOCALE
  // jsdom has no layout engine, so it doesn't implement matchMedia. Default
  // every test to a desktop-sized viewport; tests can vi.spyOn over this to
  // simulate mobile.
  window.matchMedia = window.matchMedia || (query => ({ matches: true, media: query }))
})
