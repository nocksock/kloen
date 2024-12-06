// Modify the existing set method to support batching
const invoke = (f) => f();
class Changes {
    #events = new Set();
    add(signal) {
        this.#events.add(signal);
        queueMicrotask(this.flush.bind(this));
    }
    flush() {
        this.#events.forEach(signal => signal.emit());
        this.#events.clear();
    }
}
const CHANGES = new Changes();
export class Signal {
    #value;
    #listeners = new Set();
    constructor(initialValue) {
        this.#value = initialValue;
        return this;
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
    update(fn, ...args) {
        this.#value = fn(this.#value, ...args);
        CHANGES.add(this);
    }
    emit() {
        const value = this.get();
        this.#listeners.forEach(fn => fn(value));
    }
    onChange(cb) {
        this.#listeners.add(cb);
        return () => this.#listeners.delete(cb);
    }
    map(fn) {
        return derive(this, fn);
    }
    flatMap(fn) {
        const result = new Signal(fn(this.get()).get());
        this.onChange(value => {
            const innerSignal = fn(value);
            result.set(innerSignal.get());
            innerSignal.onChange(innerValue => result.set(innerValue));
        });
        return result;
    }
    ap(signalOfFn) {
        const result = new Signal(signalOfFn.get()(this.get()));
        signalOfFn.onChange(fn => result.set(fn(this.get())));
        this.onChange(value => result.set(signalOfFn.get()(value)));
        return result;
    }
    call(fn, ...args) {
        return fn(this.get(), ...args);
    }
    filter(predicate) {
        const filtered = new Signal(this.#value);
        this.onChange(value => {
            if (predicate(value)) {
                filtered.set(value);
            }
        });
        return filtered;
    }
    reduce(reducer, initialValue) {
        const reduced = new Signal(initialValue);
        this.onChange(value => void reduced.update(acc => reducer(acc, value)));
        return reduced;
    }
    static #batchDepth = 0;
    static #batchQueue = new Set();
    static batch(fn) {
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
        }
        catch (error) {
            Signal.#batchDepth--;
            Signal.#batchQueue.clear();
            throw error;
        }
    }
    distinct(compareFn = (a, b) => a === b) {
        const distinct = new Signal(this.#value);
        let lastValue = this.#value;
        this.onChange(value => {
            if (!compareFn(lastValue, value)) {
                lastValue = value;
                distinct.set(value);
            }
        });
        return distinct;
    }
    set(value) {
        this.#value = value;
        if (Signal.#batchDepth > 0) {
            Signal.#batchQueue.add(this);
        }
        else {
            CHANGES.add(this);
        }
        return this;
    }
}
const signal_get = (s) => s.get();
export const derive = (signal, cb) => {
    if (!Array.isArray(signal)) {
        const initialValue = cb(signal.get());
        const derived = new Signal(initialValue);
        signal.onChange(value => derived.set(cb(value)));
        return derived;
    }
    const callback = () => cb(...signal.map(signal_get));
    const initialValue = callback();
    const derived = new Signal(initialValue);
    signal.forEach(signal => signal.onChange(() => derived.set(callback())));
    return derived;
};
export const on = (signal, cb) => {
    if (!Array.isArray(signal))
        return signal.onChange(cb);
    const callback = () => cb(...signal.map(signal_get));
    const unsubs = signal.map(signal => signal.onChange(callback));
    return () => unsubs.forEach(invoke);
};
export const bind = (signal, cb) => {
    if (!Array.isArray(signal)) {
        cb(signal.get());
        on(signal, cb);
        return;
    }
    const callback = () => cb(...signal.map(signal_get));
    signal.forEach(signal => signal.onChange(callback));
    callback();
};
export const signal = (initialValue) => new Signal(initialValue);
