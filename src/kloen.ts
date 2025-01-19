const VALUES = new WeakMap()
const LISTENERS = new WeakMap()

export type SignalFn<F> = F extends (self: any, ...args: infer P) => infer R
  ? (...args: P) => R
  : never

export interface Observable<T> {
  (): T
  emit(): SignalFn<typeof emit<T>>
}

export interface MutableObservable<V> extends Observable<V> {
  set(value: V): MutableObservable<V>
}

export type Callback<T> = (value: T) => void

// I need to keep in mind that callbacks might be called for different signals
// so I can't batch these too generally. maybe that was my idea behind the
// batch() function?
//
// const Callbacks = {
//   queue: new WeakMap<Callback<any>, any>(),
//   schedule(callback: Callback<any>, ...params: any) {
//     this.queue.set(callback, params)
//     queueMicrotask(Callbacks.call)
//   },
//   call(cb) {
//     Callbacks.queue.entries.forEach(([cb, params]: any[]) => cb(...params) )
//     Callbacks.queue.clear()
//   }
// }

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

/**
 * read the value of a signal
 */
export function read<T>(self: Observable<T> | Observable<T>[]) {
  if(Array.isArray(self)) return self.map(invoke)
  return VALUES.get(self)
}

/**
 * Update a signal's value
 *
 * TODO: should this really use Microtask by default?
 *    - make subscribers lazy instead
 *    - would make reasoning simpler
 */
export function write<T>(self: MutableObservable<T>, value: T) {
  // @ts-ignore
  VALUES.set(self, self[__TRANSFORMER](value, self()))
  return Changes.add(self)
}

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
export function mutate<T>(self: MutableObservable<T>, fn: (value: T, ...args: any[]) => void, ...args: any[]) {
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
): Observable<R> => {
  // TODO: there is implementation overlap with effect, refactor so that one of
  //  them uses the other
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

const CALLBACK_QUEUE = new Set();
function subscribe<T>(self: Observable<T>, cb: Callback<T>) {
  LISTENERS.get(self).add(cb)
  return () => LISTENERS.get(self).delete(cb)
}

/**
 * Observe a value and trigger a callback whenever it updates. Stop observing
 * by calling the return value - which is an unsubscribe function.
 *
 * Callback is *not* called initialy it waits for the next update. Use
 * `effect` for that.
 *
 * When given an array, it watches all the signals in that array.
 * This can be safely assumed, since arrays are not observable
 *
 * TODO: when watching multiple, call the cb only once for any number of
 *  update during a single tick.
 *    possible ways:
 *
 * ## Drafts:
 *
 * ```js
 *  const values = $$ => $$.map(invoke)
 *  function watch($$) {
 *    const $values = signal(values($$))
 *
 *    batch(() => {
 *    })
 *  }
 *
 * ```
 *
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
    callback()
    return watch($signal, callback)
  }

  cb($signal())
  return watch($signal, cb)
}

/**
 * batch signal updates
 *
 * When updating multiple signals at once this can be used to trigger
 * all the updates in a single tick.
 *
 * TODO: when an error is thrown, no update should happen (transaction)
 * TODO: (unsure) This can be used to force even otherwise eager observables to update lazily
 */
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
  return `Signal(${self().toString()})`
}

const __TRANSFORMER = Symbol()

const identity = <T>(v: T) => v
/**
* TODO: make second function a transformer function
*/
export function signal<T>(value?: T, transformer = identity): MutableObservable<T> {
  const self = (() => read(self)) as MutableObservable<T>

  // @ts-ignore
  self[__TRANSFORMER] = transformer

  VALUES.set(self, value)
  LISTENERS.set(self, new Set<Callback<T>>())

  // @ts-ignore
  self.toString = toString.bind(null, self)

  // @ts-ignore
  self.set = write.bind(null, self)

  return self
}

type SignalRef = object | symbol | string | Function;
const SIGNAL_REFS = new Map<SignalRef, MutableObservable<any>>()
signal.for = <T>(key: SignalRef, defaultValue?: T): MutableObservable<T> => {
  if(!SIGNAL_REFS.has(key)) {
    SIGNAL_REFS.set(key, signal(defaultValue))
  }
  return SIGNAL_REFS.get(key)!
}

const invoke = <R>(f: () => R) => f()
