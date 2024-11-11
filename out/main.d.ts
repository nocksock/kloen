type Callback<T> = (value: T) => void;
export declare class Signal<T> {
    #private;
    constructor(initialValue: T);
    get value(): T;
    set value(value: T);
    get(): T;
    toString(): T;
    update(fn: (value: T, ...args: any[]) => T, ...args: any[]): this;
    emit(): void;
    onChange(cb: Callback<T>): () => boolean;
    map<U>(fn: (value: T) => U): Signal<U>;
    when(cb: Callback<T>): () => boolean;
    flatMap<U>(fn: (value: T) => Signal<U>): Signal<U>;
    ap<U>(signalOfFn: Signal<(value: T) => U>): Signal<U>;
    call<U>(fn: (value: T, ...args: any[]) => U, ...args: any[]): U;
    filter(predicate: (value: T) => boolean): Signal<T>;
    debounce(ms: number): Signal<T>;
    distinct(compareFn?: (a: T, b: T) => boolean): Signal<T>;
    withPrevious(): Signal<{
        current: T;
        previous: T | undefined;
    }>;
    static batch<T>(fn: () => T): T;
    static combine<T extends Record<string, Signal<any>>>(signals: T): Signal<{
        [K in keyof T]: T[K] extends Signal<infer U> ? U : never;
    }>;
    reduce<U>(reducer: (accumulator: U, current: T) => U, initialValue: U): Signal<U>;
    throttle(ms: number): Signal<T>;
}
export declare const derive: <T, R>(signal: Signal<T>, cb: (value: T) => R) => Signal<any> | Signal<R>;
export declare const on: <T>(signal: Signal<T> | Signal<T>[], cb: Callback<T>) => () => void;
export declare const bind: <T>(signal: Signal<any>[] | Signal<T>, cb: Callback<T>) => void;
export declare function when(pairs: [Signal<any>, any][], cb: () => void): () => void;
export declare const signal: <V>(initialValue: V) => Signal<V>;
export {};
