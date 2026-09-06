<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useShoppingList } from '../composables/useShoppingList.js'
import { useLocale } from '../composables/useLocale.js'

const { state, itemCount, totalCount, toggleItem, removeItem, clearChecked, clearList } = useShoppingList()
const { t } = useI18n()
const { collator } = useLocale()

const grouped = computed(() => {
  const groups = new Map()
  for (const item of state.shoppingList) {
    const key = item.unit ? 'measured' : 'other'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  // Alphabetical by ingredient name, collated in the active locale.
  for (const items of groups.values()) items.sort((a, b) => collator.value.compare(a.name, b.name))
  return [...groups.entries()]
})

/** Recipes write ingredients in lower case; the list reads better sentence-cased. */
function displayName(item) {
  return item.name.charAt(0).toUpperCase() + item.name.slice(1)
}

/** Wipes work that cannot be recovered, so it asks first. */
function confirmClear() {
  if (window.confirm(t('list.confirmClear'))) clearList()
}

/** Destructive and one tap away from the checkbox, so it asks first. */
function confirmRemove(item) {
  if (window.confirm(t('list.confirmRemove', { name: displayName(item) }))) removeItem(item.id)
}

function formatQuantity(item) {
  if (item.quantity == null) return ''
  const rounded = Math.round(item.quantity * 100) / 100
  return `${rounded} ${item.unit}`.trim()
}
</script>

<template>
  <section>
    <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 class="text-4xl font-black tracking-tight text-slate-950">{{ t('list.heading') }}</h1>
        <p class="mt-2 text-slate-500">{{ t('list.remaining', { n: itemCount }) }} · {{ t('list.total', { n: totalCount }) }}</p>
      </div>
      <div class="flex gap-2">
        <button v-if="state.shoppingList.some(item => item.checked)" @click="clearChecked" class="rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">{{ t('list.clearChecked') }}</button>
        <button v-if="state.shoppingList.length" @click="confirmClear" class="rounded-xl px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50">{{ t('list.clearAll') }}</button>
      </div>
    </div>

    <div v-if="!state.shoppingList.length" class="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <div class="text-5xl">🛒</div>
      <h2 class="mt-4 text-xl font-black text-slate-900">{{ t('list.emptyTitle') }}</h2>
      <p class="mt-2 text-sm text-slate-500">{{ t('list.emptyHint') }}</p>
      <RouterLink to="/" class="mt-5 inline-block rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">{{ t('common.browseRecipes') }}</RouterLink>
    </div>

    <div v-else class="space-y-6">
      <section v-for="[group, items] in grouped" :key="group" class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 px-5 py-4">
          <h2 class="font-black text-slate-900">{{ t(`list.group.${group}`) }}</h2>
        </div>
        <ul class="divide-y divide-slate-100">
          <li v-for="item in items" :key="item.id" @click="toggleItem(item.id)" class="flex cursor-pointer items-start gap-3 px-5 py-4 transition hover:bg-slate-50">
            <button @click.stop="toggleItem(item.id)" :aria-label="item.checked ? t('list.uncheck') : t('list.check')" :class="['mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition', item.checked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-blue-400']">
              <span v-if="item.checked">✓</span>
            </button>
            <div class="min-w-0 flex-1">
              <div :class="[item.checked ? 'text-slate-400 line-through' : 'text-slate-900']">
                <span class="font-bold">{{ displayName(item) }}</span>
                <span v-if="formatQuantity(item)" class="ml-2 text-slate-500">{{ formatQuantity(item) }}</span>
              </div>
              <div class="mt-1 text-xs text-slate-400">{{ item.recipeTitle }} · ×{{ item.multiplier }}</div>
            </div>
            <button @click.stop="confirmRemove(item)" class="rounded-lg px-2 py-1 text-xs font-bold text-slate-300 hover:bg-rose-50 hover:text-rose-500">{{ t('common.remove') }}</button>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>