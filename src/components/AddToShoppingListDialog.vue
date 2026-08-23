<script setup>
import { computed, ref } from 'vue'

const props = defineProps({ recipe: { type: Object, required: true } })
const emit = defineEmits(['cancel', 'add'])

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

function submit() {
  const value = Number(multiplier.value)
  if (Number.isFinite(value) && value > 0) emit('add', value)
}
</script>

<template>
  <div class="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" @click.self="$emit('cancel')">
    <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Shopping list</p>
          <h2 class="mt-1 text-2xl font-black text-slate-950">Scale {{ recipe.title }}</h2>
        </div>
        <button @click="$emit('cancel')" class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
      </div>

      <p class="mt-4 text-sm leading-6 text-slate-500">
        {{ hasServings ? `The recipe is written for ${recipe.servings} servings.` : 'This recipe does not declare a serving count, so enter the multiplier directly.' }}
      </p>

      <div v-if="hasServings" class="mt-5">
        <label class="text-sm font-bold text-slate-700">People</label>
        <input v-model.number="servings" @input="syncMultiplier" min="0.1" step="0.5" type="number" class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg font-bold outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100" />
      </div>

      <div class="mt-5">
        <label class="text-sm font-bold text-slate-700">Multiplier</label>
        <input v-model.number="multiplier" @input="syncServings" min="0.01" step="0.25" type="number" class="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-lg font-bold outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100" />
        <p class="mt-2 text-xs text-slate-400">For example, ×2.5 turns 2 servings into 5 servings.</p>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <button @click="$emit('cancel')" class="rounded-2xl px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
        <button @click="submit" class="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-amber-300">Add to list</button>
      </div>
    </div>
  </div>
</template>