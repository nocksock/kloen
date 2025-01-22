import { describe, expect, it, vi, test } from 'vitest'
import { update, mutate, watch, signal, Signal } from '../src/kloen'
import { when, filter, pipe, } from '../src/extras'
import { select } from '../src/extras/select'
import { onReject, onResolve, fromPromise} from '../src/extras/async'

vi.useFakeTimers()

describe.todo('throttle', () => {
  it('limits updates to specified interval', async () => {
    const value = signal(0)
    const throttled = throttle(value, 100)
    const cb = vi.fn()

    on(throttled, cb)

    value.value = 1
    value.value = 2
    value.value = 3

    await vi.advanceTimersByTimeAsync(50)
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(1)

    await vi.advanceTimersByTimeAsync(100)
    expect(cb).toHaveBeenCalledTimes(2)
    expect(cb).toHaveBeenLastCalledWith(3)
  })
})

describe.skip('combine', () => {
  it('combines multiple signals into an object', async () => {
    const firstName = signal('John')
    const lastName = signal('Doe')
    const age = signal(30)

    const person = combine({
      firstName,
      lastName,
      age,
    })

    expect(person.value).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
    })

    firstName.value = 'Jane'
    await vi.runAllTimersAsync()

    expect(person.value).toEqual({
      firstName: 'Jane',
      lastName: 'Doe',
      age: 30,
    })
  })
})

describe.skip('debounce', () => {
  it('debounces rapid updates', async () => {
    const input = signal('')
    const debounced = debounce(input, 100)
    const cb = vi.fn()

    on(debounced, cb)

    input.value = 'h'
    input.value = 'he'
    input.value = 'hel'
    input.value = 'hell'
    input.value = 'hello'

    await vi.advanceTimersByTimeAsync(50)
    expect(cb).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(100)
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith('hello')
  })
})

describe.skip('filter', () => {
  it('filters an array within a signal', async () => {
    const input = signal([1, 2, 3, 4])
    const even = filter(input, i => i % 2 === 0)

    expect(even.get()).toEqual([2, 4])
    input.update(list => [...list, 5, 6])
    await vi.runAllTimersAsync()
    expect(even.get()).toEqual([2, 4, 6])
  })
})

describe('fromPromise', () => {
  test('wrapping a signal in a promise', async () => {
    const {promise, resolve} = Promise.withResolvers()
    const $promise = fromPromise(promise).fallback('fallback value')
    const cb = vi.fn()

    expect($promise()).toEqual('fallback value')
    expect($promise.$status()).toEqual('pending')

    watch($promise.$isPending, cb)

    resolve('resolved value')

    await vi.runAllTimersAsync()
    expect($promise()).toEqual('resolved value')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('reject', async ()=> {
    const {promise, reject} = Promise.withResolvers<string>()
    const $promise = fromPromise<string, 'reason'>(promise).fallback('default')
    expect($promise.$isRejected()).toEqual(false)
    const cb = vi.fn()

    onReject($promise, cb)
    expect(cb).toHaveBeenCalledTimes(0)

    reject('reason')
    await vi.runAllTimersAsync()
    expect($promise.$reason()).toEqual('reason')
    expect($promise.$isRejected()).toEqual(true)
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith('reason')
  })
})

describe.skip('fromQuery', () => {
  it('takes a function that returns a promise', async () => {
    const {promise, resolve} = Promise.withResolvers()
    const $promise = fromQuery(() => promise)

    resolve('resolved value')
    await vi.runAllTimersAsync()

    expect($promise()).toEqual('resolved value')
  })
})

describe('pipe', () => {
  it('takes a function that returns a promise', async () => {
    const $value = signal(678)
    const half = v => v / 2
    const mirror = v => String(v) + ":" + String(v).split('').toReversed().join('')
    const $piped = pipe($value, half, mirror)

    expect($piped()).toEqual('339:933')

    $value.set(456)
    await vi.runAllTimersAsync()

    expect($piped()).toEqual('228:822')
  })
})



describe('select', () => {
  it('creates a derivative from an object property', async () => {
    const $value = signal({
      name: 'something',
    })
    const $name = select($value, 'name')

    expect($name()).toEqual('something')

    mutate($value, v => v.name = 'something else')

    await vi.runAllTimersAsync()
    expect($name()).toEqual('something else')
  })

  it.todo('can handle nested props', async () => {
    const $value = signal({
      name: 'something',
      book: {
        title: 'foobar'
      }
    })
    const $name = select($value, 'name')
    const $title = select($value, 'book.title')

    expect($name()).toEqual('something')
    // TODO:
    expect($title()).toEqual('foobar')

    mutate($value, v => v.name = 'something else')
    mutate($value, v => v.book.title = 'new title')

    await vi.runAllTimersAsync()
    expect($name()).toEqual('something else')
    expect($title()).toEqual('new title')
  })
})
