# Kloen

> Klön, der | kløːn |
>   (North German) leisurely, informal conversation or chat.

Library/Framework agnostic signals

> [!WARNING]
> Work in progress! Breaking changes will happen unannounced and API is still 
> to be considered unstable.

## Usage / Quick Start

```js
import { signal, update, derive } from "https://esm.sh/kloen"

const $counter = signal(0) // use $ prefix to denote that variable contains a signal
const $double = derive($counter, v => v * 2)
const add10 = update($counter, v => v + 10)

// watches for a *change*, ie is not called initially
watch($counter, v => {
    console.log(`counter value:`, v)
})

$counter.set(4)
add10()

$counter() // 14
$double() // 28

// like `watch`, but is called initially
effect($counter, v => {
    console.log(`counter value:`, v)
})

// watch, effect and derive can observe multipe signals, makes it easy to 
// merge mutliple signals into a single one
const $person = derive([$firstName, $lastName], (firstName, lastName) => ({
    firstName,
    lastName
}))


```

## Features

- 0 dependencies
- small: 
    - core 0.83kb (gzip)
    - including all extras: ~1kb (gzip)
- highly functional and composable
- library/framework agnostic
- small api surface area
- lazy evaluation
- fully typed
- simple, strong and flexible primitives

## Why another one?

Because I wanted to implement it and have a specific API.
Sortof a lovechild between Jotai and Ramda.

## Goals and rules

- Keep upcoming TC39 in mind (Destructor, Immutables, Signals etc)
- Achieve "complete", ie: core will only need minor updates after 1.0, if any
    - core updates mostly to make
    - most updates should then only occur for the extras
- Keep implementation simple
    - favor implementation simplicity over performance
- Keep surface area as small as possible, favor strong and composable primitives
- Provide primitives to integrate easily for major frameworks/libraries

## Using it in react

It's fairly simple to hook it into eg. react. 

```js
export const useSignal = $value => {
  const [value, setValue] = useState($value())
  useEffect(() => watch($value, setValue), [])
  return [value, write.bind(null, $value)]
}
```

This hook is exported from `kloen/react`. 
So you can import it via `import { useSignal } from 'kloen/react'`

## Using it with Web-Components

```js
// Signals can be named and receive a default value if not yet existing 
signal.for('counter-a', 0)
signal.for('counter-b', 0)

// can be used like
// <signal-value for="counter-a"></signal-value>
customElements.define('signal-value', class HTMLElement {
    #unsubscribe;
    constructor() {
        super();
    }

    connectedCallback()    { this.#subscribe() }
    disconnectedCallback() { this.#unsubscribe?.() }

    #subscribe() {
        this.#unsubscribe = effect(signal.for(this.getAttribute('for'), 0), this.render.bind(this))
    }

    render() {
        this.innerHTML = `
            ${$counter()}
        `
    }
})
```

## Should you use this?

While the API is already *somewhat* stable at this point, I want to build a few more complex projects using this before giving it the 1.0 stamp.
`kloen` isn't slow by any means, but performance isn't its primary concern.
So if performance is *your* primary concern, you should probably rather look at [#alternatives].

## Alternatives

- React: Jotai, Recoil
- Preact-Signals
- Mobx

Or the builtin signals/observables in solid/vue/svelte/angular.

