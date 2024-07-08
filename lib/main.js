export const create = (l = new Map()) => [
  (s, f) => (
    !l.has(s) && l.set(s, new Set()), l.get(s).add(f), _ => l.get(s).delete(f)
  ),
  (s, v) => (l.get(s)?.forEach(f => f(v)), v),
  l.clear.bind(l),
]
export const [on, emit, clear] = create()
export const value = d => {
  const y = Symbol()
  return [f => (d !== undefined && f(d), on(y, f)), v => ((d = v), emit(y, v))]
}
