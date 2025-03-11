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

export function startBatch(): void {
  ++batchDepth
}

export function endBatch(): void {
  if (!--batchDepth) {
    processEffectNotifications()
  }
}

export interface WriteableSignal<T> extends ReadableSignal<T> {
  (): T
  (value: T): void
  $: Signal<T>
}

export interface ReadableSignal<T> {
  (): T
}

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

// TODO: reconsider class based approach over function based
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

interface ComputedSignal<T> {
  (): T
  $: Computed<T>
}

export function computed<T>(getter: () => T): ComputedSignal<T> {
  const $ = new Computed(getter)
  // @ts-expect-error
  return Object.defineProperty(() => $.get(), '$', { get: () => $ })
}

export class Computed<T = any> implements Subscriber, Dependency {
  currentValue: T | undefined = undefined

  // Dependency fields
  subs: Link | undefined = undefined
  subsTail: Link | undefined = undefined

  // Subscriber fields
  deps: Link | undefined = undefined
  depsTail: Link | undefined = undefined
  flags: SubscriberFlags = SubscriberFlags.Computed | SubscriberFlags.Dirty

  getter: () => T

  constructor(getter: () => T) {
    this.getter = getter
  }

  get(): T {
    const flags = this.flags
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
  flags: SubscriberFlags = SubscriberFlags.Effect
  fn: () => T

  constructor(fn: () => T) {
    this.fn = fn
  }

  notify(): void {
    const flags = this.flags
    if (
      flags & SubscriberFlags.Dirty ||
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
 */
export const clearSignalRefs = () => SIGNAL_REFS.clear()


signal.async = <T>(promise: Promise<T>, defaultValue: T) => {
  const value = signal(defaultValue)
  const handle = computed(() => value())
  promise.then(value)
  return handle
}
