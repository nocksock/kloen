export const create = (M = new Map()) =>
  ((
    subscribe,
    e,
    c,
    V = (defaultValue, transf) =>
      ((
        S = f => (defaultValue !== void 0 && f(defaultValue), subscribe(S, f)),
        deriveFn = (fn, B$ = S) => {
          const D$ = f => (f(D$.cur), subscribe(D$, f))
          D$.cur = fn(B$.cur)
          subscribe(B$, val => ((D$.cur = deriveFn(val)), emit(D$, D$.cur)))
          return [D$, f => deriveFn(f, D$)]
        }
      ) => (
        (S.cur = defaultValue),
        [
          S,
          transf
            ? m => ((S.cur = defaultValue = transf(m, defaultValue)), e(S, m))
            : pl => ((S.cur = pl), e(S, pl)),
          deriveFn,
        ]
      ))()
  ) => [subscribe, e, V, c])(
    (s, f) => (
      !M.has(s) && M.set(s, new Set()),
      M.get(s).add(f),
      () => M.get(s).delete(f)
    ),
    (s, v) => (M.get(s)?.forEach(f => f(v)), v),
    () => M.clear()
  )
export const [on, emit, value, clear] = create()
