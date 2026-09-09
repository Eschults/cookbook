<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({ recipe: { type: Object, required: true } })
const emit = defineEmits(['cancel', 'add'])
const { t, locale } = useI18n()

const servings = ref(props.recipe.servings || 1)
const multiplier = ref(1)

const hasServings = computed(() => Number.isFinite(Number(props.recipe.servings)) && Number(props.recipe.servings) > 0)

function syncMultiplier() {
  if (hasServings.value && Number(servings.value) > 0) {
    multiplier.value = Number(servings.value) / Number(props.recipe.servings)
  }
}

function syncServings() {
  if (hasServings.value && Number(multiplier.value) > 0) {
    servings.value = Number(props.recipe.servings) * Number(multiplier.value)
  }
}

/** The glyph and the example numbers live here, not in the catalogue. */
const example = computed(() => t('dialog.example', {
  factor: `×${(2.5).toLocaleString(locale.value)}`,
  from: t('common.servings', 2),
  to: t('common.servings', 5)
}))

// Listening on the document rather than the dialog: the modal never holds focus
// on open, so a key event would otherwise never reach it.
function onKeydown(event) {
  if (event.key === 'Escape') emit('cancel')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))

function submit() {
  const value = Number(multiplier.value)
  if (Number.isFinite(value) && value > 0) emit('add', value)
}
</script>

<template>
  <div class="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" @click.self="$emit('cancel')">
    <div class="w-full max-w-md rounded-lg bg-white p-5 ring-1 ring-slate-200">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{{ t('common.shoppingList') }}</p>
          <h2 class="mt-1 text-lg font-semibold text-slate-900">{{ t('dialog.scale', { title: recipe.title }) }}</h2>
        </div>
        <button @click="$emit('cancel')" :aria-label="t('common.close')" class="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
      </div>

      <p class="mt-3 text-sm leading-6 text-slate-500">
        {{ hasServings ? t('dialog.servingsKnown', { n: recipe.servings }) : t('dialog.servingsUnknown') }}
      </p>

      <div v-if="hasServings" class="mt-5">
        <label class="text-sm font-medium text-slate-600">{{ t('dialog.people') }}</label>
        <input v-model.number="servings" @input="syncMultiplier" min="0.1" step="0.5" type="number" class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-base font-medium outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
      </div>

      <div class="mt-5">
        <label class="text-sm font-medium text-slate-600">{{ t('dialog.multiplier') }}</label>
        <input v-model.number="multiplier" @input="syncServings" min="0.01" step="0.25" type="number" class="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-base font-medium outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
        <p class="mt-2 text-xs text-slate-400">{{ example }}</p>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <button @click="$emit('cancel')" class="rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">{{ t('common.cancel') }}</button>
        <button @click="submit" class="rounded-md border border-sky-200 bg-sky-150 px-4 py-2 text-sm font-medium text-sky-800 hover:border-sky-300 hover:bg-sky-200">{{ t('dialog.add') }}</button>
      </div>
    </div>
  </div>
</template>