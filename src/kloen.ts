const Value = Symbol('signal_value')
const Listeners = Symbol('signal_listeners')

type Value = typeof Value
type Listeners = typeof Listeners
type SignalMethod<V> = <R>(self: Signal<V>, ...args: any[]) => R
type Callback<T> = (value: T) => void

export interface Signal<T> {
  (): T
  value: T
  set(value: T): void
  get(): void
  [Value]: T
  [Listeners]: Set<Callback<T>>,
  toString: () => string
  // TODO, fix type
  // @ts-ignore
  mutate: SignalFn<typeof mutate>
}

const Changes = {
  queue: new Set<Signal<any>>(),
  batchDepth: 0,
  batchQueue: new Set<Signal<any>>(),

  add<T>(event: Signal<T>) {
    const target = Changes.batchDepth > 0 ? Changes.batchQueue : Changes.queue
    target.add(event)
    queueMicrotask(Changes.flush)
    return event
  },

  flush() {
    Changes.queue.forEach(signal => emit(signal))
    Changes.queue.clear()
  }
}

export function read(self: Signal<unknown>) {
  return self[Value]
}

export function write<T>(self: Signal<T>, value: T) {
  self[Value] = value
  return Changes.add(self)
}

const invoke = <R>(f: () => R) => f()

/**
 * Update the value using a pure function that returns the new value based on
 * its inputs.
 */
export function update<T>(self: Signal<T>, fn: (value: T, ...args: any[]) => T, ...args: any[]) {
  self[Value] = fn(self(), ...args)
  return Changes.add(self)
}

export function mutate<T>(self: Signal<T>, fn: (value: T, ...args: any[]) => any, ...args: any[]) {
  fn(self(), ...args)
  return Changes.add(self)
}

export function emit<T>(self: Signal<T>) {
  const value = self()
  self[Listeners].forEach(fn => fn(value))
}

export function map<T, U>(self: Signal<T>, fn: (value: T) => U): Signal<U> {
  return derive(self, fn)
}

export function call<T, U>(self: Signal<T>, fn: (value: T, ...args: any[]) => U, ...args: any[]): U {
  return fn(self(), ...args)
}

export const derive = <T, R, S>(
  self: Signal<S> | Signal<S>[],
  // TODO: fix this type
  cb: Function extends (...args: infer P) => R
    ? (...args: P) => R
    : (arg: S) => R
) => {
  if (Array.isArray(self)) {
    const callback = () => (cb as any)(...self.map(invoke))
    const initialValue = callback()
    const derived = signal(initialValue)
    self.forEach($ => subscribe($, () => derived.set(callback())))
    return derived
  }

  const initialValue = cb(self())
  const derived = signal(initialValue)
  subscribe(self, value => derived.set(cb(value)))

  return derived
}

function subscribe<T>(self: Signal<T>, cb: Callback<T>) {
  self[Listeners].add(cb)
  return () => self[Listeners].delete(cb)
}

export function watch<T>(
  self: Signal<T> | Signal<T>[],
  cb: Callback<T>
) {
  if (!Array.isArray(self)) return subscribe(self, cb)
  const callback = () => (cb as any)(...self.map(invoke))
  const unsubs = self.map($ => subscribe($, callback))
  return () => unsubs.forEach(invoke)
}

export function effect<T>(
  $signal: Signal<T> | Signal<any>[],
  cb: Callback<T>
) {
  if (Array.isArray($signal)) {
    const callback = () => (cb as any)(...$signal.map(invoke))
    $signal.forEach($ => subscribe($, callback))
    callback()
    return
  }

  cb($signal())
  watch($signal, cb)
}

export function batch<T>(fn: () => T): T {
  Changes.batchDepth++
  try {
    const result = fn()
    Changes.batchDepth--

    if (Changes.batchDepth === 0) {
      const queue = Array.from(Changes.batchQueue)
      Changes.batchQueue.clear()
      queue.forEach($ => emit($))
    }

    return result
  } catch (error) {
    Changes.batchDepth--
    Changes.batchQueue.clear()
    throw error
  }
}

function toString<T extends { toString: () => string }>(self: Signal<T>) {
  return self().toString()
}

export function enable<T>(self: T, ...fns: Function[]): T {
  for (const fn of fns) {
    self[fn.name] = fn.bind(null, self)
  }
  return self
}

export function signal<T>(value: T) {
  const self = (() => self[Value]) as Signal<T>

  self[Value] = value
  self[Listeners] = new Set<Callback<T>>()

  Object.defineProperty(self, 'value', {
    get: self,
    set: write.bind(null, self),
  })

  self.toString = toString.bind(null, self)
  self.get = read.bind(null, self)
  self.set = write.bind(null, self)

  return enable(self, mutate, map, call, update, emit, subscribe, derive, effect)
}

