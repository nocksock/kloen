# Notes and Todos

## TODOs

### TODO: .bind (or other name) to create a memory efficient getter

```ts 
const $some = signal('hello')

const foo = $some.bind()
const bar = $some.bind()

foo === bar // => true

foo() // => hello
$some.set('there')
foo() // => there
```


### TODO: align project structure with mokeys 

- src folder
- manual export for react


## TODO: split types up into DerivedSignal and Signal
## TODO: convert to factory function pattern and create a kloen/mini export with only the fundamental features
```ts
const Value = Symbol('signal_value')
type Value = typeof Value

type SignalFn<V> = <R>(self: Signal<V>) => R

interface Signal<T> {
  (): T
  value: T
  set(value: T): void
  get(): void
  [Value]: T
}

function read(self: Signal<unknown>) {
  return self[Value]
}

function write<T>(self: Signal<T>, value: T) {
  self[Value] = value
}

const mixin = <T>(target: Signal<T>, ...fns: SignalFn<T>[]) => {
  for (const fn of fns) {
    Object.defineProperty(target, fn.name, fn.bind(null, target))
  }
}

function Signal<T>(value: T) {
  const signal = (() => signal[Value]) as Signal<T>

  signal[Value] = value

  Object.defineProperty(signal, 'value', {
    get: signal,
    set: write.bind(null, signal),
  })

  signal.get = read.bind(null, signal)
  signal.set = write.bind(null, signal)

  // mixin(signal, read, write)

  return signal
}

// Usage
const $mode = Signal('normal')

console.log('1', $mode())
console.log('2', $mode.value)
console.log('3', $mode.get())
console.log('4', read($mode))

$mode.set('insert')

console.log('1', $mode())
console.log('2', $mode.value)
console.log('3', $mode.get())
console.log('4', read($mode))

write($mode, 'insert')

console.log('1', $mode())
console.log('2', $mode.value)
console.log('3', $mode.get())
console.log('4', read($mode))
```

