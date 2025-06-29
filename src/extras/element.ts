import { signal } from '../core'

const observer = new MutationObserver((mutationList, observer) => {
  for (const mutation of mutationList) {
    signal.for(mutation.target).$.emit()
  }
})

export const element = (selector: string) => {
  const el = document.querySelector(selector)
  if (!el) {
    new MutationObserver(() => {}).disconnect() // Disconnect observer if no element found
    throw new Error(`Element not found: ${selector}`)
  }
  observer.observe(el, { attributes: true, childList: true, subtree: true })
  return signal.for(el, el)
}
