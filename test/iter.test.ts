import { describe, expect, it, vi } from 'vitest'
import { update, signal } from '../src/kloen'
import { filter, } from '../src/extras/iter'

describe.skip('filter', () => {
  vi.useFakeTimers()
  it('creates a derived value filtered by predicate', async () => {
    const $list = signal([1, 2, 3, 4])
    const $even = filter($list, i => i % 2 === 0)

    expect($even()).toEqual([2, 4])
    update($list, list => [...list, 5, 6])
    await vi.runAllTimersAsync()
    expect($even()).toEqual([2, 4, 6])
  })
})

