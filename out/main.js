"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signal = exports.bind = exports.on = exports.derive = exports.Signal = void 0;
exports.when = when;
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
class Signal {
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
        return (0, exports.derive)(this, fn);
    }
    when(cb) {
        return this.onChange(value => {
            if (value !== undefined && value !== null)
                cb(value);
        });
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
        // Update when either the function or the value changes
        signalOfFn.onChange(fn => result.set(fn(this.get())));
        this.onChange(value => result.set(signalOfFn.get()(value)));
        return result;
    }
    call(fn, ...args) {
        return fn(this.get(), ...args);
    }
    static #batchDepth = 0;
    static #batchQueue = new Set();
    filter(predicate) {
        const filtered = new Signal(this.#value);
        this.onChange(value => {
            if (predicate(value)) {
                filtered.set(value);
            }
        });
        return filtered;
    }
    debounce(ms) {
        const debounced = new Signal(this.#value);
        let timeoutId;
        this.onChange(value => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                debounced.set(value);
            }, ms);
        });
        return debounced;
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
    withPrevious() {
        const withPrev = new Signal({
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
    static combine(signals) {
        const keys = Object.keys(signals);
        const initial = {};
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
    reduce(reducer, initialValue) {
        const reduced = new Signal(initialValue);
        this.onChange(value => {
            reduced.update(acc => reducer(acc, value));
        });
        return reduced;
    }
    throttle(ms) {
        const throttled = new Signal(this.#value);
        let lastRun = 0;
        let timeout = null;
        const run = (value) => {
            lastRun = Date.now();
            throttled.set(value);
        };
        this.onChange(value => {
            const now = Date.now();
            const timeSinceLastRun = now - lastRun;
            if (timeSinceLastRun >= ms) {
                run(value);
            }
            else if (!timeout) {
                timeout = setTimeout(() => {
                    timeout = null;
                    run(value);
                }, ms - timeSinceLastRun);
            }
        });
        return throttled;
    }
    // Modify the existing set method to support batching
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
exports.Signal = Signal;
const signal_get = (s) => s.get();
const derive = (signal, cb) => {
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
exports.derive = derive;
// @ts-ignore
const invoke = f => f();
const on = (signal, cb) => {
    if (!Array.isArray(signal))
        return signal.onChange(cb);
    const callback = () => cb(...signal.map(signal_get));
    const unsubs = signal.map(signal => signal.onChange(callback));
    return () => unsubs.forEach(invoke);
};
exports.on = on;
const bind = (signal, cb) => {
    if (!Array.isArray(signal)) {
        cb(signal.get());
        (0, exports.on)(signal, cb);
        return;
    }
    const callback = () => cb(...signal.map(signal_get));
    signal.forEach(signal => signal.onChange(callback));
    callback();
};
exports.bind = bind;
function when(pairs, cb) {
    const signals = pairs.map(([signal]) => signal);
    return (0, exports.on)(signals, (...values) => {
        const allMatch = pairs.every(([signal, expectedValue], index) => values[index] === expectedValue);
        if (allMatch) {
            cb();
        }
    });
}
const signal = (initialValue) => new Signal(initialValue);
exports.signal = signal;
