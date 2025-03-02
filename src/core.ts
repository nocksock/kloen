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

export interface WriteableSignal<T> {
  (): T
  (value: T): void
  $: Signal<T>
}

export function signal<T>(): WriteableSignal<T | undefined>
export function signal<T>(oldValue: T): WriteableSignal<T>
export function signal<T>(oldValue?: T): WriteableSignal<T | undefined> {
  const self = new Signal(oldValue)
  const api = <V extends T>(value?: V) => {
    if (value === undefined) {
      return self.get()
    }
    self.set(value)
  }
  api.$ = self
  return api
}

export class Signal<T = any> implements Dependency {
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

  set(value: T): void {
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
  }
}

export function computed<T>(getter: () => T): () => T {
  const self = new Computed(getter)
  return self.get.bind(self)
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

export function effect<T>(fn: () => T): () => void {
  const e = new Effect(fn)
  e.run()
  return () => e.stop()
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

type SignalRef = object | symbol | string | Function
const SIGNAL_REFS = new Map<SignalRef, WriteableSignal<any>>()
signal.for = <T>(key: SignalRef, defaultValue?: T): WriteableSignal<T> => {
  if (!SIGNAL_REFS.has(key)) {
    SIGNAL_REFS.set(key, signal(defaultValue))
  }
  return SIGNAL_REFS.get(key)!
}
