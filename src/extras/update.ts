import { WriteableSignal } from "../core";


/**
 * Update the value of a signal using a transformation function.
 **/
export const update = <T>(self: WriteableSignal<T>, fn: (value: T) => T) =>
  self(fn(self()))

