import { computed, effect, signal } from '../../core'

export const waitFor = (selector: string) => {
  const self = signal<Element | null>(null)
  const el = document.querySelector(selector)
  self(el)
  if (el) return self

  const observer = new MutationObserver(() => {
    const element = document.querySelector(selector)
    if (!element) return
    self(element)
    observer.disconnect()
  })

  observer.observe(document.body, { childList: true, subtree: true })

  return self
}

/**
 * @experimental work in progress
 */
export const element = (selector: string) => {
  const el = waitFor(selector)
  const observer = new MutationObserver(mutationList => {
    for (const mutation of mutationList) {
      if (mutation.type === 'childList') {
      el.$.emit()
      } else if (mutation.type === 'attributes') {
      el.$.emit()
      }
    }
  })

  effect(() => {
    if (!el()) return;
    observer.observe(el()!, {
      attributes: true,
      childList: true
    })
  })

  return computed(el)
}
