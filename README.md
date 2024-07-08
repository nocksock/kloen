# Klönen [ˈkløːnən]

> klönen | ˈkløːnən |
>   intransitive verb
>   (North German) to engage in leisurely, informal conversation or chat.


A super tiny pubsub for js/ts in under 500 bytes. 

At its current stage it's even smaller, but as it's not yet 1.0, it's likely to increase a bit.

## Example

### Basic Usage

```ts
import { on, emit } from  "kloenen"

// subscribe to a message
const unsub = on('scope', data => console.log(data))

// emit a message
emit('scope', "some payload") 

// remove the listener from the hub
unsub() 
```


### Scopes needn't be strings.

```ts
import { on, emit } from  "kloenen"

const TaskUpdate = Symbol()

on(TaskUpdate, tasks => console.log("updated tasks", tasks))
on(TaskUpdate, tasks => console.log("updated tasks", tasks))

fetch('https://jsonplaceholder.typicode.com/todos/')
    .then(r => r.json())
    .then(tasks => emit(TaskUpdate, tasks))

```

### A shorter way to express the same as above

```ts
import {value} from "kloen"

/**
 * `value()` is a shorthand for
 *
 *    const scope     = Symbol()
 *        , onTasks   = cb => on(scope, cb)
 *        , setTasks  = value => emit(scope, value)
 * 
 * When given a default value, all handlers are immediately called. When omitted
 * they're only invoked when `setTasks` is called.
 */
const [onTasks, setTasks] = value([])

fetch('https://jsonplaceholder.typicode.com/todos/')
    .then(r => r.json())
    .then(setTasks)

onTasks(console.log)
```

### A more realistic example

View a [more realistic usage example on codepen](https://codepen.io/nocksock/pen/oNrNYLK)
