import { describe, expect, it, vi } from 'vitest'
import { computed, signal, effect } from '../src/core'
import { mutate, stack, update } from '../src/extras'

const isSignal = $ => {
  const thing = $
  const fn = vi.fn(() => {
    thing()
  })

  effect(fn)
  expect(fn).toHaveBeenCalledTimes(1)
  expect(fn).toHaveBeenCalledTimes(2)
}

describe('update', () => {
  it('update value using a function', async () => {
    const $items = signal('hello')
    const $length = computed(() => $items().length)

    update($items, n => n + ' world')
    expect($items()).toEqual('hello world')
    expect($length()).toBe(11)
    update($items, n => 'foo')

    expect($items()).toEqual('foo')
    expect($length()).toBe(3)
  })
})

describe('mutate', () => {
  it('mutate the internal value', async () => {
    const $items = signal([] as number[])
    const $length = computed(() => $items().length)
    mutate($items, n => n.push(1))
    expect($items()).toEqual([1])
    expect($length()).toBe(1)
    mutate($items, n => n.push(5))
    expect($items()).toEqual([1, 5])
    expect($length()).toBe(2)
  })

  it('emits', () => {})
})

describe('Stack', () => {
  it('behaves like a signal', () => {
    const thing = stack('abc')
    const fn = vi.fn(() => {
      thing()
    })

    effect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
    thing('123')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('is a signal with a .prev field', () => {
    const thing = stack('abc')
    const fn = vi.fn(()=> thing())

    effect(fn)

    expect(fn).toHaveBeenCalledTimes(1)
    thing('def')
    thing('ghi')
    expect(fn).toHaveBeenCalledTimes(3)

    expect(thing()).toEqual('ghi')
    expect(thing.prev()).toEqual('def')
    expect(thing()).toEqual('ghi')
    expect(thing.size()).toEqual(3)
    expect(thing.pop()).toEqual('ghi')
    expect(fn).toHaveBeenCalledTimes(4)
    expect(thing.prev()).toEqual('abc')
    expect(fn).toHaveBeenCalledTimes(4)
    expect(thing()).toEqual('def')
    expect(fn).toHaveBeenCalledTimes(4)
  })
})
