export const identity = <T extends any>(value: T, ..._: any[]) => value
export const tap = <T>(value: T, fn: (value: T) => any) => {
  fn(value)
  return value
}

