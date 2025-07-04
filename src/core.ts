import type { Dependency, Link, Subscriber } from 'alien-signals'
import { createReactiveSystem, SubscriberFlags } from 'alien-signals'

const {
  link,
  propagate,
  endTracking,
  startTracking,
  updateDirtyFlag,
  processComputedUpdate,
  processEffectNotifications,
} = createReactiveSystem({
  updateComputed(computed: Computed) {
    return computed.update()
  },
  notifyEffect(effect: Effect) {
    effect.notify()
    return true
  },
})

let activeSub: Subscriber | undefined = undefined
let batchDepth = 0

/** @internal */
export function startBatch(): void {
  ++batchDepth
}

/** @internal */
export function endBatch(): void {
  if (!--batchDepth) {
    processEffectNotifications()
  }
}

export interface WriteableSignal<Value> extends ReadableSignal<Value> {
  (): Value
  (value: Value): void
  /**
   * This is a reference to the signal object. Used internally by functions.
   * Never use this in application code!
   */
  $: Signal<Value>
}

export interface ReadableSignal<T> {
  (): T
}

/**
 * Creates a signal, which is a reactive value that can be read and written to.
 * Read it's value by calling it as a function, and write its value by passing
 * a new value to it - or use `update` or `mutate` to modify its internal value
 * via transformer functions.
 */
export function signal<T>(): WriteableSignal<T | undefined>
export function signal<T>(oldValue: T): WriteableSignal<T>
export function signal<T>(oldValue?: T): WriteableSignal<T | undefined> {
  const self = new Signal(oldValue)
  const api = <V extends T>(value?: V) => {
    if (value === undefined) {
      return self.get()
    }
    return self.set(value)
  }
  api.$ = self
  return api
}

/** @internal */
class Signal<T = any> implements Dependency {
  // Dependency fields
  subs: Link | undefined = undefined
  subsTail: Link | undefined = undefined
  currentValue: T

  constructor(currentValue: T) {
    this.currentValue = currentValue
  }

  get(): T {
    if (activeSub !== undefined) {
      link(this, activeSub)
    }
    return this.currentValue
  }

  emit() {
    const subs = this.subs
    if (subs !== undefined) {
      propagate(subs)
      if (!batchDepth) {
        processEffectNotifications()
      }
    }
  }

  set(value: T): T {
    if (this.currentValue !== value) {
      this.currentValue = value
      const subs = this.subs
      if (subs !== undefined) {
        propagate(subs)
        if (!batchDepth) {
          processEffectNotifications()
        }
      }
    }
    return value
  }
}

export interface ComputedSignal<T> {
  (): T
  $: Computed<T>
}

/**
 * Create a computed signal that automatically updates when its dependencies change.
 * `computed` is sometimes called `derive` in other libraries.
 *
 * Dependencies are automatically tracked.
 *
 * ```ts
 *  const value = signal(0)
 *  const double = computed(() => value() * 2)
 * ```
 *
 */
export function computed<T>(getter: () => T): ComputedSignal<T> {
  const $ = new Computed(getter)
  // @ts-expect-error
  return Object.defineProperty(() => $.get(), '$', { get: () => $ })
}

class Computed<T = any> implements Subscriber, Dependency {
  currentValue: T | undefined = undefined

  // Dependency fields
  subs: Link | undefined = undefined
  subsTail: Link | undefined = undefined

  // Subscriber fields
  deps: Link | undefined = undefined
  depsTail: Link | undefined = undefined
  // @ts-ignore
  flags: SubscriberFlags = SubscriberFlags.Computed | SubscriberFlags.Dirty

  getter: () => T

  constructor(getter: () => T) {
    this.getter = getter
  }

  get(): T {
    const flags = this.flags
    // @ts-ignore
    if (flags & (SubscriberFlags.PendingComputed | SubscriberFlags.Dirty)) {
      processComputedUpdate(this, flags)
    }
    if (activeSub !== undefined) {
      link(this, activeSub)
    }
    return this.currentValue!
  }

  update(): boolean {
    const prevSub = activeSub
    activeSub = this
    startTracking(this)
    try {
      const oldValue = this.currentValue
      const newValue = this.getter()
      if (oldValue !== newValue) {
        this.currentValue = newValue
        return true
      }
      return false
    } finally {
      activeSub = prevSub
      endTracking(this)
    }
  }
}

export class Effect<T = any> implements Subscriber {
  // Subscriber fields
  deps: Link | undefined = undefined
  depsTail: Link | undefined = undefined
  // @ts-ignore
  flags: SubscriberFlags = SubscriberFlags.Effect
  fn: () => T

  constructor(fn: () => T) {
    this.fn = fn
  }

  notify(): void {
    const flags = this.flags
    if (
      // @ts-ignore
      flags & SubscriberFlags.Dirty ||
      // @ts-ignore
      (flags & SubscriberFlags.PendingComputed && updateDirtyFlag(this, flags))
    ) {
      this.run()
    }
  }

  run(): T {
    const prevSub = activeSub
    activeSub = this
    startTracking(this)
    try {
      return this.fn()
    } finally {
      activeSub = prevSub
      endTracking(this)
    }
  }

  stop(): void {
    startTracking(this)
    endTracking(this)
  }
}

/**
 * Creates an effect that runs the provided function immediately and whenever
 * any of its dependencies change.
 * Use this whenever you want to do something outside of the reactive system,
 * eg. updating the DOM, logging, etc.
 * ```ts
 *  const count = signal(0)
 *  effect(() => {
 *    console.log(`Count is now: ${count()}`) //  logs "Count is now: 0"
 *  })
 *  // count(1) // logs "Count is now: 1"
 *  // count(2) // logs "Count is now: 2"
 * ```
 */
export function effect<T>(fn: () => T): () => void {
  const e = new Effect(fn)
  e.run()
  return () => e.stop()
}

type SignalRef = object | symbol | string | Function
const SIGNAL_REFS = new Map<SignalRef, WriteableSignal<any>>()

/**
 * Creates a signal with a unique identifier and returns the same on subsequent
 * calls. If a default value is provided, it will be used to initialize the
 * signal.
 *
 * NOTE: This will create a global signal reference, so it won't be garbage
 * collected automatically. Use `clearSignalRefs` to clear all signal, or
 * `signal.clear` to clear a specific signal.
 *
 * TODO: when a non-string is used as a key, it should be stored in a WeakMap
 */
signal.for = <T>(key: SignalRef, defaultValue?: T): WriteableSignal<T> => {
  if (!SIGNAL_REFS.has(key)) {
    const value =
      typeof defaultValue === 'function' ? defaultValue() : defaultValue
    SIGNAL_REFS.set(key, signal(value))
  }
  return SIGNAL_REFS.get(key)!
}

/**
 * Returns true if a signal reference exists for the given identifier.
 */
signal.exists = (key: SignalRef): boolean => SIGNAL_REFS.has(key)

/**
 * Clears a specific signal reference created by `signal.for` so it can be
 * garbage collected.
 */
signal.clear = (key: SignalRef) => SIGNAL_REFS.delete(key)

/**
 * Clears all registered signal references created by `signal.for`.
 * @internal
 */
export const clearSignalRefs = () => SIGNAL_REFS.clear()
