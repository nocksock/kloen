# Klönen [ˈkløːnən]

> klönen | ˈkløːnən |
>   intransitive verb
>   (North German) to engage in leisurely, informal conversation or chat.


A super tiny pubsub for js/ts in under 500 bytes. 

At its current stage it's even smaller, but as it's not yet 1.0, it's likely to increase a bit.

## Example

### Basic Usage

```ts
import { create } from  "kloenen"

// create a message bus
const [sub, fire] = create()

// subscribe to a scope/channel/topic/whatever you call it
const unsub = sub('message-scope', payload => console.log("received", payload))

// fire a message
fire('message-scope', "some payload")

// remove the listener from the hub
unsub() 
```


### Topics needn't be strings.

```ts
import { create } from  "kloenen"

const [sub, fire] = create()

const TaskUpdate = Symbol()
const fireUpdate = tasks => fire(TaskUpdate, tasks)

sub(TaskUpdate, tasks => console.log("updated tasks", tasks))

fetch('https://jsonplaceholder.typicode.com/todos/')
    .then(r => r.json())
    .then(fireUpdate)

```

### Or wrap it around resources

```tsx
import { create } from  "kloenen"
const [sub, fire] = create()

class AutoUpdatingJson {
    #value
    #endpoint
    #interval
    static toJson = r => r.json()

    constructor(endpoint, default) {
        this.#value = value
        this.fetch();
    }

    async fetch() {
        this.set(await fetch(this.#endpoint).then(AutoUpdatingJson.toJson))
    }

    start() {
        this.#interval = setInterval(this.fetch.bind(this), 5000)
        return this;
    }

    stop() {
        clearInterval(this.#interval);
        return this;
    }

    set(json) {
        this.#value = json;
        fire(this, this.#tasks)
    }
}

const tasks = new AutoUpdatingJson('https://jsonplaceholder.typicode.com/todos/');

// consume it in components etc.
sub(tasks, console.log)
```
