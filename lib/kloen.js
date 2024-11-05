class Signal {
  #store = new Map()
  #listeners = new Set()
  on(scope, fn) {
    return sub(Array.isArray(scope) ? scope : [scope])
  }
}

const sub_single = (scopes, fn) => {
  return (
    !M.has(scope) && M.set(scope, new Set()),
    M.get(scope).add(fn),
    () => M.get(scope).delete(fn)
  )
}

export const create = store => {}

const { on } = new Signal()
