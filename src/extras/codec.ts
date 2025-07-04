import { signal } from '../core.js'
import { identity } from './identity.js'

/**
* @experimental work in progress
 */
export const codec = <Internal, Public>(
  onWrite: null | ((newValue: Public, oldValue?: Internal) => Internal),
  onRead?: null | ((currentValue: Internal) => Public)
) => {
  const readFn = onRead || identity
  const writeFn = onWrite || identity

  return (initialValue: Public) => {
    const self = signal(writeFn(initialValue, undefined))
    const api = (input?: Public) => {
      return input === undefined
        ? readFn(self() as Internal, initialValue)
        : self(writeFn(input, self(), initialValue))
    }
    return api
  }
}
