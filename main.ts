type Callback<T> = (value: T) => void;

class Changes {
  #events = new Set<Signal<any>>();
  add(signal: Signal<any>) {
    this.#events.add(signal);
    queueMicrotask(this.flush.bind(this));
  }
  flush() {
    this.#events.forEach(signal => signal.emit());
    this.#events.clear();
  }
}

const CHANGES = new Changes()

export class Signal<T> {
  #value: T;
  #listeners = new Set<Callback<T>>()

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
    CHANGES.add(this);
  }

  emit() {
    const value = this.get()
    this.#listeners.forEach(fn => fn(value))
  }

  onChange(cb: Callback<T>) {
    this.#listeners.add(cb)
  }
}


const signal_get = (s: Signal<any>) => s.get();

export const derive = <T>(signal: Signal<T>, cb: (value: T) => void) => {
  if (!Array.isArray(signal)) {
    const initialValue = cb(signal.get());
    const derived = new Signal(initialValue);
    signal.onChange(value => derived.set(cb(value)))
    return derived
  }

  const callback = () => (cb as any)(...signal.map(signal_get))
  const initialValue = callback()
  const derived = new Signal(initialValue);
  signal.forEach(signal => signal.onChange(() => derived.set(callback())))
  return derived
}

export const on = <T>(signal: Signal<T> | Signal<T>[], cb: Callback<T>) => {
  if (!Array.isArray(signal)) return signal.onChange(cb)
  const callback = () => (cb as any)(...signal.map(signal_get))
  signal.forEach(signal => signal.onChange(callback))
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

export const signal = <V>(initialValue: V) => new Signal<V>(initialValue);
