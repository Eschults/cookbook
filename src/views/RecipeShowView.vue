<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AddToShoppingListDialog from '../components/AddToShoppingListDialog.vue'
import PlusIcon from '../components/PlusIcon.vue'
import { useShoppingList } from '../composables/useShoppingList.js'
import { renderInline } from '../services/markdown.js'
import { formatAmount } from '../services/units.js'
import { pluralizeIngredientName, shouldPluralize } from '../services/pluralize.js'

const props = defineProps({ recipes: { type: Array, required: true } })
const route = useRoute()
const router = useRouter()
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

function displayName(ingredient) {
  return shouldPluralize(ingredient.quantity, ingredient.unit) ? pluralizeIngredientName(ingredient.name) : ingredient.name
}

function added(multiplier) {
  addRecipe(recipe.value, multiplier)
  showDialog.value = false
  router.push('/shopping-list')
}
</script>

<template>
  <div v-if="recipe">
    <RouterLink to="/" class="text-sm font-medium text-slate-400 hover:text-slate-700">← {{ t('recipe.back') }}</RouterLink>

    <article class="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <header class="border-b border-slate-100 bg-slate-50/70 p-5 sm:p-8">
        <div class="flex flex-wrap gap-2">
          <span v-for="tag in recipe.tags" :key="tag" class="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">{{ tag }}</span>
        </div>
        <!-- On desktop the button sits beside the title; on a phone that would
             push it above the servings line, so it moves below instead — the
             two buttons are the same action, one hidden per breakpoint. -->
        <div class="mt-4 flex items-center justify-between gap-5">
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{{ recipe.title }}</h1>
          <button @click="showDialog = true" class="hidden shrink-0 items-center gap-1.5 rounded-md border border-sky-200 bg-sky-150 px-3 py-1.5 text-sm font-medium text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-200 sm:inline-flex"><PlusIcon class="size-4" />{{ t('recipe.addToList') }}</button>
        </div>
        <p v-if="recipe.description" class="mt-2 max-w-2xl whitespace-pre-line text-base leading-7 text-slate-600">{{ recipe.description }}</p>
        <p v-if="recipe.yields.length" class="mt-3 text-xs font-medium uppercase tracking-[0.1em] text-sky-700">
          {{ t('recipe.makes', { yields: recipe.yields.map(item => item.label).join(' · ') }) }}
        </p>
        <button @click="showDialog = true" class="mt-6 inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-150 px-3 py-1.5 text-sm font-medium text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-200 sm:hidden"><PlusIcon class="size-4" />{{ t('recipe.addToList') }}</button>
      </header>

      <div class="grid gap-8 p-5 sm:p-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section>
          <h2 class="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">{{ t('recipe.ingredients') }}</h2>
          <p v-if="!recipe.ingredients.length" class="mt-3 text-sm text-slate-400">{{ t('recipe.noIngredients') }}</p>

          <div v-for="group in groups" :key="group.title" class="mt-4">
            <h3 v-if="group.title" class="text-xs font-medium text-slate-500">{{ group.title }}</h3>
            <ul class="divide-y divide-slate-100">
              <li v-for="(ingredient, index) in group.items" :key="index" class="py-3">
                <div class="flex gap-3">
                  <span class="mt-2 size-1.5 shrink-0 rounded-full bg-slate-300"></span>
                  <div>
                    <span v-if="ingredient.quantity != null" class="font-medium text-slate-900">{{ formatAmount(ingredient.quantity, ingredient.unit) }}</span>
                    <a v-if="ingredient.link" :href="ingredient.link" target="_blank" rel="noreferrer" :class="['markdown font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-800', { 'ml-1': ingredient.quantity != null }]" v-html="renderInline(displayName(ingredient))"></a>
                    <span v-else :class="['markdown font-medium text-slate-700', { 'ml-1': ingredient.quantity != null }]" v-html="renderInline(displayName(ingredient))"></span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 class="text-sm font-semibold uppercase tracking-[0.08em] text-slate-500">{{ t('recipe.method') }}</h2>
          <p v-if="!recipe.steps.length" class="mt-3 text-sm text-slate-400">{{ t('recipe.noInstructions') }}</p>
          <div v-for="(group, groupIndex) in recipe.stepGroups" :key="groupIndex" class="mt-4">
            <h3 v-if="group.title" class="text-xs font-medium text-slate-500">{{ group.title }}</h3>
            <ol class="mt-3 space-y-4">
              <li v-for="(step, index) in group.steps" :key="index" class="flex gap-3">
                <span class="grid size-6 shrink-0 place-items-center rounded-full bg-sky-50 text-xs font-medium text-sky-700">{{ index + 1 }}</span>
                <p class="markdown leading-7 text-slate-700" v-html="renderInline(step)"></p>
              </li>
            </ol>
          </div>

          <div v-if="recipe.sources.length" class="mt-8 border-t border-slate-100 pt-5">
            <h3 class="text-xs font-medium text-slate-500">{{ t('recipe.source', recipe.sources.length) }}</h3>
            <ul class="mt-2 space-y-1 text-sm">
              <li v-for="(source, index) in recipe.sources" :key="index">
                <a v-if="source.url" :href="source.url" target="_blank" rel="noreferrer" class="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-800">{{ source.title }}</a>
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
    <h1 class="text-2xl font-semibold">{{ t('recipe.notFound') }}</h1>
    <RouterLink to="/" class="mt-3 inline-block text-sm font-medium text-sky-700">{{ t('recipe.backToRecipes') }}</RouterLink>
  </div>
</template>
