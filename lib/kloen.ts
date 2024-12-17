type Callback<T> = (value: T) => void
// Modify the existing set method to support batching

const invoke = <R>(f: () => R) => f()

class Changes {
  #events = new Set<ReadableSignal<any>>()
  add(signal: ReadableSignal<any>) {
    this.#events.add(signal)
    queueMicrotask(this.flush.bind(this))
  }
  flush() {
    this.#events.forEach(signal => signal.emit())
    this.#events.clear()
  }
}

const CHANGES = new Changes()

/**
 * Readonly signals are usually derived from other signals.
 *
 * Note: atm the difference is only in typescript, so `instanceof` will yield
 * the same result for both. It's a soft protection to not accidentally update
 * a derived signal.
 */
export type ReadonlySignal<T> = Omit<Signal<T>, 'set' | 'update'>

export type ReadableSignal<T> = Signal<T> | ReadonlySignal<T>

export class Signal<T> {
  #value: T
  #listeners = new Set<Callback<T>>()

  constructor(initialValue: T) {
    this.#value = initialValue
    return this as Signal<typeof initialValue>
  }

  get value() {
    return this.#value
  }

  set value(value) {
    this.set(value)
  }

  get() {
    return this.#value
  }

  toString() {
    return this.#value
  }

  update(fn: (value: T, ...args: any[]) => T, ...args: any[]) {
    this.#value = fn(this.#value, ...args)
    CHANGES.add(this)
  }

  mutate(fn: (value: T, ...args: any[]) => any, ...args: any[]) {
    fn(this.#value, ...args)
    CHANGES.add(this)
  }

  emit() {
    const value = this.get()
    this.#listeners.forEach(fn => fn(value))
  }

  onChange(cb: Callback<T>) {
    this.#listeners.add(cb)
    return () => this.#listeners.delete(cb)
  }

  map<U>(fn: (value: T) => U): ReadonlySignal<U> {
    return derive(this, fn)
  }

  flatMap<U>(fn: (value: T) => ReadableSignal<U>): ReadonlySignal<U> {
    const result = new Signal<U>(fn(this.get()).get())
    this.onChange(value => {
      const innerSignal = fn(value)
      result.set(innerSignal.get())
      innerSignal.onChange(innerValue => result.set(innerValue))
    })
    return result
  }

  ap<U>(signalOfFn: ReadableSignal<(value: T) => U>): ReadonlySignal<U> {
    const result = new Signal<U>(signalOfFn.get()(this.get()))

    signalOfFn.onChange(fn => result.set(fn(this.get())))
    this.onChange(value => result.set(signalOfFn.get()(value)))

    return result
  }

  call<U>(fn: (value: T, ...args: any[]) => U, ...args: any[]): U {
    return fn(this.get(), ...args)
  }

  when(predicate: (value: T) => boolean): ReadonlySignal<T> {
    const lastValue = new Signal<T>(this.#value)
    this.onChange(newValue => {
      if (predicate(newValue)) {
        lastValue.set(newValue)
      }
    })
    return lastValue
  }

  reduce<U>(
    reducer: (accumulator: U, current: T) => U,
    initialValue: U
  ): ReadonlySignal<U> {
    const reduced = new Signal<U>(initialValue)

    this.onChange(value => void reduced.update(acc => reducer(acc, value)))

    return reduced
  }

  static #batchDepth = 0
  static #batchQueue = new Set<Signal<any>>()
  static batch<T>(fn: () => T): T {
    Signal.#batchDepth++
    try {
      const result = fn()
      Signal.#batchDepth--

      if (Signal.#batchDepth === 0) {
        const queue = Array.from(Signal.#batchQueue)
        Signal.#batchQueue.clear()
        queue.forEach(signal => signal.emit())
      }

      return result
    } catch (error) {
      Signal.#batchDepth--
      Signal.#batchQueue.clear()
      throw error
    }
  }

  distinct(
    compareFn: (a: T, b: T) => boolean = (a, b) => a === b
  ): ReadonlySignal<T> {
    const distinct = new Signal<T>(this.#value)
    let lastValue = this.#value

    this.onChange(value => {
      if (!compareFn(lastValue, value)) {
        lastValue = value
        distinct.set(value)
      }
    })

    return distinct
  }

  set(value: T) {
    this.#value = value
    if (Signal.#batchDepth > 0) {
      Signal.#batchQueue.add(this)
    } else {
      CHANGES.add(this)
    }
    return this
  }
}

const signal_get = (s: ReadableSignal<any>) => s.get()

export const derive = <T, R>(
  signal: ReadableSignal<T>,
  cb: (value: T) => R
) => {
  if (!Array.isArray(signal)) {
    const initialValue = cb(signal.get())
    const derived = new Signal(initialValue)
    signal.onChange(value => derived.set(cb(value)))
    return derived
  }

  const callback = () => (cb as any)(...signal.map(signal_get))
  const initialValue = callback()
  const derived = new Signal(initialValue)
  signal.forEach(signal => signal.onChange(() => derived.set(callback())))
  return derived
}

export const on = <T>(
  signal: ReadableSignal<T> | ReadableSignal<T>[],
  cb: Callback<T>
) => {
  if (!Array.isArray(signal)) return signal.onChange(cb)
  const callback = () => (cb as any)(...signal.map(signal_get))
  const unsubs = signal.map(signal => signal.onChange(callback))
  return () => unsubs.forEach(invoke)
}

export const effect = <T>(
  signal: ReadableSignal<T> | ReadableSignal<any>[],
  cb: Callback<T>
) => {
  if (!Array.isArray(signal)) {
    cb(signal.get())
    on(signal, cb)
    return
  }

  const callback = () => (cb as any)(...signal.map(signal_get))
  signal.forEach(signal => signal.onChange(callback))
  callback()
}

export const signal = <V>(initialValue: V) => new Signal<V>(initialValue)
