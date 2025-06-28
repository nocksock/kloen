import { signal } from '../core'

export const reducer = <Action, State>(
  reducer: (action: Action, state: State) => State
) => {
  return (initialValue: State) => {
    const state = signal(initialValue)
    const api = (action?: Action) =>
      action === undefined ? state() : state(reducer(action, state()))
    return api
  }
}
