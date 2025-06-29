import { fixture, expect, nextFrame, html } from '@open-wc/testing'
import { element } from '../../src/extras/element'
import sinon from 'sinon'
import { computed, effect } from '../../src/core'

describe('element', () => {
  it('updates on dom mutation', async () => {
    const el = await fixture(html`
      <div>
        <ul>
          <li>list item</li>
        </ul>
      </div>
    `)

    const ul = el.querySelector('ul')!
    const addItem = () => {
      const li = document.createElement('li')
      li.innerText = 'list item'
      ul.append(li)
    }

    let $ul = element('ul')
    let $count = computed(() => $ul().children.length);
    expect($count()).to.equal(1)
    const sideEffect = sinon.spy($ul)
    effect(sideEffect)

    addItem()
    addItem()
    addItem()

    await nextFrame()

    expect(sideEffect.callCount).to.equal(4)
    expect($count()).to.equal(4)

    document.querySelector('ul')!.remove()
    addItem() 
    expect(sideEffect.callCount).to.equal(4) // no more updates after element is removed
    expect(() => element('ul')).to.throw('Element not found: ul')
    // expect($count()).to.be.undefined() // still holds the last value
  })

  it.skip('should handle a not-yet-existing element')
})
