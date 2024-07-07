# kloenen

A super tiny pubsub for js/ts in under 500 bytes. 

At its current stage just 239 bytes, but likely to increase a bit.

## Example

### Basic Usage

```ts
import { create } from  "kloenen"

// create a message bus
const { fire, sub } = create()

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
const { fire, sub } = create()

class TaskList extends HTMLElement {
    static UpdateMessage = Symbol()
    static fireUpdate = tasks => fire(Tasks.UpdateMessage, tasks)

    constructor() {
        super()
        sub(Tasks.UpdateMessage)
    }

    render() {
        this.innerHTML = `
            <ul>
            ${this.#received
                .map(msg => `<li>${JSON.stringify(msg)}</li>`)
                .join('')}
            </ul>
        `
    }
}

sub(Tasks.Update, tasks => console.log("updated tasks", tasks))

fetch('https://jsonplaceholder.typicode.com/todos/')
    .then(r => r.json())
    .then(TaskList.fireUpdate)

```

### Or wrap it around resources

```tsx
import { create } from  "kloenen"
const toJson = r => r.json()

class Tasks {
    #tasks = [];
    #endpoint;

    constructor(endpoint) {
        this.fetch();
        setInterval(this.fetch.bind(this), 5000)
    }

    fetch() {
        fetch(this.#endpoint)
            .then(toJson)
            .then(this.set.bind(this))
    }

    set(json) {
        this.#tasks = json;
        fire(this, this.#tasks)
    }
}

const taskList = new Tasks('https://jsonplaceholder.typicode.com/todos/');

// consume it in components etc.
sub(taskList, console.log)
```
