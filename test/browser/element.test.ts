import { describe, expect, it, } from 'vitest'
import { element } from '../../src/extras/experimental/element'
import { html, nextFrame, spyEffect, withDOM } from '../test-helpers.ts'
import { computed } from '../../src/core'

describe('element', () => {
  it('will have an element when it appears', () => {
    return withDOM(html`<div></div>`, async doc => {
      const ul = element('ul', doc)
      const sideEffect = spyEffect(ul)
      const list = html`
        <ul>
          <li>item one</li>
          <li>item two</li>
          <li>item three</li>
        </ul>
      `
      const itemCount = computed(() => ul()?.children.length || 0)

      expect(itemCount()).toEqual(0)
      expect(sideEffect).toHaveBeenCalledTimes(1)
      doc.append(list)

      await nextFrame()

      expect(sideEffect).toHaveBeenCalledTimes(2)
      expect(itemCount()).toEqual(3)
    })
  })

  it('updates on mutations', () => {
    return withDOM(html`<div></div>`, async doc => {
      const ul = element('ul', doc)
      const sideEffect = spyEffect(ul)
      const list = html`
        <ul>
          <li>item <span>one</span></li>
        </ul>
      `
      const itemCount = computed(() => ul()?.children.length || 0)

      expect(sideEffect).toHaveBeenCalledTimes(1)
      doc.append(list)

      await nextFrame()

      expect(ul()).toBe(list)
      expect(sideEffect).toHaveBeenCalledTimes(2)
      expect(itemCount()).toEqual(1)

      console.log("changing attribute:")
      ul()?.querySelector("span")!.setAttribute("class", "test")

      console.log("----")
      console.log("appending")
      ul()!.append(html`<li>item two</li>`)

      await nextFrame()

      expect(itemCount()).toEqual(2)
      expect(sideEffect).toHaveBeenCalledTimes(3)
    })
  })
})
