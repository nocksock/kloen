import { computed } from 'alien-signals'
import { effect, signal, Signal, WriteableSignal } from './core'

/** Mutate the internal value of a signal and notify subscribers */
export const mutate = <T>(self: WriteableSignal<T>, fn: (value: T) => void) => {
  const value = self.$.currentValue
  fn(value)
  self.$.emit()
}

export const update = <T>(
  { $: self }: WriteableSignal<T>,
  fn: (value: T) => T
) => {
  self.set(fn(self.currentValue))
}
