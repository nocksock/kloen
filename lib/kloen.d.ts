type Handler<T = unknown> = (value: T) => void
type Unsubscribe = () => void
type Subscribe = <Scope, Value>(
  scope: Scope,
  listener: Handler<Value>
) => Unsubscribe

type ValidScope = string | number | symbol | Function | object

/**
 * Create a new, typed message bus.
 *
 * Usage:
 *
 * ```typescript
 * const [on, emit] = create<{
 *   someScope: 'foo' | 'bar'
 *   anotherScope: string
 * }>()
 *
 * on('someScope', message => console.log(message))
 * //                ^? 'foo' | 'bar'
 * ```
 */
export const create: <T>(
  store?: T extends Map<infer KM, any>
    ? Map<KM, KM[keyof KM]>
    : T extends WeakMap<infer KM, any>
    ? WeakMap<KM, KM[keyof KM]>
    : T extends undefined
    ? T
    : never
) => [
  /**
   * Subcribe to a scope
   */
  on: <Scope extends keyof T>(
    scope: Scope,
    handler: (message: T[Scope]) => void
  ) => Unsubscribe,
  /**
   * Emit a message to a scope
   */
  emit: <Scope extends keyof T>(scope: Scope, value?: T[Scope]) => void,
  clear: () => void,
]

/**
 * Subscribe to a global scope
 */
export const on: (scope: ValidScope, listener: Handler) => Unsubscribe

/**
 * Send a message to a global scope
 */
export const emit: (scope: ValidScope, value?: unknown) => void

/**
 * Remove all global listeners
 */
export const clear: () => void

/**
 * Create a subscribable value.
 *
 * Shorthand for:
 *
 *    const scope     = Symbol()
 *        , onTasks   = cb => on(scope, cb)
 *        , setTasks  = value => emit(scope, value)
 *
 *    since it's creating a unique symbol, this uses the global hub.
 */
export const value: <Value>(
  initialValue?: Value
) => [(handler: Handler<Value>) => Unsubscribe, (value: Value) => void]
