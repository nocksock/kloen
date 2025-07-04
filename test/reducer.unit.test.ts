import { describe, expect, it } from 'vitest'
import { reducer } from '../src/extras'
import { spyEffect } from './test-helpers'

type CounterActions = 'increment' | 'decrement' | 'reset'
type CounterState = number

describe('reducer', () => {
  it('can be used to create a reducer', () => {
    const createCounter = reducer((action: 'increment' | 'decrement', value: number) => {
      if (action == 'increment') return value + 1
      if (action == 'decrement') return value - 1
      throw new Error(`Unknown action: ${action}`)
    })

    const counter = createCounter(0)
    const sideEffect = spyEffect(counter)

    expect(counter()).toEqual(0)
    counter('increment')
    expect(counter()).toEqual(1)
    counter('increment')
    expect(counter()).toEqual(2)
    counter('decrement')
    expect(counter()).toEqual(1)

    expect(sideEffect).toHaveBeenCalledTimes(4)
  })

})
