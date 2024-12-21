// @ts-nocheck
// import { signal } from "../src/kloen.ts"
//
// const Value = Symbol('signal_value')

const ITERATIONS = 100_000;

// benchmark   time/iter (avg)        iter/s      (min … max)           p75      p99 p995
// ----------- ----------------------------- --------------------- ------------------ --------
// getter              19.7 ms          50.7 ( 13.8 ms …  31.7 ms)  21.2 ms  31.7 ms 31.7 ms
// getter fn           18.8 ms          53.2 ( 13.9 ms …  28.8 ms)  21.6 ms  28.8 ms 28.8 ms
// calling             17.3 ms          57.9 ( 12.7 ms …  25.9 ms)  20.5 ms  25.9 ms 25.9 ms

// even when switching things around, calling is a little bit faster.

// Deno.bench({
//   name: "getter",
//   fn: () => {
//     const $value = signal("foobar")
//     const store = new Map()
//     for (let i = 0; i < ITERATIONS; i++) {
//       store.set(`f${i}`, JSON.stringify($value.value));
//     }
//   },
// });

// Deno.bench({
//   name: "getter fn",
//   fn: () => {
//     const $value = signal("foobar")
//     const store = new Map()
//     for (let i = 0; i < ITERATIONS; i++) {
//       store.set(`f${i}`, JSON.stringify($value.get()));
//     }
//   },
// });

// Deno.bench({
//   name: "calling",
//   fn: () => {
//     const $value = signal("foobar")
//     const store = new Map()
//     for (let i = 0; i < ITERATIONS; i++) {
//       store.set(`f${i}`, JSON.stringify($value()));
//     }
//   },
// });



const storage = new WeakMap<symbol, unknown>()

const symbolSignal = initialValue => {
  const sym: unique symbol = Symbol()
  storage.set(sym, initialValue)
  return sym
}

const readSignal = symbol => storage.get(symbol)

const writeSignal = (symbol, newValue) => {
  storage.set(symbol, newValue)
  return newValue
}

Deno.bench({
  name: "read sim",
  fn: () => {
    const $value = symbolSignal("foobar")
    const store = new Map()
    for (let i = 0; i < ITERATIONS; i++) {
      store.set(`f${i}`, JSON.stringify(readSignal($value)));
    }
  },
});

