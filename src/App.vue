<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRecipes } from './composables/useRecipes.js'
import { useShoppingList } from './composables/useShoppingList.js'
import { useLocale } from './composables/useLocale.js'
import BrandMark from './components/BrandMark.vue'
import { repositoryUrl } from './config.js'

const { recipes, loading, error, refresh, cachedSha } = useRecipes()
const { itemCount, menuCount } = useShoppingList()
const { locale, locales, setLocale } = useLocale()
const { t } = useI18n()
const route = useRoute()

/** This app's own source, as opposed to `repositoryUrl`, which points at the recipe data. */
const cookbookRepositoryUrl = 'https://github.com/ssaunier/cookbook'

/**
 * The three top-level destinations and the counter each one carries. The
 * recipe count is the size of the cookbook rather than something you added,
 * so it stays grey while the other two use the accent colour.
 */
const tabs = computed(() => [
  { to: '/', name: 'recipes', label: t('nav.recipes'), count: recipes.value.length, muted: true },
  { to: '/menu', name: 'menu', label: t('nav.menu'), count: menuCount.value },
  { to: '/shopping-list', name: 'shopping', label: t('nav.list'), count: itemCount.value }
])

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
          <RouterLink
            v-for="tab in tabs"
            :key="tab.name"
            :to="tab.to"
            :class="['rounded-xl px-3 py-2 text-sm font-semibold', route.name === tab.name ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900']"
          >{{ tab.label }} <span v-if="tab.count" :class="['ml-1', tab.muted ? 'text-slate-400' : 'text-blue-600']">{{ tab.count }}</span></RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-10">
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
        <button @click="refresh" class="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700">
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
          class="font-mono hover:text-slate-600"
        >{{ cachedSha.slice(0, 7) }}</a>
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
