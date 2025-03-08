# Kloen

> Klön, der | kløːn |
>   (North German) leisurely, informal conversation or chat.

## Usage / Quick Start

Kloen is using [alien-signals]'s `createReactiveSystem` under the hood. The
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

// Signals can be named and receive a default value if not yet existing,
// making it easy to share signals between places where passing it down is
// has too much friction
$a = signal.for('counter-a', 0)
$b = signal.for('counter-b', 0)

$a === signal.for('counter-a') // true
```

## Usage in Web-Components

```js
import { render, html } from "https://esm.sh/lit-html"
import { signal, update } from "https://esm.sh/kloen"

const $counter = signal(0)

setInterval(() => {
    update($counter, v => v + 1)
}, 500)

customElements.define('counter-value', class HTMLElement {
    #view = () => html`
        <p>The value is ${$counter()}</p>
    `;

    constructor() {
        super();
        effect(this.render.bind(this))
    }

    render() {
        render(this.#view, this)
    }
})
```

[alien-signals]: https://github.com/stackblitz/alien-signals
