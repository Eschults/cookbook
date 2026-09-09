<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { parseAmount } from '../services/recipemd.js'

const emit = defineEmits(['cancel', 'add'])
const { t } = useI18n()

const name = ref('')
const quantity = ref('1')
const error = ref('')
const nameInput = ref(null)

// Unlike the recipe search field, this one is focused on every viewport:
// opening the dialog is already a deliberate act, so a keyboard appearing on
// a phone is the answer to a tap rather than an ambush.
onMounted(() => {
  nameInput.value?.focus()
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

// Listening on the document rather than the dialog: the wrapper never holds
// focus itself, so a key event would otherwise never reach it.
function onKeydown(event) {
  if (event.key === 'Escape') emit('cancel')
}

/**
 * The quantity is free text so that "2", "100 g" and "3 bouteilles" are all
 * sayable, and it goes through the same parser recipes are read with rather
 * than a second one that would drift from it. That parser rejects text with
 * no leading number, which is the one thing a quantity cannot be; an empty
 * field is fine and simply leaves the row without an amount.
 */
function submit() {
  const trimmed = name.value.trim()
  if (!trimmed) return

  let amount
  try {
    amount = parseAmount(quantity.value)
  } catch {
    error.value = t('addItem.invalidQuantity')
    return
  }

  emit('add', { name: trimmed, quantity: amount?.factor ?? null, unit: amount?.unit || '' })
}
</script>

<template>
  <div class="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" @click.self="$emit('cancel')">
    <form @submit.prevent="submit" class="w-full max-w-md rounded-lg bg-white p-5 ring-1 ring-slate-200">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{{ t('common.shoppingList') }}</p>
          <h2 class="mt-1 text-lg font-semibold text-slate-900">{{ t('addItem.title') }}</h2>
        </div>
        <button type="button" @click="$emit('cancel')" :aria-label="t('common.close')" class="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
      </div>

      <p class="mt-3 text-sm leading-6 text-slate-500">{{ t('addItem.intro') }}</p>

      <div class="mt-5">
        <label for="extra-name" class="text-sm font-medium text-slate-600">{{ t('addItem.name') }}</label>
        <input
          id="extra-name"
          ref="nameInput"
          v-model="name"
          type="text"
          :placeholder="t('addItem.namePlaceholder')"
          class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-base font-medium outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      <div class="mt-5">
        <label for="extra-quantity" class="text-sm font-medium text-slate-600">{{ t('addItem.quantity') }}</label>
        <!-- Deliberately a text field, not a number one: "100 g" and "3
             bouteilles" are quantities a shopping list wants and a number
             input would refuse. -->
        <input
          id="extra-quantity"
          v-model="quantity"
          @input="error = ''"
          type="text"
          inputmode="text"
          :aria-invalid="error ? 'true' : undefined"
          :class="['mt-2 w-full rounded-lg border px-3 py-2 text-base font-medium outline-none focus:ring-2', error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-sky-500 focus:ring-sky-100']"
        />
        <p v-if="error" class="mt-2 text-xs font-medium text-rose-600">{{ error }}</p>
        <p v-else class="mt-2 text-xs text-slate-400">{{ t('addItem.quantityHint') }}</p>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <button type="button" @click="$emit('cancel')" class="rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">{{ t('common.cancel') }}</button>
        <button type="submit" :disabled="!name.trim()" class="rounded-md border border-sky-200 bg-sky-150 px-4 py-2 text-sm font-medium text-sky-800 hover:border-sky-300 hover:bg-sky-200 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-400">{{ t('addItem.add') }}</button>
      </div>
    </form>
  </div>
</template>
