type Callback<T> = (value: T) => void;
/**
 * Readonly signals are usually derived from other signals.
 *
 * Note: atm the difference is only in typescript, so `instanceof` will yield
 * the same result for both. It's a soft protection to not accidentally update
 * a derived signal.
 */
type ReadonlySignal<T> = Omit<Signal<T>, 'set' | 'update'>;
type ReadableSignal<T> = Signal<T> | ReadonlySignal<T>;
export declare class Signal<T> {
    #private;
    constructor(initialValue: T);
    get value(): T;
    set value(value: T);
    get(): T;
    toString(): T;
    update(fn: (value: T, ...args: any[]) => T, ...args: any[]): void;
    emit(): void;
    onChange(cb: Callback<T>): () => boolean;
    map<U>(fn: (value: T) => U): ReadonlySignal<U>;
    flatMap<U>(fn: (value: T) => ReadableSignal<U>): ReadonlySignal<U>;
    ap<U>(signalOfFn: ReadableSignal<(value: T) => U>): ReadonlySignal<U>;
    call<U>(fn: (value: T, ...args: any[]) => U, ...args: any[]): U;
    when(predicate: (value: T) => boolean): ReadonlySignal<T>;
    reduce<U>(reducer: (accumulator: U, current: T) => U, initialValue: U): ReadonlySignal<U>;
    static batch<T>(fn: () => T): T;
    distinct(compareFn?: (a: T, b: T) => boolean): ReadonlySignal<T>;
    set(value: T): this;
}
export declare const derive: <T, R>(signal: ReadableSignal<T>, cb: (value: T) => R) => Signal<any> | Signal<R>;
export declare const on: <T>(signal: ReadableSignal<T> | ReadableSignal<T>[], cb: Callback<T>) => () => void;
export declare const bind: <T>(signal: ReadableSignal<T> | ReadableSignal<any>[], cb: Callback<T>) => void;
export declare const signal: <V>(initialValue: V) => Signal<V>;
export {};
