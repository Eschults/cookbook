<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AddToShoppingListDialog from '../components/AddToShoppingListDialog.vue'
import { useShoppingList } from '../composables/useShoppingList.js'

const props = defineProps({ recipes: { type: Array, required: true } })
const route = useRoute()
const { addRecipe } = useShoppingList()
const showDialog = ref(false)

const recipe = computed(() => props.recipes.find(item => item.slug === route.params.slug))

function added(multiplier) {
  addRecipe(recipe.value, multiplier)
  showDialog.value = false
}
</script>

<template>
  <div v-if="recipe" class="mx-auto max-w-4xl">
    <RouterLink to="/" class="text-sm font-bold text-slate-400 hover:text-slate-700">← All recipes</RouterLink>

    <article class="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <header class="border-b border-slate-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 sm:p-10">
        <div class="flex flex-wrap gap-2">
          <span v-for="tag in recipe.tags" :key="tag" class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">{{ tag }}</span>
        </div>
        <h1 class="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{{ recipe.title }}</h1>
        <p v-if="recipe.description" class="mt-3 max-w-2xl text-lg leading-8 text-slate-600">{{ recipe.description }}</p>
        <button @click="showDialog = true" class="mt-7 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-slate-800">＋ Add to shopping list</button>
      </header>

      <div class="grid gap-8 p-6 sm:p-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section>
          <h2 class="text-lg font-black text-slate-900">Ingredients</h2>
          <ul class="mt-4 divide-y divide-slate-100">
            <li v-for="(ingredient, index) in recipe.ingredients" :key="index" class="py-3">
              <div class="flex gap-3">
                <span class="mt-1 size-2 shrink-0 rounded-full bg-amber-400"></span>
                <div>
                  <span v-if="ingredient.quantity != null" class="font-bold text-slate-900">{{ ingredient.quantity }} {{ ingredient.unit }}</span>
                  <span v-else class="font-bold text-slate-500">As needed</span>
                  <span class="ml-1 text-slate-600">{{ ingredient.name }}</span>
                </div>
              </div>
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-lg font-black text-slate-900">Method</h2>
          <ol class="mt-4 space-y-4">
            <li v-for="(step, index) in recipe.instructions" :key="index" class="flex gap-4">
              <span class="grid size-8 shrink-0 place-items-center rounded-full bg-amber-100 text-sm font-black text-amber-800">{{ index + 1 }}</span>
              <p class="pt-1 leading-7 text-slate-600">{{ step }}</p>
            </li>
          </ol>
        </section>
      </div>
    </article>

    <AddToShoppingListDialog v-if="showDialog" :recipe="recipe" @cancel="showDialog = false" @add="added" />
  </div>

  <div v-else class="py-20 text-center">
    <h1 class="text-2xl font-black">Recipe not found</h1>
    <RouterLink to="/" class="mt-3 inline-block font-bold text-amber-600">Back to recipes</RouterLink>
  </div>
</template>