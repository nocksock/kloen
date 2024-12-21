import { useState, useEffect } from "react"
import { MutableObservable, Observable, watch, write } from "../kloen"

export const useSignal = <T extends any>($value: MutableObservable<T>) => {
  const [value, setValue] = useState<T>($value())
  useEffect(() => watch($value, setValue), [])
  return [value, write.bind(null, $value)]
}

export const useSignalValue = <T extends any>($value: Observable<T>) => {
  const [value, setValue] = useState<T>($value())
  useEffect(() => watch($value, setValue), [])
  return value
}
