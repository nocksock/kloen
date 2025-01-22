import { watch, signal, update, derive, Observable } from "./kloen"

export function pipe<T>(self: Observable<T>, ...fns: Array<(arg: T) => T>) {
  return derive(self, initial => fns.reduce((result, fn) => fn(result), initial))
}

// TODO: rename to "track" maybe? Clashes with Iter-helpers
export function reduce<T, U>(
  self: Observable<T>,
  reducer: (accumulator: U, current: T) => U,
  initialValue: U
): Observable<U> {
  const reduced = signal(initialValue)

  watch(self, value => void update(reduced, acc => reducer(acc, value)))

  return reduced
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

