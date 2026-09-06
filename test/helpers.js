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

/** An ingredient in the shape `toRecipe()` produces. */
export function ingredient(name, quantity = null, unit = '') {
  return { name, quantity, unit, link: null, group: null }
}

/**
 * A recipe in the shape `toRecipe()` produces, with overridable fields.
 *
 * `stepGroups` follows `steps` unless it is overridden, so a test that only
 * cares about the steps does not have to restate them in grouped form.
 */
export function makeRecipe(overrides = {}) {
  const recipe = {
    slug: 'guacamole',
    title: 'Guacamole',
    description: 'Some people call it guac.',
    tags: ['sauce', 'vegan'],
    yields: [{ factor: 4, unit: 'Servings', label: '4 Servings' }],
    servings: 4,
    ingredients: [
      ingredient('avocado', 1),
      ingredient('salt', 0.5, 'teaspoon'),
      ingredient('lemon juice')
    ],
    steps: ['Mash the avocado.', 'Season to taste.'],
    stepGroups: [],
    sources: [],
    ...overrides
  }

  if (!overrides.stepGroups) {
    recipe.stepGroups = recipe.steps.length ? [{ title: null, steps: recipe.steps }] : []
  }

  return recipe
}
