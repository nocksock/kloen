import { watch, signal, update, Observable } from "./kloen"

export function filter<T>(self: Observable<T>, predicate: (value: T) => boolean): Observable<T> {
  const lastValue = signal(self())

  watch(self, newValue => {
    if (predicate(newValue)) {
      lastValue.set(newValue)
    }
  })
  return lastValue
}


export function when<T>(self: Observable<T>, predicate: (value: T) => boolean): Observable<T> {
  const lastValue = signal(self())
  watch(self, newValue => {
    if (predicate(newValue)) {
      lastValue.set(newValue)
    }
  })
  return lastValue
}


export function reduce<T, U>(
  self: Observable<T>,
  reducer: (accumulator: U, current: T) => U,
  initialValue: U
): Observable<U> {
  const reduced = signal(initialValue)

  watch(self, value => void update(reduced, acc => reducer(acc, value)))

  return reduced
}


export function distinct<T>(
  self: Observable<T>,
  compareFn: (a: T, b: T) => boolean = (a, b) => a === b
): Observable<T> {
  const distinct = signal(self())
  let lastValue = self()

  watch(self, value => {
    if (!compareFn(lastValue, value)) {
      lastValue = value
      distinct.set(value)
    }
  })

  return distinct
}

export function ap<T, U>(self: Observable<T>, signalOfFn: Observable<(value: T) => U>): Observable<U> {
  const result = signal(signalOfFn()(self()))

  watch(signalOfFn, fn => result.set(fn(self())))
  watch(self, value => result.set(signalOfFn()(value)))

  return result
}

export function flatMap<T, U>(self: Observable<T>, fn: (value: T) => Observable<U>): Observable<U> {
  const result = signal(fn(self())())
  watch(self, value => {
    const innerSignal = fn(value)
    result.set(innerSignal())
    watch(innerSignal, innerValue => result.set(innerValue))
  })
  return result
}
