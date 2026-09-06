import { computed, ref } from 'vue'
import { getLatestSha, downloadRecipes } from '../services/github.js'
import { loadRecipeCache, saveRecipeCache } from '../services/storage.js'
import { useLocale } from './useLocale.js'
import { i18n } from '../i18n/index.js'

const { collator } = useLocale()

const downloaded = ref([])
const loading = ref(false)
const error = ref('')
const cachedSha = ref('')

// Sorting happens on read, not at download time, so the order follows the
// current locale rather than whichever one was active when the cache was built.
const recipes = computed(() =>
  [...downloaded.value].sort((a, b) => collator.value.compare(a.title, b.title))
)

// Hydrate from the cache once, at import, like useShoppingList does. This is
// the only read: from here on `downloaded` and `cachedSha` are what the cache
// holds, so refresh() compares against them rather than reading it again.
const cached = loadRecipeCache()
if (cached?.recipes?.length) {
  downloaded.value = cached.recipes
  cachedSha.value = cached.sha || ''
}

export function useRecipes() {
  async function refresh(force = false) {
    if (loading.value) return
    loading.value = true
    error.value = ''

    try {
      const latestSha = await getLatestSha()

      if (!force && latestSha === cachedSha.value && downloaded.value.length) {
        return
      }

      const freshRecipes = await downloadRecipes()
      downloaded.value = freshRecipes
      cachedSha.value = latestSha
      saveRecipeCache({ sha: latestSha, recipes: freshRecipes })
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
