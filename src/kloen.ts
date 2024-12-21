const VALUES = new WeakMap();
const LISTENERS = new WeakMap()

export type SignalFn<F> = F extends (self: any, ...args: infer P) => infer R
  ? (...args: P) => R
  : never


export interface Observable<T> {
  (): T
  emit(): SignalFn<typeof emit<T>>
}

export interface MutableObservable<V> extends Observable<V> {
  set(value: V): void
}

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
  return VALUES.get(self)
}

export function write<T>(self: MutableObservable<T>, value: T) {
  VALUES.set(self, value)
  return Changes.add(self)
}

const invoke = <R>(f: () => R) => f()

/**
 * Update the value using a pure function that returns the new value based on
 * its inputs.
 */
export function update<T>(self: MutableObservable<T>, fn: (value: T, ...args: any[]) => T, ...args: any[]) {
  write(self, fn(self(), ...args))
  return Changes.add(self)
}

/**
 * When the signal holds a particularly large non-primitive value, eg. an
 * Object, you can use this to mutate that object.
 */
export function mutate<T>(self: MutableObservable<T>, fn: (value: T, ...args: any[]) => any, ...args: any[]) {
  fn(self(), ...args)
  return Changes.add(self)
}

export function emit<T>(self: Observable<T>) {
  const value = self()
  LISTENERS.get(self).forEach((fn: Callback<T>) => fn(value))
}

export function map<T, U>(self: Observable<T>, fn: (value: T) => U): Observable<U> {
  return derive(self, fn)
}

export function call<T, U>(self: Observable<T>, fn: (value: T, ...args: any[]) => U, ...args: any[]): U {
  return fn(self(), ...args)
}

export const derive = <T, R>(
  self: Observable<T> | Observable<T>[],
  // TODO: fix this type
  cb: Function extends (...args: infer P) => R
    ? (...args: P) => R
    : (arg: T) => R
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
  LISTENERS.get(self).add(cb)
  return () => LISTENERS.get(self).delete(cb)
}

/**
 * Observe a value and trigger a callback whenever it updates. Stop observing
 * by calling the return value - which is an unsubscribe function.
 *
 * Callback is *not* called immediately it waits for the next update. Use
 * `effect` for that.
 */
export function watch<T>(
  self: Observable<T> | Observable<T>[],
  cb: Callback<T>
) {
  if (!Array.isArray(self)) return subscribe(self, cb)
  const callback = () => (cb as any)(...self.map(invoke))
  const unsubs = self.map($ => subscribe($, callback))
  return () => unsubs.forEach(invoke)
}

/**
 * Similar to watch, but is called immediately. This should be your preferred
 * way to create side effects. The callback is expected to return a cleanup 
 * function.
 */
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
  const self = (() => read(self)) as MutableObservable<T>

  VALUES.set(self, value)
  LISTENERS.set(self, new Set<Callback<T>>())

  // @ts-ignore
  self.toString = serialise.bind(null, self)

  // @ts-ignore
  self.set = write.bind(null, self)

  return self
}

