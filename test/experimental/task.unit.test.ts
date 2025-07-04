import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ReadableSignal, signal } from '../../src/core.ts';

const TASK_INIT = Symbol()

const task = <V, Action, R extends ((set: ((newValue: V) => void), action: Action | typeof TASK_INIT, prev: V) => V)>(fn: R) => {
  const self = signal<V>();
  const setter = self.$.set.bind(self.$)
  const value = fn(setter, TASK_INIT, self() as V);
  self(value)

  const api = (action?: Action) => {
    if(!action) return self()
    const newValue = fn(setter, action, self() as V);
    return self(newValue)
  }

  return api
}

task.TASK_INIT = TASK_INIT

describe('task', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('is async signal task handler', () => {
    const {resolve: resolveReq, promise} = Promise.withResolvers()

    const value = task((set) => {
      setTimeout(() => set("resolved"), 100)
      return "initial"
    })

    expect(value()).toBe("initial")
    vi.advanceTimersByTime(200)
    expect(value()).toBe("resolved")
  })

  it('can be resolved multiple times', () => {
    const {resolve: resolveReq, promise} = Promise.withResolvers()

    const value = task((set) => {
      setTimeout(() => set("resolved"), 100);
      setTimeout(() => set("resolved again"), 300);
      return "initial"
    })

    expect(value()).toBe("initial")
    vi.advanceTimersByTime(200)
    expect(value()).toBe("resolved")
    vi.advanceTimersByTime(200)
    expect(value()).toBe("resolved again")
  })

  it('can receive values after it started', () => {
    const {resolve: resolveReq, promise} = Promise.withResolvers()

    const value = task((set, input, oldValue) => {
      setTimeout(() => set("resolved"), 100);
      setTimeout(() => set("resolved again"), 300);
      console.log("msg", input, oldValue)
      return "fetching"
    })

    expect(value()).toBe("fetching")
    vi.advanceTimersByTime(200)
    expect(value()).toBe("resolved")
    vi.advanceTimersByTime(200)

    value("refresh")

    expect(value()).toBe("fetching")
    vi.advanceTimersByTime(200)
    expect(value()).toBe("resolved")
  })
})

