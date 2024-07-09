# Kloen

> Klön, der | kløːn |
>   (North German) leisurely, informal conversation or chat.

A tiny package for event messaging and state with signals in under 250 bytes[^1].


🚧 Work in progress 🚧

Docs are unfinished, and kloen has not yet reached 1.0 - meaning its API is open 
to change.

## Examples

### Basic Usage

`value()` will return a tuple consisting of:

- `observe(callback)`: will call the `callback`, when set was called. Returns an `unsubscribe` function.
- `set(value)`: set the value, and call all listeners (no change detection). Returns the value.
- `derive(callback)`: returns an observable that contains the result of the callback
- `ref`: an object `{value: <the value> }` that is stable for referential equality checks.

```ts
import {value} from "kloen"

const [onTasks, setTasks] = value()

fetch('https://jsonplaceholder.typicode.com/todos/')
    .then(r => r.json())
    .then(setTasks)

onTasks(console.log)
```

### Use it as a reducer

```ts
import { value } from "kloen"

const [onUpdate, dispatch] = value({tasks: []}, (action, state) => {
    switch (action.type) {
        case 'addTask': 
            return { users: [...state.users, action.data] }
        default: 
            return state
    }
})

// In some component.
// note: the subscribe function returns a method to unsubscribe the handler.
const unsub = onUpdate(state => console.log("current tasks:", state.tasks))

// somewhere, usually a button's click-handler:
dispatch({ type: 'addTask', data: { title: 'Touch grass', completed: false }})
```

### handlers will be called immediately, if a default value is set

To make setups easier, whenever you pass a default value to `value()`, every
handler is called once *immediately*.

```ts
import { value } from "kloen"

const [onTasks, setTasks] = value([])

class TaskList extends HTMLElement {
    constructor() {
        const fetchTasks = _ => fetch('https://jsonplaceholder.typicode.com/todos/')
            .then(r => r.json())
            .then(setTasks)

        onTasks(this.render)
    }
    render(tasks) {
        this.innerHTML = `
            <ul>
                ${tasks.map(task => `<li>${task.title}</li>`)}
            </ul>
        `
    }
}
```

### Event Hub

Subscribe to scopes, and emit messages to all listeners. This is what `value()` 
uses under the hood, with the handler and emitter bound to a unique scope.

```ts
import { on, emit } from  "kloen"

// subscribe to a message
const unsub = on('scope', data => console.log(data))

// emit a message
emit('scope', "some message") 

// remove the listener from the hub
unsub() 
```

### Ping! The payload is optional.

```ts
import { on, emit } from "kloen"

const ping = Symbol()

on(ping, _ => console.log("got pinged"))

emit(ping)
```

### Scopes can be (almost) anything!

Anything that is a valid key for a `Map` can be used as a scope. So not just 
strings, but also functions, objects, classes, numbers and so on.

This makes some unusual, but interesting patterns possible. eg.: subscribe to
whenever an async function is resolved:

```ts
import { on, emit } from  "kloen"

const fetchTasks = _ => fetch('https://jsonplaceholder.typicode.com/todos/')
    .then(r => r.json())
    .then(tasks => emit(fetchTasks, tasks))
    .then(console.log) // emit returns the data it was passed for chaining

on(fetchTasks, tasks => console.log("updated tasks", tasks))
```

### Create a new message-hub + TypeScript

You can use `create` to create a new message-hub instead of the global one. It 
returns a tuple with the subscriber, emitter and a method to remove all subscribers.
the exported `on`, `emit` and `clear` were created the exact same way.

Use it also to define the types.

```ts
import { create } from  "kloen"

const ping = Symbol();

const [on, emit, clear] = create<{
    setName: string,
    [ping]: undefined,
    onlyFoo: 'foo'
}>(); 

// ok:
on('setName', name => {
    //        ^? string
})

// ok:
on('onlyFoo', foo => {
    //        ^? 'foo'
})

// TypeScript Error:
on('unknownScope', () => /* ... */);


emit(ping) // => ok!
emit('setName', 'Ada') // => ok!
emit('onlyFoo', 'bar') // => TypeScript error!

```

### More Complex Example

View a [more realistic usage example on codepen](https://codepen.io/nocksock/pen/oNrNYLK)

## API

- TBD

## Caveats

- ESM only
- API might change slightly until 1.0
- At the momen there is no check, whether a value changed. Listeners will be called at every `set` call.
- Types are not yet fully done

## Roadmap to v1

- [ ] fully typed
- [ ] derive helper fn
- [ ] create benchmarks
- [ ] create basic extensions

---

[^1]: 249 bytes with `gzip -9`, 360 bytes raw. Size likely to change until 1.0. 

