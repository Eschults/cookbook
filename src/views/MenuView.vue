<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import TrashIcon from '../components/TrashIcon.vue'
import { useI18n } from 'vue-i18n'
import { useShoppingList } from '../composables/useShoppingList.js'

const props = defineProps({ recipes: { type: Array, required: true } })
const { state, removeRecipe, clearList } = useShoppingList()
const { t } = useI18n()

const menu = computed(() => state.menu.map(entry => ({
  ...entry,
  recipe: props.recipes.find(recipe => recipe.slug === entry.recipeId)
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

/** Destructive and one tap away, like the shopping list's own remove button, so it asks first. */
function confirmRemove(entry) {
  const name = entry.recipe?.title || entry.recipeId
  if (window.confirm(t('menu.confirmRemove', { name }))) removeRecipe(entry.recipeId)
}
</script>

<template>
  <section>
    <!-- The nav names the page; this is for the document outline. -->
    <h1 class="sr-only">{{ t('menu.heading') }}</h1>

    <!-- The action sits beside the count rather than under it: the count wraps
         within its own column, so the button costs no extra line on a phone. -->
    <div class="mb-4 flex items-center gap-4">
      <p class="min-w-0 flex-1 text-sm text-slate-500">{{ t('menu.count', { n: menu.length }) }}</p>
      <button v-if="menu.length" @click="confirmClear" class="shrink-0 rounded-md border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-50">{{ t('common.clearAll') }}</button>
    </div>

    <!-- One full-width row per meal, like the shopping list: a handful of meals
         should span the page rather than sit in the first third of a grid. -->
    <div v-if="menu.length" class="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <ul class="divide-y divide-slate-100">
        <li v-for="entry in menu" :key="entry.recipeId" class="flex items-center gap-4 px-4 py-3">
          <div class="min-w-0 flex-1">
            <h2 class="flex items-center gap-2 truncate text-sm font-semibold text-slate-900">
              {{ entry.recipe?.title || entry.recipeId }}
              <span class="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">×{{ formatMultiplier(entry.multiplier) }}</span>
            </h2>
            <p v-if="entry.recipe?.description" class="mt-0.5 truncate text-sm text-slate-500">{{ entry.recipe.description }}</p>
            <p v-if="!entry.recipe" class="mt-0.5 text-xs text-rose-500">{{ t('menu.stale') }}</p>
          </div>
          <!-- The row already names the recipe, so on a phone the verb alone
               says everything the longer label does, and leaves the title
               room to breathe rather than truncating it further. -->
          <div class="flex shrink-0 items-center gap-2">
            <RouterLink v-if="entry.recipe" :to="`/r/${entry.recipe.slug}`" :aria-label="t('menu.openRecipe')" class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
              <span class="sm:hidden">{{ t('menu.open') }}</span>
              <span class="hidden sm:inline">{{ t('menu.openRecipe') }}</span> →
            </RouterLink>
            <button @click="confirmRemove(entry)" :aria-label="t('common.remove')" :title="t('common.remove')" class="rounded-md border border-rose-200 p-1.5 text-rose-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"><TrashIcon class="size-4" /></button>
          </div>
        </li>
      </ul>
    </div>

    <div v-else class="rounded-lg border border-dashed border-slate-200 bg-white p-10 text-center">
      <div class="text-3xl">🍽️</div>
      <h2 class="mt-3 text-base font-semibold text-slate-900">{{ t('menu.emptyTitle') }}</h2>
      <p class="mt-1.5 text-sm text-slate-500">{{ t('menu.emptyHint') }}</p>
      <RouterLink to="/" class="mt-5 inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-150 px-3 py-1.5 text-sm font-medium text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-200">{{ t('common.browseRecipes') }}</RouterLink>
    </div>
  </section>
</template>