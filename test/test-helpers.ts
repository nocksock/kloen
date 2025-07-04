import { expect, vi } from 'vitest'
import { effect, type ReadableSignal } from '../src/core'

export const spyEffect = (signal: ReadableSignal<any>) => {
  const fn = vi.fn(signal)
  effect(fn)
  return fn
}

export const verifySignalBehaviour = (factory: any) => {
  return () => {
    const $ = factory('initial')
    const sideEffect = spyEffect($)
    const initial = $()
    $('foobar')
    expect($()).not.toEqual(initial)
    expect(sideEffect).toHaveBeenCalledTimes(2)
  }
}

const toDom = (value: string) => {
  const template = document.createElement('div')
  template.innerHTML = value
  return template.firstElementChild as HTMLElement
}

export const html = (strings: TemplateStringsArray, ...values: any[]) => {
  const raw = strings.reduce((result, str, i) => {
    return result + str + (values[i] !== undefined ? values[i] : '')
  }, '')
  return toDom(raw)
}

export const withDOM = <R>(
  rawHtml: string | HTMLElement,
  cb: (root: HTMLElement) => R
) => (typeof rawHtml === 'string' ? cb(toDom(rawHtml)) : cb(rawHtml))

export const nextFrame = () =>
  new Promise(resolve => requestAnimationFrame(resolve))
