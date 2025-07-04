import { computed, signal } from "../core.js"
import { mutate } from "../extras.js"

/**
 * A reactive stack datastructure.
 *
 * TODO: consider auto pop on read? Is that useful? Or is it better to create an
 *   `autostack` that does this?
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
