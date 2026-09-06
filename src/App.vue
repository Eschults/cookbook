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

const isHome = computed(() => route.name === 'recipes')
const isShopping = computed(() => route.name === 'shopping')
const isMenu = computed(() => route.name === 'menu')

async function refreshRecipes() {
  refreshing.value = true
  try {
    await refresh(true)
  } finally {
    refreshing.value = false
  }
}

onMounted(() => refresh())
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <RouterLink to="/" class="flex min-w-0 items-center gap-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <BrandMark class="size-5" />
          </span>
          <div class="min-w-0">
            <div class="truncate text-base font-black tracking-tight text-slate-900">{{ t('app.title') }}</div>
            <div class="hidden text-xs text-slate-500 sm:block">{{ t('app.tagline') }}</div>
          </div>
        </RouterLink>

        <nav class="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
          <RouterLink to="/" :class="['rounded-xl px-3 py-2 text-sm font-semibold', isHome ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900']">{{ t('nav.recipes') }}</RouterLink>
          <RouterLink to="/menu" :class="['rounded-xl px-3 py-2 text-sm font-semibold', isMenu ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900']">{{ t('nav.menu') }} <span v-if="menuCount" class="ml-1 text-blue-600">{{ menuCount }}</span></RouterLink>
          <RouterLink to="/shopping-list" :class="['rounded-xl px-3 py-2 text-sm font-semibold', isShopping ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900']">{{ t('nav.list') }} <span v-if="itemCount" class="ml-1 text-blue-600">{{ itemCount }}</span></RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div v-if="loading" class="grid min-h-[50vh] place-items-center">
        <div class="text-center">
          <div class="mx-auto mb-4 size-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
          <p class="font-semibold text-slate-700">{{ t('app.loading') }}</p>
          <p class="mt-1 text-sm text-slate-400">{{ t('app.loadingHint') }}</p>
        </div>
      </div>

      <div v-else-if="error" class="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
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
        <a class="font-semibold hover:text-slate-600" :href="repositoryUrl" target="_blank" rel="noreferrer">{{ repositoryLabel }}</a>
        <span v-if="cachedSha" class="font-mono">{{ cachedSha.slice(0, 7) }}</span>
        <button @click="refreshRecipes" :disabled="refreshing" class="font-semibold hover:text-slate-600 disabled:opacity-50">
          {{ refreshing ? t('app.refreshing') : t('app.refresh') }}
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
