const Value = Symbol('signal_value')
const Listeners = Symbol('signal_listeners')

export type SignalFn<F> = F extends (self: any, ...args: infer P) => infer R
  ? (...args: P) => R
  : never


interface Observable<T> {
  (): T
  [Value]: T
  [Listeners]: Set<Callback<T>>,
  emit(): SignalFn<typeof emit<T>>
}

interface MutableObservable<V> extends Observable<V> {
  set(value: V): void
  // mutate: SignalFn<typeof mutate<T>>
}

type Value = typeof Value
type Listeners = typeof Listeners
type ObservableMethod<V> = <R>(self: Observable<V>, ...args: any[]) => R
type Callback<T> = (value: T) => void

const Changes = {
  queue: new Set<Observable<any>>(),
  batchDepth: 0,
  batchQueue: new Set<Observable<any>>(),

  add<T>(event: Observable<T>) {
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

export function read<T>(self: Observable<T>) {
  return self[Value]
}

export function write<T>(self: MutableObservable<T>, value: T) {
  self[Value] = value
  return Changes.add(self)
}

const invoke = <R>(f: () => R) => f()

/**
 * Update the value using a pure function that returns the new value based on
 * its inputs.
 */
export function update<T>(self: MutableObservable<T>, fn: (value: T, ...args: any[]) => T, ...args: any[]) {
  self[Value] = fn(self(), ...args)
  return Changes.add(self)
}

export function mutate<T>(self: MutableObservable<T>, fn: (value: T, ...args: any[]) => any, ...args: any[]) {
  fn(self(), ...args)
  return Changes.add(self)
}

export function emit<T>(self: Observable<T>) {
  const value = self()
  self[Listeners].forEach(fn => fn(value))
}

export function map<T, U>(self: Observable<T>, fn: (value: T) => U): Observable<U> {
  return derive(self, fn)
}

export function call<T, U>(self: Observable<T>, fn: (value: T, ...args: any[]) => U, ...args: any[]): U {
  return fn(self(), ...args)
}

export const derive = <T, R, S>(
  self: Observable<S> | Observable<S>[],
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

function subscribe<T>(self: Observable<T>, cb: Callback<T>) {
  self[Listeners].add(cb)
  return () => self[Listeners].delete(cb)
}

export function watch<T>(
  self: Observable<T> | Observable<T>[],
  cb: Callback<T>
) {
  if (!Array.isArray(self)) return subscribe(self, cb)
  const callback = () => (cb as any)(...self.map(invoke))
  const unsubs = self.map($ => subscribe($, callback))
  return () => unsubs.forEach(invoke)
}

export function effect<T>(
  $signal: Observable<T> | Observable<any>[],
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

function toString<T extends { toString: () => string }>(self: Observable<T>) {
  return self().toString()
}

export function signal<T>(value: T, serialise = toString): MutableObservable<T> {
  const self = (() => self[Value]) as MutableObservable<T>

  self[Value] = value
  self[Listeners] = new Set<Callback<T>>()

  // @ts-ignore
  self.toString = serialise.bind(null, self)
  // @ts-ignore
  self.set = write.bind(null, self)

  return self
}

