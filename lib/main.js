export const create = o =>
  (l => [
    (t, cb) => (
      !l.has(t) && l.set(t, new Set()),
      l.get(t).add(cb),
      _ => l.get(t).delete(cb)
    ),
    (t, p) => l.get(t)?.forEach(cb => cb(p)),
  ])(o?.weak ? new WeakMap() : new Map())
