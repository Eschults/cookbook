<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useShoppingList } from '../composables/useShoppingList.js'

const { state, itemCount, totalCount, toggleItem, removeItem, clearChecked, clearList } = useShoppingList()

const grouped = computed(() => {
  const groups = new Map()
  for (const item of state.shoppingList) {
    const key = item.unit ? 'Measured items' : 'Other'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  return [...groups.entries()]
})

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
        <p class="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-amber-600">Grocery run</p>
        <h1 class="text-4xl font-black tracking-tight text-slate-950">Shopping list</h1>
        <p class="mt-2 text-slate-500">{{ itemCount }} remaining · {{ totalCount }} total</p>
      </div>
      <div class="flex gap-2">
        <button v-if="state.shoppingList.some(item => item.checked)" @click="clearChecked" class="rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">Clear checked</button>
        <button v-if="state.shoppingList.length" @click="clearList" class="rounded-xl px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50">Clear all</button>
      </div>
    </div>

    <div v-if="!state.shoppingList.length" class="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <div class="text-5xl">🛒</div>
      <h2 class="mt-4 text-xl font-black text-slate-900">Your cart is empty</h2>
      <p class="mt-2 text-sm text-slate-500">Add a recipe and scale it for the number of people you're feeding.</p>
      <RouterLink to="/" class="mt-5 inline-block rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Browse recipes</RouterLink>
    </div>

    <div v-else class="space-y-6">
      <section v-for="[group, items] in grouped" :key="group" class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-100 px-5 py-4">
          <h2 class="font-black text-slate-900">{{ group }}</h2>
        </div>
        <ul class="divide-y divide-slate-100">
          <li v-for="item in items" :key="item.id" class="flex items-start gap-3 px-5 py-4">
            <button @click="toggleItem(item.id)" :aria-label="item.checked ? 'Uncheck item' : 'Check item'" :class="['mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition', item.checked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-amber-400']">
              <span v-if="item.checked">✓</span>
            </button>
            <div class="min-w-0 flex-1">
              <div :class="['font-semibold', item.checked ? 'text-slate-400 line-through' : 'text-slate-900']">
                <span v-if="formatQuantity(item)" class="font-black">{{ formatQuantity(item) }}</span>
                <span :class="formatQuantity(item) ? 'ml-1' : ''">{{ item.name }}</span>
              </div>
              <div class="mt-1 text-xs text-slate-400">{{ item.recipeTitle }} · ×{{ item.multiplier }}</div>
            </div>
            <button @click="removeItem(item.id)" class="rounded-lg px-2 py-1 text-xs font-bold text-slate-300 hover:bg-rose-50 hover:text-rose-500">Remove</button>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>