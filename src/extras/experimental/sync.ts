import { signal, WriteableSignal } from '../../core'
import { identity } from '../identity'

export const sync = <T, K = any extends infer Key ? Key : never>(
  initialise: (key: K, self: WriteableSignal<T | undefined>) => T | undefined,
  write: (key: K, newValue: T, oldValue?: T) => T
) => {
  const writeFn = write || identity
  return (key: K) => {
    const self = signal<any>()
    initialise(key, self)

    const api = <V extends T>(input?: V) =>
      input === undefined ? self() : self(writeFn(key, input, self()))

    return api
  }
}
