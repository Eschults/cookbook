<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useShoppingList } from '../composables/useShoppingList.js'

const props = defineProps({ recipes: { type: Array, required: true } })
const { state, removeRecipe } = useShoppingList()

const menu = computed(() => state.menu.map(entry => ({
  ...entry,
  recipe: props.recipes.find(recipe => recipe.id === entry.recipeId)
})))
</script>

<template>
  <section>
    <div class="mb-8">
      <p class="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-600">Your plan</p>
      <h1 class="text-4xl font-black tracking-tight text-slate-950">Menu</h1>
      <p class="mt-2 text-slate-500">The recipes behind your current shopping list.</p>
    </div>

    <div v-if="menu.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article v-for="entry in menu" :key="entry.recipeId" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <span class="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">×{{ entry.multiplier }}</span>
          <button @click="removeRecipe(entry.recipeId)" class="text-xs font-bold text-slate-300 hover:text-rose-500">Remove</button>
        </div>
        <h2 class="mt-5 text-xl font-black text-slate-900">{{ entry.recipeTitle }}</h2>
        <p v-if="entry.recipe?.description" class="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{{ entry.recipe.description }}</p>
        <RouterLink v-if="entry.recipe" :to="`/recipes/${entry.recipe.slug}`" class="mt-5 inline-block text-sm font-black text-amber-600 hover:text-amber-700">Open recipe →</RouterLink>
        <p v-else class="mt-5 text-xs text-rose-500">Recipe is no longer present in the source repository.</p>
      </article>
    </div>

    <div v-else class="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <div class="text-5xl">🍽️</div>
      <h2 class="mt-4 text-xl font-black text-slate-900">No recipes in your menu</h2>
      <p class="mt-2 text-sm text-slate-500">When you add a recipe to your shopping list, it will appear here.</p>
      <RouterLink to="/" class="mt-5 inline-block rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Browse recipes</RouterLink>
    </div>
  </section>
</template>