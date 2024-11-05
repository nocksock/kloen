const QUEUE = new Set<Signal<any>>();

type Scope<T> = string | symbol | Signal<T>;
type Cb<T> = (value: T) => void;

class MessageBus {
  listeners = new Map<Scope<any>, Set<Cb<any>>>();

  on<T>(scope: Scope<T>, fn: (value: T) => void) {
    if (!this.listeners.has(scope)) this.listeners.set(scope, new Set());
    this.listeners.get(scope)!.add(fn);
    return () => this.listeners.get(scope)!.delete(fn);
  }

  bind<T>(scope: Scope<T>, callback: (value: T) => void): void {
    // @ts-ignore
    callback(scope instanceof Signal ? scope.get() : scope);
    this.on(scope, callback);
  }

  emit(scope: Exclude<Scope<any>, Signal<any>>, payload: any) {
    this.listeners.get(scope)?.forEach((callback: any) =>
      callback(payload)
    );
  }
}

const bus = new MessageBus();

export const on = bus.on.bind(bus)
export const emit = bus.emit.bind(bus)
export const bind = bus.bind.bind(bus)
export const signal = <V>(initialValue: V) => new Signal<V>(initialValue);

const flushEventQueue = () => {
  // @ts-expect-error - emit should only be called with a signal internally
  QUEUE.forEach(signal => bus.emit(signal, signal.get()));
  QUEUE.clear();
};

export class Signal<T> {
  #value: T;

  constructor(initialValue: T) {
    this.#value = initialValue;
    return this as Signal<typeof initialValue>;
  }

  get value() {
    return this.#value;
  }

  set value(value) {
    this.set(value);
  }

  get() {
    return this.#value;
  }

  set(value: T) {
    this.#value = value;
    this.#emit();
  }

  #emit() {
    QUEUE.add(this);
    queueMicrotask(flushEventQueue);
  }
}

export const derive = <Value, S extends Scope<T>, T>(scope: S, cb: (v: S extends Signal<T> ? T : S) => void) => {
  if (scope instanceof Signal) {
    const initialValue = cb(scope.get());
    const derived = new Signal(initialValue);
    bus.on(scope, () =>
      derived.set(cb(scope.get()))
    )
    return derived
  }

  const initialValue = cb();
  const derived = new Signal<Value>(initialValue);
  bus.on<Value | undefined>(scope, (v) =>
    derived.set(cb(v))
  )
  return derived
}
