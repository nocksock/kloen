import { beforeEach, describe, expect, it, vi, } from 'vitest'
import { waitFor } from '../../src/extras/experimental/element'
import { html, nextFrame, spyEffect, withDOM } from '../test-helpers'
import { computed } from '../../src/core'

describe('waitFor', () => {
  it('will have an element when it appears', () => {
    return withDOM(html`<div></div>`, async doc => {
      const ul = waitFor('ul', doc)
      const list = html`
        <ul>
          <li>item one</li>
          <li>item two</li>
          <li>item three</li>
        </ul>
      `
      const itemCount = computed(() => ul()?.children.length || 0)

      expect(ul()).to.be.null
      doc.append(list)

      await nextFrame()

      expect(ul()).toBe(list)
      expect(itemCount()).toEqual(3)
    })
  })

  it('will not update on mutation (query will)', async () => {
    return withDOM(html`<div></div>`, async doc => {
      const ul = waitFor('ul', doc)
      const spy = spyEffect(ul)
      const list = html`
        <ul>
          <li>item one</li>
        </ul>
      `

      expect(spy).toHaveBeenCalledTimes(1)

      doc.append(list)
      await nextFrame()

      expect(spy).toHaveBeenCalledTimes(2)
      expect(ul()).toBe(list)

      list.append(html`<li>item two</li>`)

      expect(spy).toHaveBeenCalledTimes(2)
    })
  })
})
