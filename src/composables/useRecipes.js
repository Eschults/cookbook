import { computed, ref } from 'vue'
import { getLatestSha, downloadRecipes, filesToRecipes } from '../services/github.js'
import { loadRecipeCache, saveRecipeCache } from '../services/storage.js'
import { useLocale } from './useLocale.js'
import { i18n } from '../i18n/index.js'

const { collator } = useLocale()

const downloaded = ref([])
const loading = ref(false)
const error = ref('')
const cachedSha = ref('')

/**
 * Each recipe file's own git blob sha, alongside its parsed content — not a
 * ref, since nothing renders it directly. Passed back into `downloadRecipes`
 * so it only re-fetches files whose blob sha actually changed, rather than
 * every recipe whenever anything in the repository changes.
 */
let cachedFiles = {}

// Sorting happens on read, not at download time, so the order follows the
// current locale rather than whichever one was active when the cache was built.
const recipes = computed(() =>
  [...downloaded.value].sort((a, b) => collator.value.compare(a.title, b.title))
)

// Hydrate from the cache once, at import, like useShoppingList does. This is
// the only read: from here on `downloaded` and `cachedSha` are what the cache
// holds, so refresh() compares against them rather than reading it again.
//
// A cache built by an older version of this app is discarded rather than
// trusted: a fix to how a recipe is parsed or rendered only reaches someone
// with an unchanged upstream sha once their next visit treats that stale
// cache as empty and downloads again, rather than needing them to notice and
// clear it by hand.
const cached = loadRecipeCache()
if (cached?.files && Object.keys(cached.files).length && cached.version === __APP_VERSION__) {
  cachedFiles = cached.files
  downloaded.value = filesToRecipes(cached.files)
  cachedSha.value = cached.sha || ''
}

export function useRecipes() {
  async function refresh() {
    if (loading.value) return
    loading.value = true
    error.value = ''

    try {
      const latestSha = await getLatestSha()

      if (latestSha === cachedSha.value && downloaded.value.length) {
        return
      }

      const files = await downloadRecipes(cachedFiles)
      cachedFiles = files
      downloaded.value = filesToRecipes(files)
      cachedSha.value = latestSha
      saveRecipeCache({ sha: latestSha, files, version: __APP_VERSION__ })
    } catch (err) {
      if (!downloaded.value.length) {
        error.value = err?.message || i18n.global.t('app.unknownError')
      }
    } finally {
      loading.value = false
    }
  }

  return { recipes, loading, error, refresh, cachedSha }
}
