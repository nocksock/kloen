import { signal } from "../core"
import { identity } from "./identity"

export const sync = <K, T>(
  initialise: (key: K) => T,
  write: (key: K, newValue: T, oldValue?: T) => T
) => {
  const writeFn = write || identity
  return (key: K) => {
    const self = signal(initialise(key))
    const api = <V extends T>(input?: V) =>
      input === undefined ? self() : self(writeFn(key, input, self()))
    return api
  }
}
