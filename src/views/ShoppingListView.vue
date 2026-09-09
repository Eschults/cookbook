<script setup>
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PlusIcon from '../components/PlusIcon.vue'
import CheckIcon from '../components/CheckIcon.vue'
import TrashIcon from '../components/TrashIcon.vue'
import { useI18n } from 'vue-i18n'
import { useShoppingList } from '../composables/useShoppingList.js'
import { useLocale } from '../composables/useLocale.js'
import { stripInline } from '../services/markdown.js'
import { toDisplayAmount } from '../services/units.js'
import { densityOf } from '../services/densities.js'
import { pluralizeIngredientName, shouldPluralize } from '../services/pluralize.js'
import AddShoppingItemDialog from '../components/AddShoppingItemDialog.vue'

const { shoppingList, itemCount, totalCount, toggleItem, removeItem, clearList, addExtraItem } = useShoppingList()
const { t } = useI18n()
const { locale, collator } = useLocale()

// Checked items sink to the bottom, most recently checked first — that order
// lets you see what you just ticked off without hunting for it. Unchecked
// items stay alphabetical by ingredient name, collated in the active locale.
const sortedItems = computed(() => [...shoppingList.value].sort((a, b) => {
  if (a.checked !== b.checked) return Number(a.checked) - Number(b.checked)
  if (a.checked) return b.checkedAt - a.checkedAt
  return collator.value.compare(a.name, b.name)
}))

/**
 * Recipes write ingredients in lower case; the list reads better sentence-cased.
 * A name may carry markdown, which is dropped rather than rendered — the row is
 * a thing to pick up in a shop, not a link to follow.
 */
function displayName(item) {
  const stripped = stripInline(item.name)
  const name = shouldPluralize(item.quantity, item.unit) ? pluralizeIngredientName(stripped) : stripped
  return name.charAt(0).toUpperCase() + name.slice(1)
}

const showAddDialog = ref(false)

function addItem({ name, quantity, unit }) {
  addExtraItem(name, quantity, unit)
  showAddDialog.value = false
}

/** Wipes work that cannot be recovered, so it asks first. */
function confirmClear() {
  if (window.confirm(t('list.confirmClear'))) clearList()
}

/** Destructive and one tap away from the checkbox, so it asks first. */
function confirmRemove(item) {
  if (window.confirm(t('list.confirmRemove', { name: displayName(item) }))) removeItem(item.id)
}

/**
 * Classic iOS swipe-to-delete for mobile: a row drags with the finger and
 * snaps open or shut past the halfway point, revealing a red "Remove" button
 * the width of REVEAL_WIDTH. Desktop keeps the always-visible text button
 * instead, so none of this applies there.
 */
const REVEAL_WIDTH = 80
const openItemId = ref(null)
const swipe = reactive({ id: null, startX: 0, dx: 0, moved: false })

function onTouchStart(item, event) {
  if (openItemId.value && openItemId.value !== item.id) openItemId.value = null
  swipe.id = item.id
  swipe.startX = event.touches[0].clientX
  swipe.dx = openItemId.value === item.id ? -REVEAL_WIDTH : 0
  swipe.moved = false
}

function onTouchMove(item, event) {
  if (swipe.id !== item.id) return
  const delta = event.touches[0].clientX - swipe.startX
  if (Math.abs(delta) > 4) swipe.moved = true
  const base = openItemId.value === item.id ? -REVEAL_WIDTH : 0
  swipe.dx = Math.min(0, Math.max(-REVEAL_WIDTH, base + delta))
}

function onTouchEnd(item) {
  if (swipe.id !== item.id) return
  openItemId.value = swipe.dx < -REVEAL_WIDTH / 2 ? item.id : null
  swipe.id = null
  swipe.dx = 0
}

function rowOffset(item) {
  if (swipe.id === item.id) return swipe.dx
  return openItemId.value === item.id ? -REVEAL_WIDTH : 0
}

/** A swipe that moved the row must not also toggle it once the finger lifts. */
function handleRowClick(item) {
  if (swipe.moved) {
    swipe.moved = false
    return
  }
  if (openItemId.value === item.id) {
    openItemId.value = null
    return
  }
  toggleItem(item.id)
}

/**
 * A spoonful or a pinch is not something anyone buys by the number: "3.5
 * teaspoons of salt" is noise on a shopping list where "salt" alone is the
 * useful part. Matches "spoon", "pinch", "cuillère"/"cuillere"/"cuiller" and
 * "pincée"/"pincee"/"pince" regardless of accent or a trailing e, so
 * teaspoon, tablespoon, cuillère à café/soupe, pinch and pincée all hide
 * their quantity.
 */
const UNQUANTIFIED_UNIT = /spoon|cuiller|pinch|pince/
const stripDiacritics = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '')

function formatQuantity(item) {
  if (item.quantity == null) return ''
  if (UNQUANTIFIED_UNIT.test(stripDiacritics(item.unit).toLowerCase())) return ''
  // Weighing is the recipe page's business; here the amount should read the
  // way the thing is sold, which for a liquid is by volume.
  const { quantity, unit } = toDisplayAmount(item.quantity, item.unit, { density: densityOf(item.name) })
  const rounded = Math.round(quantity * 100) / 100
  return `${rounded.toLocaleString(locale.value)} ${unit}`.trim()
}
</script>

<template>
  <section>
    <!-- The nav names the page; this is for the document outline. -->
    <h1 class="sr-only">{{ t('list.heading') }}</h1>

    <!-- The counts and the actions share one line at every width. `ml-auto`
         rather than `justify-between` keeps the buttons on the right even when
         a narrow screen forces them onto their own line. -->
    <div class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <p class="text-sm text-slate-500">{{ t('list.remaining', { n: itemCount }) }} · {{ t('list.total', { n: totalCount }) }}</p>
      <div class="ml-auto flex items-center gap-2">
        <button @click="showAddDialog = true" class="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-150 px-3 py-1.5 text-sm font-medium text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-200"><PlusIcon class="size-4" />{{ t('list.addItem') }}</button>
        <!-- Wiping the whole list is a rare, destructive action that a phone
             header has no room for: it stays a desktop affordance, where
             swipe-to-delete is not available either. -->
        <button v-if="shoppingList.length" @click="confirmClear" class="hidden rounded-md border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:border-rose-300 hover:bg-rose-50 sm:block">{{ t('common.clearAll') }}</button>
      </div>
    </div>

    <div v-if="!shoppingList.length" class="rounded-lg border border-dashed border-slate-200 bg-white p-10 text-center">
      <div class="text-3xl">🛒</div>
      <h2 class="mt-3 text-base font-semibold text-slate-900">{{ t('list.emptyTitle') }}</h2>
      <p class="mt-1.5 text-sm text-slate-500">{{ t('list.emptyHint') }}</p>
      <div class="mt-5 flex flex-wrap justify-center gap-2">
        <RouterLink to="/" class="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-150 px-3 py-1.5 text-sm font-medium text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-200">{{ t('common.browseRecipes') }}</RouterLink>
        <button @click="showAddDialog = true" class="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"><PlusIcon class="size-4" />{{ t('list.addItem') }}</button>
      </div>
    </div>

    <div v-else class="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <TransitionGroup tag="ul" name="reorder" class="divide-y divide-slate-100">
        <li v-for="item in sortedItems" :key="item.id" class="relative overflow-hidden">
          <!-- Slides in from the right on top of the row rather than pushing
               its content aside, so the checkbox and name never move. The
               desktop text button below covers the same action there, so
               this only needs to exist on mobile. -->
          <!-- The swipe-then-tap gesture is itself a deliberate two-step
               action, so unlike the desktop button this skips window.confirm. -->
          <button
            @click="removeItem(item.id)"
            :class="['absolute inset-y-0 right-0 z-10 flex w-20 items-center justify-center bg-rose-600 text-sm font-medium text-white sm:hidden', swipe.id === item.id ? '' : 'transition-transform duration-200']"
            :style="{ transform: `translateX(${REVEAL_WIDTH + rowOffset(item)}px)` }"
          >{{ t('common.remove') }}</button>

          <div
            @click="handleRowClick(item)"
            @touchstart="onTouchStart(item, $event)"
            @touchmove="onTouchMove(item, $event)"
            @touchend="onTouchEnd(item)"
            class="flex cursor-pointer items-center gap-3 bg-white px-4 py-2.5 hover:bg-slate-50"
          >
            <button @click.stop="toggleItem(item.id)" :aria-label="item.checked ? t('list.uncheck') : t('list.check')" :class="['grid size-5 shrink-0 place-items-center rounded border-2 transition-colors', item.checked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-sky-400']">
              <CheckIcon v-if="item.checked" class="size-3" />
            </button>
            <!-- One line per item: which recipe it came from is not something
                 you act on while walking round a shop. -->
            <div :class="['min-w-0 flex-1', item.checked ? 'text-slate-400 line-through' : 'text-slate-900']">
              <span class="text-sm font-medium">{{ displayName(item) }}</span>
              <span v-if="formatQuantity(item)" class="ml-2 text-sm text-slate-500">{{ formatQuantity(item) }}</span>
            </div>
            <button @click.stop="confirmRemove(item)" :aria-label="t('common.remove')" :title="t('common.remove')" class="hidden shrink-0 rounded-md border border-rose-200 p-1.5 text-rose-500 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 sm:inline-block"><TrashIcon class="size-4" /></button>
          </div>
        </li>
      </TransitionGroup>
    </div>

    <AddShoppingItemDialog v-if="showAddDialog" @cancel="showAddDialog = false" @add="addItem" />
  </section>
</template>

<style scoped>
.reorder-move {
  transition: transform 300ms ease;
}

/*
 * A removed row stays in normal flow and shrinks via max-height rather than
 * being pulled out with position: absolute, so its collapse is what pushes
 * the rows below it upward — a native reflow, not a separate move transition.
 */
.reorder-leave-active {
  transition: max-height 300ms ease, opacity 300ms ease;
  max-height: 64px;
  overflow: hidden;
}

.reorder-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>