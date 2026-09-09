<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useLocale } from '../composables/useLocale.js'
import RecipeCard from '../components/RecipeCard.vue'

const props = defineProps({ recipes: { type: Array, required: true } })
const { t } = useI18n()
const { collator } = useLocale()
const route = useRoute()
const router = useRouter()
const query = ref(route.query.q ?? '')
const tag = ref(route.query.tag ?? '')
const searchInput = ref(null)

/**
 * Mirror the search into the URL's query string. vue-router's history entries
 * carry it, so navigating to a recipe and back restores the search instead of
 * losing it — `replace` (not `push`) keeps every keystroke from adding its own
 * back-button stop.
 */
watch([query, tag], ([q, tg]) => {
  router.replace({ query: { ...route.query, q: q || undefined, tag: tg || undefined } })
})

const tags = computed(() => [...new Set(props.recipes.flatMap(recipe => recipe.tags || []))].sort(collator.value.compare))

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return props.recipes.filter(recipe => {
    const haystack = `${recipe.title} ${recipe.description} ${(recipe.tags || []).join(' ')} ${recipe.ingredients.map(ingredient => ingredient.name).join(' ')}`
    const matchesText = !needle || haystack.toLowerCase().includes(needle)
    const matchesTag = !tag.value || recipe.tags?.includes(tag.value)
    return matchesText && matchesTag
  })
})

/**
 * `/` is a common "jump to search" shortcut (Slack, GitHub…). It is ignored
 * while another field already has focus, so it still types a literal slash
 * there instead of stealing it.
 */
function focusOnSlash(event) {
  if (event.key !== '/') return
  const { tagName, isContentEditable } = document.activeElement || {}
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || isContentEditable) return
  event.preventDefault()
  searchInput.value?.focus()
}

// Autofocusing on mobile pops the keyboard and covers the page before the
// user asked for it, so only do it on desktop-sized viewports (matches the
// `sm` breakpoint already used below to switch the header layout).
onMounted(() => {
  if (window.matchMedia('(min-width: 640px)').matches) searchInput.value?.focus()
  window.addEventListener('keydown', focusOnSlash)
})
onUnmounted(() => window.removeEventListener('keydown', focusOnSlash))

// "All" and the tags are the same control in two flavours, so they share one
// class list. The selected one is a white chip lifted off the track: the only
// shadow left in the app, because here it is doing work rather than decorating
// — it is what makes the chip read as sitting on top of the group.
function pillClass(selected) {
  return [
    'rounded-md px-2.5 py-1 text-sm transition-colors',
    selected ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
  ]
}
</script>

<template>
  <section>
    <!-- Shares the nav label on purpose: one string, one translation. The nav
         already names the page on screen, so the heading is here for the
         document outline and screen readers rather than to be read twice. -->
    <h1 class="sr-only">{{ t('nav.recipes') }}</h1>

    <!-- Counts what is on screen rather than what the cookbook holds, so it
         answers whatever filter is set below it. -->
    <p class="mb-4 text-sm text-slate-500">{{ t('index.count', { n: filtered.length }) }}</p>

    <!-- No `order-*` here on purpose: tab order follows the DOM, so reordering
         one breakpoint visually would send focus backwards on that one. Tags
         first reads the same stacked on a phone as it does in a row. -->
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <!-- A segmented track rather than seven outlined chips: the tags are one
           control with one answer, and the shared border says so without
           drawing one round each option. -->
      <div v-if="tags.length" role="group" :aria-label="t('index.filterLabel')" class="inline-flex flex-wrap gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button @click="tag = ''" :aria-pressed="!tag" :class="pillClass(!tag)">{{ t('index.all') }}</button>
        <button v-for="item in tags" :key="item" @click="tag = item" :aria-pressed="tag === item" :class="pillClass(tag === item)">{{ item }}</button>
      </div>

      <div class="w-full sm:ml-auto sm:max-w-xs">
        <label class="sr-only" for="recipe-search">{{ t('index.searchLabel') }}</label>
        <input id="recipe-search" ref="searchInput" v-model="query" type="search" :placeholder="t('index.searchPlaceholder')" class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-base outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 sm:text-sm" />
      </div>
    </div>

    <div v-if="filtered.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RecipeCard v-for="recipe in filtered" :key="recipe.slug" :recipe="recipe" />
    </div>

    <div v-else class="rounded-lg border border-dashed border-slate-200 bg-white p-10 text-center">
      <div class="text-2xl">🔎</div>
      <h2 class="mt-3 text-sm font-semibold text-slate-900">{{ t('index.emptyTitle') }}</h2>
      <p class="mt-1 text-sm text-slate-500">{{ t('index.emptyHint') }}</p>
    </div>
  </section>
</template>