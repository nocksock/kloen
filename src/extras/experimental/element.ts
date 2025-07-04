import { computed, effect, signal, type WriteableSignal } from '../../core.js'

export const waitFor = (
  selector: string,
  root: HTMLElement = document.body
) => {
  const self = signal<Element | null>(null)
  const el = document.querySelector(selector)
  if (el) {
    self(el)
    return self
  }

  const observer = new MutationObserver(() => {
    const element = root.querySelector(selector)
    if (!element) return
    self(element)
    observer.disconnect()
  })

  observer.observe(root, { childList: true, subtree: true })

  return self
}

/**
 * @experimental work in progress
 */
export const element = (
  selector: string,
  root: HTMLElement = document.body
) => {
  const self = waitFor(selector, root)
  const observer = new MutationObserver(() => self.$.emit())

  effect(() => {
    if (!self()) return

    observer.observe(root, {
      childList: true,
      attributes: true,
      subtree: true,
    })
  })

  return self
}
