import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSignalRefs, Computed, computed, effect, signal } from '../src/core'
import { spyEffect } from './test-helpers'

describe('Signal', () => {
  it('is a function that returns or sets its value', () => {
    const thing = signal('abc')
    expect(thing()).toEqual('abc')
    thing('123')
    expect(thing()).toEqual('123')
  })

  it('returns the value when set', () => {
    const thing = signal('abc')
    expect(thing('123')).toEqual('123')
  })

  it('can be forced to emit using internal API', async () => {
    const thing = signal('abc')
    const sideEffect = spyEffect(thing)

    expect(sideEffect).toHaveBeenCalledTimes(1)
    thing.$.emit()
    expect(sideEffect).toHaveBeenCalledTimes(2)
  })
})

describe('Signal References', () => {
  beforeEach(() => {
    clearSignalRefs()
  })

  describe('for', () => {
    it('creates a signal with a unique identifier and returns the same on subsequent calls', () => {
      const thing = signal.for('some-id', 10)
      const other = signal.for('some-id')
      expect(thing).toBe(other)
    })

    it('initializes the signal with a default value', () => {
      const thing = signal.for('some-id', 10)
      expect(thing()).toBe(10)
    })

    it('takes a setup function to initialize the signal unless it existed', () => {
      const thing = signal.for('some-id', () => 10)
      expect(thing()).toBe(10)
      const other = signal.for('some-id', () => 20)
      expect(other()).toBe(10)
    })
  })

  describe('exists', () => {
    it('returns true when a signal for a given identifier exists', () => {
      expect(signal.exists('some-id')).toBe(false)
      signal.for('some-id', 10)
      expect(signal.exists('some-id')).toBe(true)
    })
  })

  describe('clear', () => {
    it('clears a specific signal', () => {
      signal.for('some-id', 10)
      signal.for('some-other-id', 10)
      signal.clear('some-id')
      expect(signal.exists('some-id')).toBe(false)
      expect(signal.exists('some-other-id')).toBe(true)
    })
  })

  describe('clearSignalRefs', () => {
    it('clears all signal references', () => {
      signal.for('some-id', 10)
      signal.for('other-id', 20)
      clearSignalRefs()
      expect(signal.exists('some-id')).toBe(false)
      expect(signal.exists('other-id')).toBe(false)
    })
  })

  describe('SignalRef', () => {
    it('can be a symbol', () => {
      const key = Symbol('some-id')
      const thing = signal.for(key, 10)
      expect(thing()).toBe(10)
    })

    it('can be a function', () => {
      const key = () => 'some-id'
      const thing = signal.for(key, 10)
      expect(thing()).toBe(10)
    })

    it('can be an object', () => {
      const key = {}
      const thing = signal.for(key, 10)
      expect(thing()).toBe(10)
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
    thing('888')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
