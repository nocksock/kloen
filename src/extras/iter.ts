import { derive, Observable } from "../kloen"

export function filter<T>(self: Observable<T[]>, predicate: (value: T) => boolean): Observable<T[]> {
  return derive(self, newValue => 
    newValue.filter(predicate)
  )
}

