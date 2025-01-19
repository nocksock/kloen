# Kloen

> Klön, der | kløːn |
>   (North German) leisurely, informal conversation or chat.

Library/Framework agnostic signals

> [!INFO]
> Work in progress

## Usage / Quick Start

```js
import { signal, update, derive } from "https://esm.sh/kloen"

const $counter = signal(0)
const $double = derive($counter, v => v * 2)
const add10 = update($counter, v => v + 10)

watch($counter, v => {
    console.log(`counter value:`, v)
})

$counter.set(4)
add10()

```

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
customElements.define('counter-value', class HTMLElement {
    #unsubscribe;
    constructor() {
        super();
    }

    connectedCallback()    { this.#subscribe() }
    disconnectedCallback() { this.#unsubscribe?.() }

    #subscribe() {
        this.#unsubscribe = effect($counter, this.render.bind(this))
    }

    render() {
        this.innerHTML = `
            ${$counter()}
        `
    }
})
```

## Observing multiple signals

`derive`, `effect` and `watch` can take an array of signals as first parameter.
When one of their values changes, the callback is called with the values in the
same order as they appear in the array.

This way you can write pure functions as callbacks.
While it's totally fine to get the value via closure

```js

effect([$signalA, $signalB], (valueA, valueB) => {
    // Note
})

```

## Should you use this?

While the API is somewhat stable at this point, I want to build a few more complex projects using this before giving it the 1.0 stamp.
`kloen` isn't slow by any means, but performance isn't its primary concern.
So if performance is *your* primary concern, you should probably rather look at [#alternatives].

## Alternatives

- React: Jotai, Recoil
- Preact-Signals
- Mobx

Or the builtin signals/observables in solid/vue/svelte/angular.

