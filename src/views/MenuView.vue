<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useShoppingList } from '../composables/useShoppingList.js'

const props = defineProps({ recipes: { type: Array, required: true } })
const { state, removeRecipe } = useShoppingList()
const { t } = useI18n()

const menu = computed(() => state.menu.map(entry => ({
  ...entry,
  recipe: props.recipes.find(recipe => recipe.id === entry.recipeId)
})))
</script>

<template>
  <section>
    <div class="mb-8">
      <h1 class="text-4xl font-black tracking-tight text-slate-950">{{ t('menu.heading') }}</h1>
      <p class="mt-2 text-slate-500">{{ t('menu.subtitle') }}</p>
    </div>

    <div v-if="menu.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article v-for="entry in menu" :key="entry.recipeId" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">×{{ entry.multiplier }}</span>
          <button @click="removeRecipe(entry.recipeId)" class="text-xs font-bold text-slate-300 hover:text-rose-500">{{ t('common.remove') }}</button>
        </div>
        <h2 class="mt-5 text-xl font-black text-slate-900">{{ entry.recipeTitle }}</h2>
        <p v-if="entry.recipe?.description" class="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{{ entry.recipe.description }}</p>
        <RouterLink v-if="entry.recipe" :to="`/recipes/${entry.recipe.slug}`" class="mt-5 inline-block text-sm font-black text-blue-600 hover:text-blue-700">{{ t('menu.openRecipe') }} →</RouterLink>
        <p v-else class="mt-5 text-xs text-rose-500">{{ t('menu.stale') }}</p>
      </article>
    </div>

    <div v-else class="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <div class="text-5xl">🍽️</div>
      <h2 class="mt-4 text-xl font-black text-slate-900">{{ t('menu.emptyTitle') }}</h2>
      <p class="mt-2 text-sm text-slate-500">{{ t('menu.emptyHint') }}</p>
      <RouterLink to="/" class="mt-5 inline-block rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">{{ t('common.browseRecipes') }}</RouterLink>
    </div>
  </section>
</template>