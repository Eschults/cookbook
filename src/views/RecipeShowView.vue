<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AddToShoppingListDialog from '../components/AddToShoppingListDialog.vue'
import { useShoppingList } from '../composables/useShoppingList.js'

const props = defineProps({ recipes: { type: Array, required: true } })
const route = useRoute()
const { t } = useI18n()
const { addRecipe } = useShoppingList()
const showDialog = ref(false)

const recipe = computed(() => props.recipes.find(item => item.slug === route.params.slug))

/** Keep the parser's order, but bundle consecutive ingredients of one group. */
const groups = computed(() => {
  const result = []
  for (const ingredient of recipe.value?.ingredients || []) {
    const title = ingredient.group || ''
    const last = result[result.length - 1]
    if (last && last.title === title) last.items.push(ingredient)
    else result.push({ title, items: [ingredient] })
  }
  return result
})

function formatQuantity(ingredient) {
  if (ingredient.quantity == null) return ''
  const rounded = Math.round(ingredient.quantity * 1000) / 1000
  return `${rounded} ${ingredient.unit}`.trim()
}

function added(multiplier) {
  addRecipe(recipe.value, multiplier)
  showDialog.value = false
}
</script>

<template>
  <div v-if="recipe" class="mx-auto max-w-4xl">
    <RouterLink to="/" class="text-sm font-bold text-slate-400 hover:text-slate-700">← {{ t('recipe.back') }}</RouterLink>

    <article class="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <header class="border-b border-slate-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-6 sm:p-10">
        <div class="flex flex-wrap gap-2">
          <span v-for="tag in recipe.tags" :key="tag" class="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">{{ tag }}</span>
        </div>
        <h1 class="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{{ recipe.title }}</h1>
        <p v-if="recipe.description" class="mt-3 max-w-2xl whitespace-pre-line text-lg leading-8 text-slate-600">{{ recipe.description }}</p>
        <p v-if="recipe.yields.length" class="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-blue-700">
          {{ t('recipe.makes', { yields: recipe.yields.map(item => item.label).join(' · ') }) }}
        </p>
        <button @click="showDialog = true" class="mt-7 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-slate-800">＋ {{ t('recipe.addToList') }}</button>
      </header>

      <div class="grid gap-8 p-6 sm:p-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section>
          <h2 class="text-lg font-black text-slate-900">{{ t('recipe.ingredients') }}</h2>
          <p v-if="!recipe.ingredients.length" class="mt-3 text-sm text-slate-400">{{ t('recipe.noIngredients') }}</p>

          <div v-for="group in groups" :key="group.title" class="mt-4">
            <h3 v-if="group.title" class="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{{ group.title }}</h3>
            <ul class="divide-y divide-slate-100">
              <li v-for="(ingredient, index) in group.items" :key="index" class="py-3">
                <div class="flex gap-3">
                  <span class="mt-2 size-2 shrink-0 rounded-full bg-blue-500"></span>
                  <div>
                    <span v-if="ingredient.quantity != null" class="font-bold text-slate-900">{{ formatQuantity(ingredient) }}</span>
                    <span v-else class="font-bold text-slate-500">{{ t('recipe.asNeeded') }}</span>
                    <a v-if="ingredient.link" :href="ingredient.link" class="ml-1 text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-800">{{ ingredient.name }}</a>
                    <span v-else class="ml-1 text-slate-600">{{ ingredient.name }}</span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 class="text-lg font-black text-slate-900">{{ t('recipe.method') }}</h2>
          <p v-if="!recipe.steps.length" class="mt-3 text-sm text-slate-400">{{ t('recipe.noInstructions') }}</p>
          <ol class="mt-4 space-y-4">
            <li v-for="(step, index) in recipe.steps" :key="index" class="flex gap-4">
              <span class="grid size-8 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-black text-blue-800">{{ index + 1 }}</span>
              <p class="pt-1 leading-7 text-slate-600">{{ step }}</p>
            </li>
          </ol>

          <div v-if="recipe.sources.length" class="mt-8 border-t border-slate-100 pt-5">
            <h3 class="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{{ t('recipe.source', recipe.sources.length) }}</h3>
            <ul class="mt-2 space-y-1 text-sm">
              <li v-for="(source, index) in recipe.sources" :key="index">
                <a v-if="source.url" :href="source.url" target="_blank" rel="noreferrer" class="text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-800">{{ source.title }}</a>
                <span v-else class="text-slate-500">{{ source.title }}</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </article>

    <AddToShoppingListDialog v-if="showDialog" :recipe="recipe" @cancel="showDialog = false" @add="added" />
  </div>

  <div v-else class="py-20 text-center">
    <h1 class="text-2xl font-black">{{ t('recipe.notFound') }}</h1>
    <RouterLink to="/" class="mt-3 inline-block font-bold text-blue-600">{{ t('recipe.backToRecipes') }}</RouterLink>
  </div>
</template>
