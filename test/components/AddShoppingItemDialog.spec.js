import { describe, expect, it } from 'vitest'
import AddShoppingItemDialog from '../../src/components/AddShoppingItemDialog.vue'
import { mountView } from '../helpers.js'

const open = () => mountView(AddShoppingItemDialog)

const nameField = view => view.find('#extra-name')
const quantityField = view => view.find('#extra-quantity')

/** Fills the form and submits it, the way pressing Enter in a field would. */
async function add(view, name, quantity) {
  await nameField(view).setValue(name)
  if (quantity !== undefined) await quantityField(view).setValue(quantity)
  await view.find('form').trigger('submit')
}

describe('AddShoppingItemDialog', () => {
  it('starts with a quantity of one, ready for a bare name', async () => {
    const view = await open()
    expect(quantityField(view).element.value).toBe('1')
  })

  it('emits a plain count', async () => {
    const view = await open()
    await add(view, 'citrons', '3')

    expect(view.emitted('add')).toEqual([[{ name: 'citrons', quantity: 3, unit: '' }]])
  })

  it('splits a quantity written with a unit', async () => {
    const view = await open()
    await add(view, 'beurre', '100 g')

    expect(view.emitted('add')).toEqual([[{ name: 'beurre', quantity: 100, unit: 'g' }]])
  })

  it('takes a unit that is a container rather than a measure', async () => {
    const view = await open()
    await add(view, 'huile d’olive', '2 bouteilles')

    expect(view.emitted('add')).toEqual([[{ name: 'huile d’olive', quantity: 2, unit: 'bouteilles' }]])
  })

  it('reads a decimal written the French way', async () => {
    const view = await open()
    await add(view, 'crème', '0,5 L')

    expect(view.emitted('add')).toEqual([[{ name: 'crème', quantity: 0.5, unit: 'L' }]])
  })

  it('accepts an empty quantity, leaving the item without an amount', async () => {
    const view = await open()
    await add(view, 'pain', '')

    expect(view.emitted('add')).toEqual([[{ name: 'pain', quantity: null, unit: '' }]])
  })

  it('trims the name', async () => {
    const view = await open()
    await add(view, '  pain  ', '1')

    expect(view.emitted('add')[0][0].name).toBe('pain')
  })

  it('refuses a quantity that does not start with a number', async () => {
    const view = await open()
    await add(view, 'pain', 'quelques')

    expect(view.emitted('add')).toBeUndefined()
    expect(view.text()).toContain('Start the quantity with a number')
  })

  it('clears the complaint as soon as the quantity is edited again', async () => {
    const view = await open()
    await add(view, 'pain', 'quelques')
    await quantityField(view).setValue('2')

    expect(view.text()).not.toContain('Start the quantity with a number')
    expect(view.text()).toContain('A number, or a number and a unit')
  })

  it('will not submit without a name', async () => {
    const view = await open()
    await view.find('form').trigger('submit')

    expect(view.emitted('add')).toBeUndefined()
  })

  it('cancels from the close button, the footer button and the backdrop', async () => {
    const view = await open()
    await view.find('[aria-label="Close"]').trigger('click')
    expect(view.emitted('cancel')).toHaveLength(1)

    await view.findAll('button').find(b => b.text() === 'Cancel').trigger('click')
    expect(view.emitted('cancel')).toHaveLength(2)

    await view.find('.fixed').trigger('click')
    expect(view.emitted('cancel')).toHaveLength(3)
  })

  it('cancels on Escape', async () => {
    const view = await open()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(view.emitted('cancel')).toHaveLength(1)
  })

  it('stops listening once unmounted', async () => {
    const view = await open()
    view.unmount()
    // Would throw on a detached instance if the listener outlived the dialog.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(view.emitted('cancel')).toBeUndefined()
  })
})
