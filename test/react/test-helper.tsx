import React, { useRef } from 'react'
import { useSignal, useSignalValue } from '../../src/extras/experimental/react'
import type { ReadableSignal, WriteableSignal } from '../../src/core'

const useRenderCount = () => {
  const count = useRef(0)
  count.current += 1
  return count.current
}

export const InspectSignalValue = <T extends any>(props: {
  signal: ReadableSignal<T>
  label: string
  children?: React.ReactNode
}) => {
  const value = useSignalValue(props.signal)
  const renderCount = useRenderCount()
  return (
    <div>
      {`:${props.label}:${value}:${renderCount}:`}
      <div>{props.children}</div>
    </div>
  )
}

export const InspectSignal = <T extends any>(props: {
  signal: WriteableSignal<T>
  label: string
  children?: React.ReactNode
  onClick: (value: T) => T
}) => {
  const [value, setValue] = useSignal(props.signal)
  const renderCount = useRenderCount()
  return (
    <div>
      {`:${props.label}:${value}:${renderCount}:`}
      <button
        onClick={() => setValue(props.onClick(value))}
      >{`:${props.label}:button:`}</button>
      <div>{props.children}</div>
    </div>
  )
}
