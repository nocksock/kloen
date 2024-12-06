type Callback<T> = (value: T) => void
// Modify the existing set method to support batching

const invoke = <R>(f: () => R) => f()

class Changes {
  #events = new Set<Signal<any>>()
  add(signal: Signal<any>) {
    this.#events.add(signal)
    queueMicrotask(this.flush.bind(this))
  }
  flush() {
    this.#events.forEach(signal => signal.emit())
    this.#events.clear()
  }
}

const CHANGES = new Changes()

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

  emit() {
    const value = this.get()
    this.#listeners.forEach(fn => fn(value))
  }

  onChange(cb: Callback<T>) {
    this.#listeners.add(cb)
    return () => this.#listeners.delete(cb)
  }

  map<U>(fn: (value: T) => U): Signal<U> {
    return derive(this, fn)
  }

  flatMap<U>(fn: (value: T) => Signal<U>): Signal<U> {
    const result = new Signal<U>(fn(this.get()).get())
    this.onChange(value => {
      const innerSignal = fn(value)
      result.set(innerSignal.get())
      innerSignal.onChange(innerValue => result.set(innerValue))
    })
    return result
  }

  ap<U>(signalOfFn: Signal<(value: T) => U>): Signal<U> {
    const result = new Signal<U>(signalOfFn.get()(this.get()))

    signalOfFn.onChange(fn => result.set(fn(this.get())))
    this.onChange(value => result.set(signalOfFn.get()(value)))

    return result
  }

  call<U>(fn: (value: T, ...args: any[]) => U, ...args: any[]): U {
    return fn(this.get(), ...args)
  }

  filter(predicate: (value: T) => boolean): Signal<T> {
    const filtered = new Signal<T>(this.#value)
    this.onChange(value => {
      if (predicate(value)) {
        filtered.set(value)
      }
    })
    return filtered
  }

  reduce<U>(
    reducer: (accumulator: U, current: T) => U,
    initialValue: U
  ): Signal<U> {
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

  distinct(compareFn: (a: T, b: T) => boolean = (a, b) => a === b): Signal<T> {
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

const signal_get = (s: Signal<any>) => s.get()

export const derive = <T, R>(signal: Signal<T>, cb: (value: T) => R) => {
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

export const on = <T>(signal: Signal<T> | Signal<T>[], cb: Callback<T>) => {
  if (!Array.isArray(signal)) return signal.onChange(cb)
  const callback = () => (cb as any)(...signal.map(signal_get))
  const unsubs = signal.map(signal => signal.onChange(callback))
  return () => unsubs.forEach(invoke)
}

export const bind = <T>(signal: Signal<T> | Signal<any>[], cb: Callback<T>) => {
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
