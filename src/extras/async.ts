// @ts-nocheck - old version
import { batch, Callback, derive, effect, mutate, Observable, signal } from "../kloen"
import { prop } from "./select"

const isRejected = ({ status }: PromiseState) => status === 'rejected'
const isPending = ({ status }: PromiseState) => status === 'pending'
const isResolved = ({ status }: PromiseState) => status === 'resolved'

const getStatus = prop<PromiseState>('status')
const getReason = prop<PromiseState>('reason')
const getResult = prop<PromiseState>('result')

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
  // using effect instead of watch to trigger the callback if promise has 
  // already settled
  effect(self.$isRejected, isRejected => isRejected && cb(self.$reason() as Reason))

export const onResolve = <T, Reason>(self: ObservablePromise<T, Reason>, cb: Callback<Reason>) =>
  // @see above
  effect(self.$isResolved, isResolved => isResolved && cb(self.$result() as Reason))
