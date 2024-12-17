import { enable, watch, type Signal, signal as core, update } from "./kloen"

export function when<T>(self: Signal<T>, predicate: (value: T) => boolean): Signal<T> {
  const lastValue = core(self())
  watch(self, newValue => {
    if (predicate(newValue)) {
      lastValue.set(newValue)
    }
  })
  return lastValue
}


export function reduce<T, U>(
  self: Signal<T>,
  reducer: (accumulator: U, current: T) => U,
  initialValue: U
): Signal<U> {
  const reduced = core(initialValue)

  watch(self, value => void update(reduced, acc => reducer(acc, value)))

  return reduced
}


export function distinct<T>(
  self: Signal<T>,
  compareFn: (a: T, b: T) => boolean = (a, b) => a === b
): Signal<T> {
  const distinct = core(self())
  let lastValue = self()

  watch(self, value => {
    if (!compareFn(lastValue, value)) {
      lastValue = value
      distinct.set(value)
    }
  })

  return distinct
}

export function ap<T, U>(self: Signal<T>, signalOfFn: Signal<(value: T) => U>): Signal<U> {
  const result = core(signalOfFn()(self()))

  watch(signalOfFn, fn => result.set(fn(self())))
  watch(self, value => result.set(signalOfFn()(value)))

  return result
}

export function flatMap<T, U>(self: Signal<T>, fn: (value: T) => Signal<U>): Signal<U> {
  const result = core(fn(self())())
  watch(self, value => {
    const innerSignal = fn(value)
    result.set(innerSignal())
    watch(innerSignal, innerValue => result.set(innerValue))
  })
  return result
}

export function signal<T>(value: T) {
  return enable(core(value), flatMap, ap, when, reduce, distinct, ap)
}
