import { expect, vi } from 'vitest'
import { effect, ReadableSignal } from '../src/core'

export const spyEffect =(signal: ReadableSignal<any>) => {
  const fn = vi.fn(signal)
  effect(fn)
  return fn
}


export const verifySignalBehaviour = (factory: any) => {
  return () => {
    const $ = factory('initial')
    const sideEffect = spyEffect($)
    const initial = $();
    $('foobar')
    expect($()).not.toEqual(initial)
    expect(sideEffect).toHaveBeenCalledTimes(2)
  }
}
