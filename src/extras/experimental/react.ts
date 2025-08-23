import React, { useEffect } from 'react'
import { effect } from '../../core'
import type { ReadableSignal, WriteableSignal } from '../../core'

export const useSignalValue = <T extends ReadableSignal<any>>($: T) => {
  const [state, setState] = React.useState($)
  useEffect(() => effect(() => setState($())), [])
  return state
}

export const useSignal = <T extends WriteableSignal<any>>($: T) => {
  const [state, setState] = React.useState($())
  useEffect(() => effect(() => setState($())), [])
  return [state, (value: T) => $(value)]
}
