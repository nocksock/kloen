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

  toString() {
    return this.#value;
  }

  update(fn: (value: T, ...args: any[]) => T, ...args: any[]) {
    this.#value = fn(this.#value, ...args);
    CHANGES.add(this);
  }

  emit() {
    const value = this.get()
    this.#listeners.forEach(fn => fn(value))
  }

  onChange(cb: Callback<T>) {
    this.#listeners.add(cb)
    return () => this.#listeners.delete(cb)
  }

  map<U>(fn: (value: T) => U): Signal<U> {
    return derive(this, fn);
  }

  when(cb: Callback<T>) {
    return this.onChange(value => {
      if (value !== undefined && value !== null) cb(value);
    });
  }

  flatMap<U>(fn: (value: T) => Signal<U>): Signal<U> {
    const result = new Signal<U>(fn(this.get()).get());
    this.onChange(value => {
      const innerSignal = fn(value);
      result.set(innerSignal.get());
      innerSignal.onChange(innerValue => result.set(innerValue));
    });
    return result;
  }

  ap<U>(signalOfFn: Signal<(value: T) => U>): Signal<U> {
    const result = new Signal<U>(signalOfFn.get()(this.get()));

    // Update when either the function or the value changes
    signalOfFn.onChange(fn => result.set(fn(this.get())));
    this.onChange(value => result.set(signalOfFn.get()(value)));

    return result;
  }

  call<U>(fn: (value: T, ...args: any[]) => U, ...args: any[]): U {
    return fn(this.get(), ...args);
  }

  static #batchDepth = 0;
  static #batchQueue = new Set<Signal<any>>();

  filter(predicate: (value: T) => boolean): Signal<T> {
    const filtered = new Signal<T>(this.#value);
    this.onChange(value => {
      if (predicate(value)) {
        filtered.set(value);
      }
    });
    return filtered;
  }

  debounce(ms: number): Signal<T> {
    const debounced = new Signal<T>(this.#value);
    let timeoutId: ReturnType<typeof setTimeout>;

    this.onChange(value => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        debounced.set(value);
      }, ms);
    });

    return debounced;
  }

  distinct(compareFn: (a: T, b: T) => boolean = (a, b) => a === b): Signal<T> {
    const distinct = new Signal<T>(this.#value);
    let lastValue = this.#value;

    this.onChange(value => {
      if (!compareFn(lastValue, value)) {
        lastValue = value;
        distinct.set(value);
      }
    });

    return distinct;
  }

  withPrevious(): Signal<{ current: T; previous: T | undefined }> {
    const withPrev = new Signal<{ current: T; previous: T | undefined }>({
      current: this.#value,
      previous: undefined
    });

    this.onChange(value => {
      withPrev.set({
        current: value,
        previous: withPrev.get().current
      });
    });

    return withPrev;
  }

  static batch<T>(fn: () => T): T {
    Signal.#batchDepth++;
    try {
      const result = fn();
      Signal.#batchDepth--;

      if (Signal.#batchDepth === 0) {
        const queue = Array.from(Signal.#batchQueue);
        Signal.#batchQueue.clear();
        queue.forEach(signal => signal.emit());
      }

      return result;
    } catch (error) {
      Signal.#batchDepth--;
      Signal.#batchQueue.clear();
      throw error;
    }
  }

  static combine<T extends Record<string, Signal<any>>>(
    signals: T
  ): Signal<{ [K in keyof T]: T[K] extends Signal<infer U> ? U : never }> {
    const keys = Object.keys(signals) as (keyof T)[];
    const initial = {} as { [K in keyof T]: T[K] extends Signal<infer U> ? U : never };

    // Set initial values
    keys.forEach(key => {
      initial[key] = signals[key].get();
    });

    const combined = new Signal(initial);

    // Subscribe to all signals
    keys.forEach(key => {
      signals[key].onChange(value => {
        combined.update(current => ({
          ...current,
          [key]: value
        }));
      });
    });

    return combined;
  }

  reduce<U>(
    reducer: (accumulator: U, current: T) => U,
    initialValue: U
  ): Signal<U> {
    const reduced = new Signal<U>(initialValue);

    this.onChange(value => {
      reduced.update(acc => reducer(acc, value));
    });

    return reduced;
  }

  throttle(ms: number): Signal<T> {
    const throttled = new Signal<T>(this.#value);
    let lastRun = 0;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const run = (value: T) => {
      lastRun = Date.now();
      throttled.set(value);
    };

    this.onChange(value => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun;

      if (timeSinceLastRun >= ms) {
        run(value);
      } else if (!timeout) {
        timeout = setTimeout(() => {
          timeout = null;
          run(value);
        }, ms - timeSinceLastRun);
      }
    });

    return throttled;
  }

  // Modify the existing set method to support batching
  set(value: T) {
    this.#value = value;
    if (Signal.#batchDepth > 0) {
      Signal.#batchQueue.add(this);
    } else {
      CHANGES.add(this);
    }
    return this;
  }
}


const signal_get = (s: Signal<any>) => s.get();

export const derive = <T, R>(signal: Signal<T>, cb: (value: T) => R) => {
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

// @ts-ignore
const invoke = f => f()

export const on = <T>(signal: Signal<T> | Signal<T>[], cb: Callback<T>) => {
  if (!Array.isArray(signal)) return signal.onChange(cb)
  const callback = () => (cb as any)(...signal.map(signal_get))
  const unsubs = signal.map(signal => signal.onChange(callback))
  return () => unsubs.forEach(invoke)
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

export function when(pairs: [Signal<any>, any][], cb: () => void) {
  const signals = pairs.map(([signal]) => signal);

  return on(signals, (...values) => {
    const allMatch = pairs.every(([signal, expectedValue], index) =>
      values[index] === expectedValue
    );
    if (allMatch) {
      cb();
    }
  });
}

export const signal = <V>(initialValue: V) => new Signal<V>(initialValue);
