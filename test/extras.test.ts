import { describe, expect, it, vi } from 'vitest'
import { signal, Signal } from '../src/kloen'
import { when, filter } from '../src/extras'

vi.useFakeTimers()

describe.skip('when([[signal, 10], [signal, 20]] cb)', () => {
  it('triggers when things match', async () => {
    const a = signal(0)
    const b = signal(0)
    const cb = vi.fn()

    when(
      [
        [a, 10],
        [b, 20],
      ],
      cb
    )
    await vi.runAllTimersAsync()
    expect(cb).not.toHaveBeenCalled()

    a.value = 10
    await vi.runAllTimersAsync()
    expect(cb).not.toHaveBeenCalled()

    b.value = 20
    await vi.runAllTimersAsync()
    expect(cb).toHaveBeenCalled()
  })
})

describe.skip('throttle', () => {
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
