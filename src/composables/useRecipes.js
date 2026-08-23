import { ref } from 'vue'
import { getLatestSha, downloadRecipes } from '../services/github.js'
import { loadRecipeCache, saveRecipeCache } from '../services/storage.js'

const recipes = ref([])
const loading = ref(false)
const error = ref('')
const cachedSha = ref('')

let initialized = false

export function useRecipes() {
  async function refresh(force = false) {
    if (loading.value) return
    loading.value = true
    error.value = ''

    try {
      const cache = loadRecipeCache()
      cachedSha.value = cache?.sha || ''

      if (!force && cache?.recipes?.length) {
        recipes.value = cache.recipes
      }

      const latestSha = await getLatestSha()

      if (!force && cache?.sha === latestSha && cache.recipes?.length) {
        return
      }

      const freshRecipes = await downloadRecipes()
      recipes.value = freshRecipes
      cachedSha.value = latestSha
      saveRecipeCache({ sha: latestSha, recipes: freshRecipes })
    } catch (err) {
      if (!recipes.value.length) {
        error.value = err?.message || 'Unknown error'
      }
    } finally {
      loading.value = false
      initialized = true
    }
  }

  if (!initialized) {
    const cache = loadRecipeCache()
    if (cache?.recipes?.length) {
      recipes.value = cache.recipes
      cachedSha.value = cache.sha || ''
    }
  }

  return { recipes, loading, error, refresh, cachedSha }
}