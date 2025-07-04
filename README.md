# Kloen

> Klön, der | kløːn |
>   (North German) leisurely, informal conversation or chat.

## Usage / Quick Start

Kloen is a practical signals library

```js
import { signal, computed, effect } from "https://esm.sh/kloen"

const counter = signal(0) 
const double = computed(v => counter() * 2)
effect(() => console.log("Counter:", counter()))

// Update counter an trigger effects
counter(4) 
```

It uses [alien-signals]'s reactivity system under the hood and its surface API is *mostly* the same.
Some differences exist in order to be able to provide some utility functions that are not possible with alien-signals' default API.

```js
import { signal, computed, effect, update } from "https://esm.sh/kloen"

// update signals using pure transform functions using the `update` utility
const add10 = v => v + 10
update(counter, add10)

counter() // 14
double() // 28

// kloen's effect returns an unsubscribe for cleanups
const unsub = effect(() => console.log(`counter value:`, counter()))

const someSet = signal(new Set())
const size = computed(() => someSet.size)

size() // 0

// Use `mutate` to make changes to the contained value. Useful if you need to store an expensive object
mutate(someSet, s => s.add('item'))

size() // 1
```

## Named Signals

Signals can be named and receive a default value if not yet existing, making it easy to share signals between places where passing it down is not easily possible.

```js
const a = signal.for('counter-a', 0)
a === signal.for('counter-a') // true
```

### Initializer 

Named signals can take a function that is only run when the reference did not yet exist.

```js
const repo = signal.for('db', () => new PGlite({ /* ... */ }))
```

## Why?

This is mostly to study signals and understand their various implementations better as well as an exercise in API design.

[read more](./dev-docs/why.md)

[alien-signals]: https://github.com/stackblitz/alien-signals
