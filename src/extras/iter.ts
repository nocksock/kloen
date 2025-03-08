import { computed, Signal } from '../core'

export function filter<T>(
  $: Signal<T[]>,
  predicate: (value: T) => boolean
): Signal<T[]> {
  return computed<T>(() => $().filter(predicate))
}
