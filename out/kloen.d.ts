type Callback<T> = (value: T) => void;
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
    map<U>(fn: (value: T) => U): Signal<U>;
    flatMap<U>(fn: (value: T) => Signal<U>): Signal<U>;
    ap<U>(signalOfFn: Signal<(value: T) => U>): Signal<U>;
    call<U>(fn: (value: T, ...args: any[]) => U, ...args: any[]): U;
    filter(predicate: (value: T) => boolean): Signal<T>;
    reduce<U>(reducer: (accumulator: U, current: T) => U, initialValue: U): Signal<U>;
    static batch<T>(fn: () => T): T;
    distinct(compareFn?: (a: T, b: T) => boolean): Signal<T>;
    set(value: T): this;
}
export declare const derive: <T, R>(signal: Signal<T>, cb: (value: T) => R) => Signal<any> | Signal<R>;
export declare const on: <T>(signal: Signal<T> | Signal<T>[], cb: Callback<T>) => () => void;
export declare const bind: <T>(signal: Signal<T> | Signal<any>[], cb: Callback<T>) => void;
export declare const signal: <V>(initialValue: V) => Signal<V>;
export {};
