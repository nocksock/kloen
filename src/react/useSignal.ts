import { useState, useEffect } from "react"
import { Signal } from "../kloen"

export const useSignal = <T extends any>(s: Signal<T>) => {
  const [value, setValue] = useState<T>(s.get())
  useEffect(() => s.onChange(setValue), [])
  return [value, setValue]
}
