import {
  WriteableSignal,
  computed,
  signal,
} from './core.js'

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

/**
 * Update the value of a signal using a transformation function.
 **/
export const update = <T>(self: WriteableSignal<T>, fn: (value: T) => T) =>
  self(fn(self()))

/**
 * A reactive stack datastructure.
 */
export const stack = <T>(initialValue: T) => {
  const self = signal<T[]>([initialValue]),
    size = computed(() => self().length),
    pop = () => mutate(self, v => v.pop() as T),
    prev = computed(() => self().at(-2)),
    push = <V extends T>(newValue: V) => mutate(self, $ => $.push(newValue)),
    current = computed(() => self().at(-1)),
    api = <V extends T>(value?: V) =>
      value === undefined ? current() : push(value)

  return Object.assign(api, {
    size,
    pop,
    prev,
    push,
  })
}
