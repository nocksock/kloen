export const create = () => {
  const M = new Map()
  const on = (scope: any, fn: any) => {
      if (Array.isArray(scope)) {
        const signals = scope
        const cb = () => {
          const values = signals.map(signal => signal.cur)
          fn(values)
        }
        const unsubs = signals.map(signal => on(signal, cb))
        cb()
        return () => unsubs.forEach(unsub => unsub())
      }
      return (
        !M.has(scope) && M.set(scope, new Set()),
        M.get(scope).add(fn),
        () => M.get(scope).delete(fn)
      )
    },
    emit = (scope: any, value: any) => (
      M.get(scope)?.forEach(f => f(value)), value
    ),
    value = (defaultValue?: any, transformer?: Transformer) =>
      ((
        V$ = f => (defaultValue !== void 0 && f(defaultValue), on(V$, f)),
        derive = (deriveFn, B$ = V$) => {
          const D$ = f => (f(D$.cur), on(D$, f))
          D$.cur = deriveFn(B$.cur)
          on(B$, val => ((D$.cur = deriveFn(val)), emit(D$, D$.cur)))
          return [D$, f => derive(f, D$)]
        }
      ) => {
        V$.cur = defaultValue
        return [
          V$,
          transformer
            ? m => (
                (V$.cur = defaultValue = transformer(m, defaultValue)),
                emit(V$, m)
              )
            : m => ((V$.cur = m), emit(V$, m)),
          derive,
        ]
      })()
  return [on, emit, value, M.clear.bind(M)]
}
