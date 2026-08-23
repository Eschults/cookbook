<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({ recipes: { type: Array, required: true } })
const query = ref('')
const tag = ref('')

const tags = computed(() => [...new Set(props.recipes.flatMap(recipe => recipe.tags || []))].sort())

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return props.recipes.filter(recipe => {
    const matchesText = !needle || `${recipe.title} ${recipe.description} ${(recipe.tags || []).join(' ')}`.toLowerCase().includes(needle)
    const matchesTag = !tag.value || recipe.tags?.includes(tag.value)
    return matchesText && matchesTag
  })
})
</script>

<template>
  <section>
    <div class="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p class="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-600">Cookbook</p>
        <h1 class="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">What are we cooking?</h1>
        <p class="mt-3 max-w-2xl text-slate-500">{{ recipes.length }} recipes from the RecipeMD collection.</p>
      </div>
      <div class="w-full sm:max-w-sm">
        <label class="sr-only" for="recipe-search">Search recipes</label>
        <input id="recipe-search" v-model="query" type="search" placeholder="Search recipes…" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-amber-200 transition focus:ring-4" />
      </div>
    </div>

    <div v-if="tags.length" class="mb-6 flex flex-wrap gap-2">
      <button @click="tag = ''" :class="['rounded-full px-3 py-1.5 text-sm font-semibold', !tag ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-900']">All</button>
      <button v-for="item in tags" :key="item" @click="tag = item" :class="['rounded-full px-3 py-1.5 text-sm font-semibold', tag === item ? 'bg-amber-400 text-slate-950' : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-900']">{{ item }}</button>
    </div>

    <div v-if="filtered.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink v-for="recipe in filtered" :key="recipe.id" :to="`/recipes/${recipe.slug}`" class="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
        <div class="mb-5 flex items-start justify-between gap-3">
          <span class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{{ recipe.ingredients.length }} ingredients</span>
          <span class="text-xl transition group-hover:rotate-6">🍽️</span>
        </div>
        <h2 class="text-xl font-black text-slate-900">{{ recipe.title }}</h2>
        <p v-if="recipe.description" class="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{{ recipe.description }}</p>
        <div v-if="recipe.tags?.length" class="mt-4 flex flex-wrap gap-1.5">
          <span v-for="item in recipe.tags.slice(0, 3)" :key="item" class="text-xs font-semibold text-slate-400">#{{ item }}</span>
        </div>
        <div class="mt-5 text-sm font-bold text-amber-600 group-hover:text-amber-700">View recipe →</div>
      </RouterLink>
    </div>

    <div v-else class="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <div class="text-4xl">🔎</div>
      <h2 class="mt-4 font-bold text-slate-900">No recipes found</h2>
      <p class="mt-1 text-sm text-slate-500">Try another search or clear the filter.</p>
    </div>
  </section>
</template>