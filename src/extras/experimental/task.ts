import { signal } from "../../core"

// async signal
export const task = (fn: () => Promise<any>) => {
  const self = signal<Promise<any>>(fn().then(value => value))
  const api = async () => {
    const value = await self()
    return value
  }

  api.run = async () => {
    const value = await fn()
    self(value)
    return value
  }

  api.cancel = () => {
    // Implement cancellation logic if needed
    console.warn("Cancellation not implemented for task signal.")
  }

  return api
}
