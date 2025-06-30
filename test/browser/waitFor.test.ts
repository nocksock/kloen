import { fixture, expect, nextFrame, html } from '@open-wc/testing'
import { element, waitFor } from '../../src/extras/experimental/element'
import sinon from 'sinon'
import { computed, effect } from '../../src/core'

describe('waitFor', () => {
  it('will have an element when it appears', done => {
    fixture(html` <div></div> `)
      .then(async el => {
        const ul = waitFor('ul')
        expect(ul()).to.be.null
        const list = document.createElement('ul')
        list.innerHTML = '<li>list item</li>'
        el.append(list)

        await nextFrame()

        expect(ul()).to.not.be.null
        expect(ul()!.children.length).to.equal(1)
      })
      .finally(done)
  })

  it('does not update on dom mutation (element()) does)', async () => {
    const el = await fixture(html` <div></div> `)
    const ul = waitFor('ul')
    expect(ul()).to.be.null
    const list = document.createElement('ul')
    list.innerHTML = '<li>list item</li>'
    el.append(list)

    await nextFrame()

    const count = computed(() => {
      return ul()?.children.length
    })

    expect(count()).to.eq(1)

    const addItem = () => {
      const li = document.createElement('li')
      li.innerText = 'list item'
      list.append(li)
    }

    addItem()
    addItem()
    addItem()

    await nextFrame()

    expect(count()).to.eq(1)
  })
})
