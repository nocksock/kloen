import { batch, write, watch, signal, update, derive, Observable, Callback, MutableObservable, mutate, effect } from "./kloen"


export function pipe<T>(self: Observable<T>, ...fns: Array<(arg: T) => T>) {
  return derive(self, initial => fns.reduce((result, fn) => fn(result), initial))
}

export function filter<T>(self: Observable<T>, predicate: (value: T) => boolean): Observable<T> {
  const lastValue = signal(self())

  watch(self, newValue => {
    if (predicate(newValue)) {
      lastValue.set(newValue)
    }
  })
  return lastValue
}


export function when<T>(self: Observable<T>, predicate: (value: T) => boolean): Observable<T> {
  const lastValue = signal(self())
  watch(self, newValue => {
    if (predicate(newValue)) {
      lastValue.set(newValue)
    }
  })
  return lastValue
}


export function reduce<T, U>(
  self: Observable<T>,
  reducer: (accumulator: U, current: T) => U,
  initialValue: U
): Observable<U> {
  const reduced = signal(initialValue)

  watch(self, value => void update(reduced, acc => reducer(acc, value)))

  return reduced
}


// TODO: not sure if useful
export function distinct<T>(
  self: Observable<T>,
  compareFn: (a: T, b: T) => boolean = (a, b) => a === b
): Observable<T> {
  const distinct = signal(self())
  let lastValue = self()

  watch(self, value => {
    if (!compareFn(lastValue, value)) {
      lastValue = value
      distinct.set(value)
    }
  })

  return distinct
}

export function ap<T, U>(self: Observable<T>, signalOfFn: Observable<(value: T) => U>): Observable<U> {
  const result = signal(signalOfFn()(self()))

  watch(signalOfFn, fn => result.set(fn(self())))
  watch(self, value => result.set(signalOfFn()(value)))

  return result
}

export function flatMap<T, U>(self: Observable<T>, fn: (value: T) => Observable<U>): Observable<U> {
  const result = signal(fn(self())())
  watch(self, value => {
    const innerSignal = fn(value)
    result.set(innerSignal())
    watch(innerSignal, innerValue => result.set(innerValue))
  })
  return result
}

const get = <T>(key: keyof T) => (o: T) => o[key]

const isRejected = ({ status }: PromiseState) => status === 'rejected'
const isPending = ({ status }: PromiseState) => status === 'pending'
const isResolved = ({ status }: PromiseState) => status === 'resolved'

const getStatus = get<PromiseState>('status')
const getReason = get<PromiseState>('reason')
const getResult = get<PromiseState>('result')

type PromiseState<Result = unknown, Reason = unknown> = (
  {
    reason: null,
    result: null,
    status: 'pending'
  } | {
    reason: Reason,
    result: null,
    status: 'rejected'
  } | {
    reason: null,
    result: Result,
    status: 'resolved'
  }
)

interface ObservablePromise<T, R> extends Observable<T> {
  $status: Observable<PromiseState<T, R>['status']>,
  $result: Observable<PromiseState<T, R>['result']>,
  $reason: Observable<PromiseState<T, R>['reason']>,
  $isPending: Observable<boolean>,
  $isResolved: Observable<boolean>,
  $isRejected: Observable<boolean>,
  fallback: (value: T) => ObservablePromise<T, R>
}

// TODO: create `async` module to put all async things into
//  or an experimental module
export const fromPromise = <T, Reason = unknown>(promise: Promise<T> | (() => Promise<T>)): ObservablePromise<T, Reason> => {
  if (typeof promise === "function") return fromPromise(promise());
  type Self = ObservablePromise<T, Reason>
  const self = signal<T>();
  const $state = signal<PromiseState>({
    reason: null,
    result: null,
    status: 'pending'
  })

  const $isPending = derive($state, isPending)
  const $isResolved = derive($state, isResolved)
  const $isRejected = derive($state, isRejected)
  const $status = derive($state, getStatus)
  const $result = derive($state, getResult)
  const $reason = derive($state, getReason)

  Object.assign(self, {
    $status,
    $result,
    $reason,
    $isPending,
    $isRejected,
    $isResolved,
    fallback(v: T) {
      // Update display value only if promise wasn't resolved successfully.
      // This way  it *could* be used to display a different value when
      // it was rejected.
      if ($state().status !== 'resolved') {
        return self.set(v) as unknown as Self
      }
    }
  })

  promise
    .then((result) => {
      // wrap in a batch to ensure that there's no situation
      // where `self` has the resolved value but state is still 'pending'
      batch(() => {
        self.set(result)
        mutate($state, state => {
          state.result = result
          state.status = 'resolved'
        })
      })
    })
    .catch((reason) => {
      batch(() => {
        // note: deliberately *not* updating `self` with reason here
        // the reason for rejection is not a fallback value.
        mutate($state, state => {
          state.reason = reason
          state.status = 'rejected'
        })
      })
    })

  return self as unknown as Self
}

export const onReject = <T, Reason>(self: ObservablePromise<T, Reason>, cb: Callback<Reason>) =>
  effect(self.$isRejected, isRejected => isRejected && cb(self.$reason() as Reason))

export const onResolve = <T, Reason>(self: ObservablePromise<T, Reason>, cb: Callback<Reason>) =>
  effect(self.$isResolved, isResolved => isResolved && cb(self.$result() as Reason))
