import { describe, expect, it } from 'vitest'
import AddToShoppingListDialog from '../../src/components/AddToShoppingListDialog.vue'
import { makeRecipe, mountView } from '../helpers.js'

const open = recipe => mountView(AddToShoppingListDialog, { props: { recipe } })
const inputs = view => view.findAll('input[type="number"]')

describe('AddToShoppingListDialog', () => {
  it('states the serving count the recipe was written for', async () => {
    const view = await open(makeRecipe())
    expect(view.text()).toContain('La recette est prévue pour 4 personnes.')
  })

  it('uses the singular for a one-serving recipe', async () => {
    const view = await open(makeRecipe({ servings: 1 }))
    expect(view.text()).toContain('La recette est prévue pour 1 personne.')
  })

  it('offers only the multiplier when there is no serving count', async () => {
    const view = await open(makeRecipe({ servings: null }))
    expect(view.text()).toContain('Cette recette n’indique pas de nombre de portions')
    expect(inputs(view)).toHaveLength(1)
  })

  it('derives the multiplier from the number of people', async () => {
    const view = await open(makeRecipe())
    const [people, multiplier] = inputs(view)

    await people.setValue(6)
    expect(Number(multiplier.element.value)).toBe(1.5)
  })

  it('derives the number of people from the multiplier', async () => {
    const view = await open(makeRecipe())
    const [people, multiplier] = inputs(view)

    await multiplier.setValue(0.5)
    expect(Number(people.element.value)).toBe(2)
  })

  it('emits the multiplier on submit', async () => {
    const view = await open(makeRecipe())
    await inputs(view)[1].setValue(2)
    await view.findAll('button').find(b => b.text() === 'Ajouter à la liste').trigger('click')

    expect(view.emitted('add')).toEqual([[2]])
  })

  it('refuses a multiplier that is not a positive number', async () => {
    const view = await open(makeRecipe())
    await inputs(view)[1].setValue(0)
    await view.findAll('button').find(b => b.text() === 'Ajouter à la liste').trigger('click')

    expect(view.emitted('add')).toBeUndefined()
  })

  it('cancels from the close button, the footer button and the backdrop', async () => {
    const view = await open(makeRecipe())
    await view.find('[aria-label="Fermer"]').trigger('click')
    expect(view.emitted('cancel')).toHaveLength(1)

    await view.findAll('button').find(b => b.text() === 'Annuler').trigger('click')
    expect(view.emitted('cancel')).toHaveLength(2)

    await view.find('.fixed').trigger('click')
    expect(view.emitted('cancel')).toHaveLength(3)
  })

  it('cancels on Escape', async () => {
    const view = await open(makeRecipe())
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(view.emitted('cancel')).toHaveLength(1)
  })

  it('ignores other keys', async () => {
    const view = await open(makeRecipe())
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))

    expect(view.emitted('cancel')).toBeUndefined()
  })

  it('stops listening once unmounted', async () => {
    const view = await open(makeRecipe())
    view.unmount()
    // Would throw on a detached instance if the listener outlived the dialog.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(view.emitted('cancel')).toBeUndefined()
  })
})
