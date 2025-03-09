# Kloen

> Klön, der | kløːn |
>   (North German) leisurely, informal conversation or chat.

## Usage / Quick Start

Kloen is using [alien-signals]'s reactivity system under the hood. The
surface API is *mostly* the same as in the original, with some differences
in order to be able to provide some utility functions and enable a few usage
patterns.


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


## Why?

This is mostly to study signals and understand their various implementations better as well as an exercise in API design.

However I personally use this when prototyping, in my solo-side-projects and all features are written using TDD and the core primitives are *somewhat* stable.
Initially I event implemented my own reactivity system, but I didn't prioritise efficiency/performance.
So when that had served its purpose, I replaced it with [alien-signals]'s reactivity system.
*Now* it's using [alien-signals]'; so it's *very* efficient and fast.

**However** I am maintaining this in bursts, rather than steadily - so I don't advice using this for anything other than experiments at the moment.
Also it will likely take a while if you happend to file an issue until I find time to get to it.

## Contributions

Given this is a study and exercise for me, I'll likely reject contributions involving meaningful changes/features.
So if you happen to use this, and encounter an issue or have a feature request, let me know; especially before putting in any work.

## ROADMAP

Incomplete list of things I intend to built at some point before giving it the `1.0` stamp

### core functions
- [x] provide core primitives: `signal`, `computed`, `effect`
- [x] create signals with references, similar to `Symbol.for`
- [ ] provide `context()` function that scope signal references
- [ ] create benchmark suite
- [ ] provide `scope()` for tracking effects
- [ ] reconsider signals with a setter function similar to jotai

### util functions
- [x] provide base util functions: `update`, `mutate`
- [x] provide `filter` util to create computed values from arrays using predicates
- [/] provide helper functions for promises
- [ ] provide `split` util to create signals from an array
- [ ] provide `proxy` util to proxy objects
- [ ] provide `lense` util to create a writable signal for a property path

### integrations

- [/] provide wrapper for pglite live queries
- ~~[ ] provide helper for use in web-components~~ -> `cce` (working title)
- [ ] provide hook for react
- [ ] provide directive for lit


[alien-signals]: https://github.com/stackblitz/alien-signals
