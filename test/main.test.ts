import { describe, expect, it, vi } from 'vitest'
import { fromPromise, distinct, reduce, ap, flatMap, when } from '../src/extras'
import { read, update, mutate, call, map, derive, watch, signal, effect, batch, write } from '../src/kloen'

// TODO: clean up the tests
//    - make description and it/test blocks somewhat consistent
//    - remove obselete tests
//    - use naming convention in all tests (prefix signals with $)

describe('Signal', () => {
  vi.useFakeTimers()

  it('is a function that returns or sets its value', () => {
    const thing = signal('abc')
    expect(thing()).toEqual('abc')
    write(thing, '123')
    expect(thing()).toEqual('123')
  })

  it('can be observed via watch', async () => {
    const thing = signal('abc')
    const cb = vi.fn()
    const unsub = watch(thing, cb)

    thing.set('foo')
    thing.set('abc')
    thing.set('333')
    thing.set('123')

    // calls only the last one
    expect(cb).not.toHaveBeenCalled()
    await vi.runAllTimersAsync()

    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith('123')
    unsub()

    thing.set('foo')
    await vi.runAllTimersAsync()
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith('123')
  })

  it('can be chained', async () => {
    const thing = signal('abc')
    const cb = vi.fn()
    const unsub = watch(thing, cb)

    thing
      .set('foo')
      .set('bar')

    // writes are eager
    expect(thing()).toEqual('bar')

    await vi.runAllTimersAsync()
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('can take a transformer', async () => {
    // can be used for validation and whatnot
    const $thing = signal(5, (newValue, oldValue) => {
      if (newValue < 10) return newValue
      return oldValue
    })

    $thing.set(6)
    await vi.runAllTimersAsync()

    $thing.set(12)
    await vi.runAllTimersAsync()

    expect($thing()).toEqual(6)
  })

  it('can be accessed via identifier', async () => {
    const thing = signal.for('some-id', 10);
    const other = signal.for('some-id')
    expect(thing).toBe(other)
  })

  it('can be derived', async () => {
    const a = signal(3)
    const b = derive(a, a => a * a)
    const cb = vi.fn()
    watch(b, cb)
    expect(b()).toEqual(9)
    a.set(4)
    await vi.runAllTimersAsync()
    expect(b()).toEqual(16)
  })
})

describe('derive', () => {
  it('works with multiple signals', async () => {
    const $a = signal(3)
    const $b = signal(4)
    const result = derive([$a, $b], (a, b) => a * b)
    expect(result()).toEqual(12)
    $a.set(5)
    await vi.runAllTimersAsync()
    expect(result()).toEqual(20)
  })

  it.todo('merges updates', async () => {
    const $a = signal(3)
    const $b = signal(4)
    const cb = vi.fn((a, b) => a * b)
    // @ts-expect-error
    const result = derive([$a, $b], cb)
    $a.set(5)
    $b.set(6)
    await vi.runAllTimersAsync()
    expect(result()).toEqual(30)
    expect(cb).toHaveBeenCalledTimes(2)
  })
})

describe('watch', () => {
  it.todo('batches multiple signal updates into one emission', async () => {
    const $counterA = signal(0)
    const $counterB = signal(0)
    const cbA = vi.fn()

    watch([$counterA, $counterB], cbA)

    $counterA.set(1)
    $counterB.set(1)
    await vi.runAllTimersAsync()

    expect(cbA).toHaveBeenCalledTimes(1)
  })

  it('can watch multiple signals or topics and is called when either emits', async () => {
    const a = signal('a')
    const b = signal('b')

    const cb = vi.fn()
    watch([a, b], cb)
    a.set('c')
    await vi.runAllTimersAsync()
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith('c', 'b')
  })
})

describe('effect', () => {
  it('works like `watch` but calls it initially', async () => {
    const name = signal('john')
    const el = document.createElement('div')

    effect(name, value => (el.innerHTML = `hello ${value}`))
    expect(el.innerHTML).toEqual('hello john')
    name.set('peter')
    await vi.runAllTimersAsync()
    expect(el.innerHTML).toEqual('hello peter')
  })

  it('it also can take multiple', async () => {
    const name = signal('john')
    const things = signal(0)
    const el = document.createElement('div')

    // @ts-ignore
    effect([name, things], (name, things) => (el.innerHTML = `${name} ${things}`))

    expect(el.innerHTML).toEqual('john 0')
    name.set('peter')
    await vi.runAllTimersAsync()
    expect(el.innerHTML).toEqual('peter 0')
    things.set(3)
    await vi.runAllTimersAsync()
    expect(el.innerHTML).toEqual('peter 3')
  })

  // TODO: maybe displaying `Signal(john)` would be better to make it more
  // transparent that it's not a value.
  it('values can be taken from scope', async () => {
    const $name = signal('john')
    const $things = signal(0)
    const el = document.createElement('div')

    effect([$name, $things], () => (el.innerHTML = `${$name} ${$things()}`))

    expect(el.innerHTML).toEqual('Signal(john) 0')
    $name.set('peter')
    await vi.runAllTimersAsync()
    expect(el.innerHTML).toEqual('Signal(peter) 0')
    $things.set(3)
    await vi.runAllTimersAsync()
    expect(el.innerHTML).toEqual('Signal(peter) 3')
  })
})

// -- signal:update(fn, ...args) -> self    -- for mutation with chaining
// -- signal:set(value) -> self             -- direct value set
// -- signal:map(fn) -> Signal              -- derives new signal
// -- signal:call(fn, ...args) -> result    -- calls fn with signal value + args
// -- signal:ap(signalOfFn) -> Signal       -- applies signal of function
// -- signal:bind(fn) -> Signal             -- flatMap: fn must return a Signal

describe('Signal#update', () => {
  it('sets value using update function', async () => {
    const $count = signal(1)
    update($count, n => n + 1)
    await vi.runAllTimersAsync()
    expect($count()).toBe(2)

    // additional params to update will be passed to the update fn.
    // useful to define update functions in a place without access to the
    // closure when its needed.
    update($count, (n, m) => n + m, 5)
    await vi.runAllTimersAsync()
    expect($count()).toBe(7)
  })
})

describe('mutate', () => {
  it('mutate the internal value', async () => {
    const $items = signal([] as number[])
    mutate($items, n => n.push(1))
    await vi.runAllTimersAsync()
    expect($items()).toEqual([1])
    mutate($items, (n, m) => n.push(m), 5)
    await vi.runAllTimersAsync()
    expect($items()).toEqual([1, 5])
  })
  it('mutate the internal value', async () => {
    const $items = signal([] as number[])
    mutate($items, n => n.push(1))
    await vi.runAllTimersAsync()
    expect($items()).toEqual([1])
    mutate($items, (n, m) => n.push(m), 5)
    await vi.runAllTimersAsync()
    expect($items()).toEqual([1, 5])
  })
})

describe('Signal#flatMap', () => {
  it('is an applicative', async () => {
    const $a = signal(5)
    const result = flatMap($a, x => signal(x * 2))
    expect(result()).toBe(10)

    $a.set(10)
    await vi.runAllTimersAsync()
    expect(result()).toBe(20)
  })
})

describe('Signal#ap', () => {
  it('is an applicative', async () => {
    const $val = signal(5)
    const fn = signal((x: number) => x * 2)
    const result = ap($val, fn)
    expect(result()).toBe(10)

    fn.set((x: number) => x * 3)
    await vi.runAllTimersAsync()
    expect(result()).toBe(15)
  })
})

describe('Signal methods', () => {
  it('supports map for deriving new signals', async () => {
    const $a = signal(5)
    const $b = map($a, x => x * 2)
    expect($b()).toBe(10)

    $a.set(10)
    await vi.runAllTimersAsync()
    expect($b()).toBe(20)
  })

  it('supports call for applying functions with args', () => {
    const $a = signal(5)
    const result = call($a, (x, y) => x + y, 3)
    expect(result).toBe(8)
  })
})

describe('Signal additional features', () => {
  vi.useFakeTimers()

  describe('when', () => {
    it('only updates when predicate is true', async () => {
      const numbers = signal(0)
      const evenNumbers = when(numbers, n => n % 2 === 0)

      numbers.set(1)
      await vi.runAllTimersAsync()
      expect(evenNumbers()).toBe(0)

      numbers.set(2)
      await vi.runAllTimersAsync()
      expect(evenNumbers()).toBe(2)
    })
  })

  describe('reduce', () => {
    it('accumulates values over time', async () => {
      const events = signal(0)
      const sum = reduce(events, (acc, curr) => acc + curr, 0)

      // TODO: maybe reduce should consume eagerly
      events.set(1)
      await vi.runAllTimersAsync()
      events.set(2)
      await vi.runAllTimersAsync()
      events.set(3)
      await vi.runAllTimersAsync()

      expect(sum()).toBe(6)
    })
  })

  describe('distinct', () => {
    it('only emits when value actually changes', async () => {
      const value = signal(1)
      const $distinct = distinct(value)
      const cb = vi.fn()

      watch($distinct, cb)

      // TODO: unsure if I actually want this behaviour 
      //    this should rather be achieved by lazy evaluation
      //    and batching for watchers
      value.set(1)
      value.set(1)
      value.set(2)
      value.set(2)
      await vi.runAllTimersAsync()

      expect(cb).toHaveBeenCalledTimes(1)
      expect(cb).toHaveBeenCalledWith(2)
    })
  })
})

describe('read', () => {
  it('reads the value of a signal or array of signals', () => {
    const $a = signal('foo')
    const $b = signal('bar')
    expect(read($a)).toEqual('foo')
    expect(read([$a, $b])).toEqual(['foo', 'bar'])
  })
})

