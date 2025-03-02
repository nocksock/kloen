# Kloen

> Klön, der | kløːn |
>   (North German) leisurely, informal conversation or chat.

> [!WARNING]
> Work in progress! Breaking changes will happen unannounced and API is still 
> to be considered unstable.

## Usage / Quick Start

Kloen is using [alien-signals]'s `createReactiveSystem` under the hood. The
API is mostly the same as in the original, however kloen provides some utility
function, which otherwise couldn't be achieved.


```js
import { signal, update, computed, mutate } from "https://esm.sh/kloen"

const $counter = signal(0) // I like using $ prefix to denote that variable contains a signal
const $double = computed(v => $counter() * 2)

$counter.set(4)

update($counter, v => v + 10)

$counter() // 14
$double() // 28

effect(() => console.log(`counter value:`, $counter()))

const $someSet = signal(new Set())
const $size = computed(() => someSet.size)

$size() // 0
mutate($someSet, s => s.add('item'))
$size() // 1

// Signals can be named and receive a default value if not yet existing 
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
