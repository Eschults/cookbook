import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { i18n } from '../src/i18n/index.js'
import { routes } from '../src/router.js'

/**
 * Mounts a component with the app's real i18n instance and route table.
 *
 * The i18n singleton is shared on purpose: useLocale() mutates it directly, so
 * a per-test instance would leave components and the composable disagreeing.
 */
export async function mountView(component, { props = {}, route = '/' } = {}) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(route)
  await router.isReady()

  return mount(component, {
    props,
    global: { plugins: [i18n, router] }
  })
}

/**
 * A recipe in the shape `toRecipe()` produces, with overridable fields.
 *
 * `stepGroups` follows `steps` unless it is overridden, so a test that only
 * cares about the steps does not have to restate them in grouped form.
 */
export function makeRecipe(overrides = {}) {
  const recipe = makeRecipeFields(overrides)
  if (!overrides.stepGroups) {
    recipe.stepGroups = recipe.steps.length ? [{ title: null, steps: recipe.steps }] : []
  }
  return recipe
}

function makeRecipeFields(overrides) {
  return {
    id: 'guacamole',
    slug: 'guacamole',
    title: 'Guacamole',
    description: 'Some people call it guac.',
    tags: ['sauce', 'vegan'],
    yields: [{ factor: 4, unit: 'Servings', label: '4 Servings' }],
    servings: 4,
    ingredients: [
      { name: 'avocado', quantity: 1, unit: '', link: null, group: null, original: '1 avocado', scalable: true },
      { name: 'salt', quantity: 0.5, unit: 'teaspoon', link: null, group: null, original: '0.5 teaspoon salt', scalable: true },
      { name: 'lemon juice', quantity: null, unit: '', link: null, group: null, original: 'lemon juice', scalable: false }
    ],
    steps: ['Mash the avocado.', 'Season to taste.'],
    stepGroups: [],
    sources: [],
    instructions: 'Mash the avocado.',
    sourcePath: 'recipes/guacamole/recipe.md',
    ...overrides
  }
}
