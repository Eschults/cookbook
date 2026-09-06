<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useShoppingList } from '../composables/useShoppingList.js'

const props = defineProps({ recipes: { type: Array, required: true } })
const { state, removeRecipe, clearList } = useShoppingList()
const { t } = useI18n()

const menu = computed(() => state.menu.map(entry => ({
  ...entry,
  recipe: props.recipes.find(recipe => recipe.id === entry.recipeId)
})))

/**
 * Emptying the menu also empties the shopping list it was built from, so the
 * prompt says as much before wiping work that cannot be recovered.
 */
function confirmClear() {
  if (window.confirm(t('menu.confirmClear'))) clearList()
}

function formatMultiplier(multiplier) {
  return Math.round(multiplier * 100) / 100
}
</script>

<template>
  <section>
    <div class="mb-8">
      <h1 class="text-4xl font-black tracking-tight text-slate-950">{{ t('menu.heading') }}</h1>
      <!-- The action sits beside the subtitle rather than under it: the
           subtitle wraps within its own column, so the button costs no extra
           line on a phone. -->
      <div class="mt-2 flex items-center gap-4">
        <p class="min-w-0 flex-1 text-slate-500">{{ t('menu.count', { n: menu.length }) }}</p>
        <button v-if="menu.length" @click="confirmClear" class="shrink-0 rounded-xl px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50">{{ t('common.clearAll') }}</button>
      </div>
    </div>

    <!-- One full-width row per meal, like the shopping list: a handful of meals
         should span the page rather than sit in the first third of a grid. -->
    <div v-if="menu.length" class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <ul class="divide-y divide-slate-100">
        <li v-for="entry in menu" :key="entry.recipeId" class="flex items-center gap-4 px-5 py-4">
          <div class="min-w-0 flex-1">
            <h2 class="flex items-center gap-2 truncate font-black text-slate-900">
              {{ entry.recipeTitle }}
              <span class="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">×{{ formatMultiplier(entry.multiplier) }}</span>
            </h2>
            <p v-if="entry.recipe?.description" class="mt-0.5 truncate text-sm text-slate-500">{{ entry.recipe.description }}</p>
            <p v-if="!entry.recipe" class="mt-0.5 text-xs text-rose-500">{{ t('menu.stale') }}</p>
          </div>
          <RouterLink v-if="entry.recipe" :to="`/r/${entry.recipe.slug}`" class="shrink-0 text-sm font-black text-blue-600 hover:text-blue-700">{{ t('menu.openRecipe') }} →</RouterLink>
          <button @click="removeRecipe(entry.recipeId)" class="shrink-0 text-xs font-bold text-slate-300 hover:text-rose-500">{{ t('common.remove') }}</button>
        </li>
      </ul>
    </div>

    <div v-else class="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <div class="text-5xl">🍽️</div>
      <h2 class="mt-4 text-xl font-black text-slate-900">{{ t('menu.emptyTitle') }}</h2>
      <p class="mt-2 text-sm text-slate-500">{{ t('menu.emptyHint') }}</p>
      <RouterLink to="/" class="mt-5 inline-block rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">{{ t('common.browseRecipes') }}</RouterLink>
    </div>
  </section>
</template>