import { on, Signal } from './leuchten'

export function when(pairs: [Signal<any>, any][], cb: () => void) {
  const signals = pairs.map(([signal]) => signal)

  return on(signals, (...values) => {
    const allMatch = pairs.every(
      ([signal, expectedValue], index) => values[index] === expectedValue
    )
    if (allMatch) {
      cb()
    }
  })
}

/**
 * Combine multiple signals holding objects into one signal object.
 */
export const combine = <T extends Record<string, Signal<any>>>(
  signals: T
): Signal<{ [K in keyof T]: T[K] extends Signal<infer U> ? U : never }> => {
  const keys = Object.keys(signals) as (keyof T)[]
  const initial = {} as {
    [K in keyof T]: T[K] extends Signal<infer U> ? U : never
  }

  // Set initial values
  keys.forEach(key => {
    initial[key] = signals[key].get()
  })

  const combined = new Signal(initial)

  // Subscribe to all signals
  keys.forEach(key => {
    signals[key].onChange(value => {
      combined.update(current => ({
        ...current,
        [key]: value,
      }))
    })
  })

  return combined
}

export const throttle = <T>(signal: Signal<T>, ms: number): Signal<T> => {
  const throttled = new Signal<T>(signal.get())
  let lastRun = 0
  let timeout: ReturnType<typeof setTimeout> | null = null

  const run = (value: T) => {
    lastRun = Date.now()
    throttled.set(value)
  }

  signal.onChange(value => {
    const now = Date.now()
    const timeSinceLastRun = now - lastRun

    if (timeSinceLastRun >= ms) {
      run(value)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null
        run(value)
      }, ms - timeSinceLastRun)
    }
  })

  return throttled
}

export const debounce = <T>(signal: Signal<T>, ms: number): Signal<T> => {
  const debounced = new Signal<T>(signal.get())
  let timeoutId: ReturnType<typeof setTimeout>

  signal.onChange(value => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      debounced.set(value)
    }, ms)
  })

  return debounced
}
