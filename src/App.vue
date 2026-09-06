<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRecipes } from './composables/useRecipes.js'
import { useShoppingList } from './composables/useShoppingList.js'
import { useLocale } from './composables/useLocale.js'
import BrandMark from './components/BrandMark.vue'
import { repositoryLabel, repositoryUrl } from './config.js'

const { recipes, loading, error, refresh, cachedSha } = useRecipes()
const { itemCount, menuCount } = useShoppingList()
const { locale, locales, setLocale } = useLocale()
const { t } = useI18n()
const route = useRoute()
const refreshing = ref(false)

/** This app's own source, as opposed to `repositoryUrl`, which points at the recipe data. */
const cookbookRepositoryUrl = 'https://github.com/ssaunier/cookbook'

const isHome = computed(() => route.name === 'recipes')
const isShopping = computed(() => route.name === 'shopping')
const isMenu = computed(() => route.name === 'menu')

const MIN_REFRESH_DURATION_MS = 1000

async function refreshRecipes() {
  refreshing.value = true
  const startedAt = Date.now()
  try {
    await refresh(true)
  } finally {
    const elapsed = Date.now() - startedAt
    if (elapsed < MIN_REFRESH_DURATION_MS) await new Promise(resolve => setTimeout(resolve, MIN_REFRESH_DURATION_MS - elapsed))
    refreshing.value = false
  }
}

onMounted(() => refresh())
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <RouterLink to="/" :aria-label="t('app.title')" class="flex min-w-0 items-center gap-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <BrandMark class="size-5" />
          </span>
          <!-- On a narrow screen the mark alone stands for the app, leaving the
               navigation room to show its counters without wrapping. -->
          <div class="hidden min-w-0 sm:block">
            <div class="truncate text-base font-black tracking-tight text-slate-900">{{ t('app.title') }}</div>
            <div class="text-xs text-slate-500">{{ t('app.tagline') }}</div>
          </div>
        </RouterLink>

        <nav class="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
          <RouterLink to="/" :class="['rounded-xl px-3 py-2 text-sm font-semibold', isHome ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900']">{{ t('nav.recipes') }} <span v-if="recipes.length" class="ml-1 text-slate-400">{{ recipes.length }}</span></RouterLink>
          <RouterLink to="/menu" :class="['rounded-xl px-3 py-2 text-sm font-semibold', isMenu ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900']">{{ t('nav.menu') }} <span v-if="menuCount" class="ml-1 text-blue-600">{{ menuCount }}</span></RouterLink>
          <RouterLink to="/shopping-list" :class="['rounded-xl px-3 py-2 text-sm font-semibold', isShopping ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900']">{{ t('nav.list') }} <span v-if="itemCount" class="ml-1 text-blue-600">{{ itemCount }}</span></RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <!-- Once recipes are on screen, a background refresh must not tear the
           page down to this full-screen state: that swap is what was
           collapsing the page and throwing the scroll position back to the
           top. Only the very first, cache-less load gets it. -->
      <div v-if="loading && !recipes.length" class="grid min-h-[50vh] place-items-center">
        <div class="text-center">
          <div class="mx-auto mb-4 size-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p class="font-semibold text-slate-700">{{ t('app.loading') }}</p>
          <p class="mt-1 text-sm text-slate-400">{{ t('app.loadingHint') }}</p>
        </div>
      </div>

      <div v-else-if="error && !recipes.length" class="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
        <h1 class="font-bold">{{ t('app.errorTitle') }}</h1>
        <p class="mt-2 text-sm leading-6">{{ error }}</p>
        <button @click="refreshRecipes" class="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700">
          {{ t('app.tryAgain') }}
        </button>
      </div>

      <RouterView v-else :recipes="recipes" />
    </main>

    <footer class="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-400 sm:px-6">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 pt-5">
        <a :href="cookbookRepositoryUrl" target="_blank" rel="noreferrer" :aria-label="t('app.viewSource')" :title="t('app.viewSource')" class="hover:text-slate-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-4">
            <path d="M8 6 3 12l5 6" />
            <path d="M16 6l5 6-5 6" />
          </svg>
        </a>
        <a :href="repositoryUrl" target="_blank" rel="noreferrer" :aria-label="t('app.viewRecipes')" :title="t('app.viewRecipes')" class="hover:text-slate-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-4">
            <ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" />
            <path d="M4.5 5.5v6c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-6" />
            <path d="M4.5 11.5v6c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-6" />
          </svg>
        </a>
        <a
          v-if="cachedSha"
          :href="`${repositoryUrl}/commit/${cachedSha}`"
          target="_blank"
          rel="noreferrer"
          :class="['font-mono transition duration-300 hover:text-slate-600', refreshing ? 'pointer-events-none opacity-40 blur-[1.5px]' : 'opacity-100 blur-0']"
        >{{ cachedSha.slice(0, 7) }}</a>
        <button type="button" @click="refreshRecipes" :disabled="refreshing" :aria-label="refreshing ? t('app.refreshing') : t('app.refresh')" :title="refreshing ? t('app.refreshing') : t('app.refresh')" class="hover:text-slate-600 disabled:opacity-50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" :class="['size-4', refreshing && 'animate-spin']">
            <path d="M20.5 12a8.5 8.5 0 1 1-2.3-5.8" />
            <path d="M20.5 3.5v5h-5" />
          </svg>
        </button>
        <nav :aria-label="t('app.language')" class="ml-auto flex items-center gap-1">
          <button
            v-for="code in locales"
            :key="code"
            @click="setLocale(code)"
            :aria-current="locale === code ? 'true' : undefined"
            :class="['rounded px-1.5 py-0.5 font-semibold uppercase transition', locale === code ? 'text-slate-700' : 'hover:text-slate-600']"
          >{{ code }}</button>
        </nav>
      </div>
    </footer>
  </div>
</template>
