import type { WriteableSignal } from "../core.js"

/**
 * Mutate the value held by a signal and notify its subscribers. Useful when
 * storing an expensive value that can be mutated in place. eg. Sets, Maps,
 * Arrays and the likes.
 **/
export const mutate = <T, R>(self: WriteableSignal<T>, fn: (value: T) => R) => {
  const value = self.$.currentValue
  const ret = fn(value)
  self.$.emit()
  return ret
}

