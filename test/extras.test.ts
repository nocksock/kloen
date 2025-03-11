import { describe, expect, it, vi } from 'vitest'
import { Computed, computed, signal } from '../src/core'
import { mutate, update } from '../src/extras'

describe('update', () => {
  it('update value using a function', async () => {
    const $items = signal('hello')
    const $length = new Computed(() => $items().length)

    update($items, n => n + ' world')
    expect($items()).toEqual('hello world')
    expect($length.get()).toBe(11)
    update($items, n => 'foo')

    expect($items()).toEqual('foo')
    expect($length.get()).toBe(3)
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
})
