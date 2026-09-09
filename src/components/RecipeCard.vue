<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

defineProps({ recipe: { type: Object, required: true } })
const { t } = useI18n()
</script>

<template>
  <RouterLink :to="`/r/${recipe.slug}`" class="group min-w-0 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
    <span class="inline-block rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">{{ t('index.ingredients', { n: recipe.ingredients.length }) }}</span>
    <h2 class="mt-3 text-base font-semibold text-slate-900">{{ recipe.title }}</h2>
    <p v-if="recipe.description" class="mt-1 truncate text-sm leading-6 text-slate-500">{{ recipe.description }}</p>
    <div v-if="recipe.tags?.length" class="mt-3 flex flex-wrap gap-x-2 gap-y-1">
      <span v-for="item in recipe.tags.slice(0, 3)" :key="item" class="text-xs text-slate-400">#{{ item }}</span>
    </div>
    <div class="mt-4 text-sm font-medium text-slate-500 group-hover:text-slate-900">{{ t('index.viewRecipe') }} →</div>
  </RouterLink>
</template>
