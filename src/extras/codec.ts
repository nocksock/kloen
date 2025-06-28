import { signal } from '../core'
import { identity } from './identity'

export const codec = <Internal, Public>(
  onWrite: null | ((newValue: Public, oldValue?: Internal) => Internal),
  onRead?: null | ((currentValue: Internal) => Public),
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
