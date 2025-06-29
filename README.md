# Kloen

> Klön, der | kløːn |
>   (North German) leisurely, informal conversation or chat.

## Usage / Quick Start

Kloen is a signals library.

It uses [alien-signals]'s reactivity system under the hood and its surface API is *mostly* the same.
Some differences exist in order to be able to provide some utility functions and make some usage patterns possible.

```js
import { signal, update, computed, mutate } from "https://esm.sh/kloen"

const $counter = signal(0) // I like using $ prefix to denote that variable contains a signal
const $double = computed(v => $counter() * 2)

$counter(4) // setter

// update signals using pure transform functions using the `update` utility
const add10 = v => v + 10

update($counter, add10)

$counter() // 14
$double() // 28

// kloen's effect returns an unsubscribe for cleanups
const unsub = effect(() => console.log(`counter value:`, $counter()))

const $someSet = signal(new Set())
const $size = computed(() => someSet.size)

$size() // 0
mutate($someSet, s => s.add('item'))
$size() // 1

```

## Named Signals

Signals can be named and receive a default value if not yet existing,
making it easy to share signals between places where passing it down is
has too much friction

```js
$a = signal.for('counter-a', 0)
$a === signal.for('counter-a') // true
```

### Initializer 

Named signals can take a function that is only run when the reference did not yet exist.

```js
const repo = signal.for('db', () => new PGlite({ /* ... */ }))
```

## Goals / Why?

This is mostly to study signals and understand their various implementations better as well as an exercise in API design.

[read more](./dev-docs/why.md)

## Contributions

Given this is a study and exercise for me, I'll likely reject contributions involving meaningful changes/features.
So if you happen to use this, and encounter an issue or have a feature request, let me know; especially before putting in any work.

## ROADMAP

Incomplete list of things I intend to built at some point before giving it the `1.0` stamp

### core functions
- [x] provide core primitives: `signal`, `computed`, `effect`
- [x] create signals with references, similar to `Symbol.for`
- [ ] create benchmark suite
- [ ] provide `context()` function that scope signal references
- [ ] provide `scope()` for tracking effects

### util functions
- [x] base write functions: `update`, `mutate`
- [x] `sync` to create 
- [x] `codec` for encoding/decoding values on read and/or write
- [x] `filter` to create computed values from arrays using predicates
- [x] `reducer` to create a signal with dispatcher
- [ ] `element` to query a single dom element and be able to use that element in a reactive way
- [ ] `atom` to create a signal with setter and getter that can read signals (maybe merge with codec)
- [ ] `task` for async values
- [ ] `split` to turn a list of values into a reactive list of signals

## data structures
- [ ] WIP `stack` LIFO: `.pop`, `.prev` (peek), `.size`
- [ ] `queue` FIFO
- [ ] `set`
- [ ] `record` (map)
- [ ] `list`

### integrations

- ~~[ ] provide wrapper for pglite live queries~~ -> [x] provide util function
- ~~[ ] provide helper for use in web-components~~ -> `cce` (working title)
- [ ] provide hook for react
- [ ] provide directive for lit

[alien-signals]: https://github.com/stackblitz/alien-signals
