import { describe, expect, it, vi } from 'vitest'
import { Computed, computed, effect, Signal, signal } from '../src/core'

describe('Signal', () => {
  it('is a function that returns or sets its value', () => {
    const thing = signal('abc')
    expect(thing()).toEqual('abc')
    thing('123')
    expect(thing()).toEqual('123')
  })

  it('can be accessed via identifier', async () => {
    const thing = signal.for('some-id', 10)
    const other = signal.for('some-id')
    expect(thing).toBe(other)
  })

  describe('for', () => {
    it('creates a signal with a unique identifier', () => {
      const thing = signal.for('some-id', 10)
      const other = signal.for('some-id')
      expect(thing).toBe(other)
    })
  })
})

describe('Computed', () => {
  it('updates when its dependencies change', async () => {
    const thing = signal('abc')
    const $computed = computed(() => thing() + 'def')
    expect($computed()).toEqual('abcdef')
    thing('123')
    expect($computed()).toEqual('123def')
  })
})

describe('Effect', () => {
  it('runs a function when its dependencies change', async () => {
    const thing = signal('abc')
    const fn = vi.fn(() => {
      thing()
    })

    effect(fn)

    expect(fn).toHaveBeenCalledTimes(1)
    thing('123')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('returns a function that cancels the effect', async () => {
    const thing = signal('abc')
    const fn = vi.fn(() => {
      thing()
    })

    const cancel = effect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
    cancel()
    thing('123')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
