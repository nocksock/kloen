/**
 * @module kloen
 *
 * Root explanations
 */

const VALUES = new WeakMap();
const LISTENERS = new WeakMap();
const signalSymbol = Symbol();
const signalMarker = Symbol();

// Tracking context for auto-dependency collection
let currentEffect: (() => void) | null = null;
const effectDependencies = new WeakMap<() => void, Set<Observable<any>>>();

declare const observer: unique symbol
export interface Observable<T> {
  (): T,
  [signalMarker]: typeof signalSymbol
}

export type ObservedValue<S> = S extends Observable<infer V> ? V : never;

export interface MutableObservable<V> extends Observable<V> {
  set(value: V): MutableObservable<V>
}

export type Callback<T> = (value: T) => void

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
  if (Array.isArray(self)) return self.map(invoke);
  
  // Auto-track dependencies when there's an active effect
  if (currentEffect) {
    const deps = effectDependencies.get(currentEffect) || new Set();
    deps.add(self);
    effectDependencies.set(currentEffect, deps);
  }
  
  return VALUES.get(self);
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
  VALUES.set(self, value)
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

export function call<T, U>(self: Observable<T>, fn: (value: T, ...args: any[]) => U, ...args: any[]): U {
  return fn(self(), ...args)
}

export const derive = <R>(
  computation: () => R
): Observable<R> => {
  const derived = signal<R>(computation());
  
  // Set up the effect to keep it updated
  effect(() => {
    const newValue = computation();
    if (newValue !== derived()) {
      derived.set(newValue);
    }
  });

  // Make derived signal read-only
  return (() => derived()) as Observable<R>;
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
export function effect<T>(fn: () => void) {
  const runEffect = () => {
    // Clear old dependencies
    effectDependencies.delete(runEffect);
    
    // Set up tracking
    const parent = currentEffect;
    currentEffect = runEffect;
    
    try {
      fn();
    } finally {
      currentEffect = parent;
    }
  };

  // Initial run to collect dependencies
  runEffect();

  // Set up subscriptions for all tracked dependencies
  const deps = effectDependencies.get(runEffect);
  if (deps) {
    const cleanup = Array.from(deps).map(dep => 
      subscribe(dep, runEffect)
    );
    return () => cleanup.forEach(invoke);
  }
  
  return () => {};
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
 * Create a new Signal
 *
 * ```js
 * // basic usage
 * const $counter = Signal(0)
 * $counter.set(1)
 * $counter() // => 1
 * update($counter(), v => v + 1) // update value using a pure function
 * $counter() // => 2
 * ```
 *
 * @alias Signal.of
 */
// TODO: consider renaming this to Signal to more closely match Symbol API
export function signal<T>(value?: T): MutableObservable<T> {
  const self = ((value?: T) => {
    if (value !== undefined) return write(self, value)
    return read(self)
  }) as MutableObservable<T>

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
signal.for = <T>(key: SignalRef, defaultValue?: T, transformer = identity): MutableObservable<T> => {
  if (!SIGNAL_REFS.has(key)) {
    SIGNAL_REFS.set(key, signal(defaultValue))
  }
  return SIGNAL_REFS.get(key)!
}

const invoke = <R>(f: () => R) => f()

export const isSignal = (self: any): self is Observable<unknown> =>
  typeof self === "function" && self[signalMarker] === signalSymbol
