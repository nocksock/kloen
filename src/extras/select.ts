import { derive, Observable } from "../kloen";

type PropertyChain<T extends Record<string, unknown>> = {
  [K in keyof T]: K extends string
  ? `${K}` | `${K}.${PropertyChain<Extract<T[K], Record<string, unknown>>>}`
  : never;
}[keyof T];

type FromPropertyChain<
  T extends Record<string, unknown>,
  K extends PropertyChain<T>
> = K extends `${infer Head}.${infer Tail}`
  ? Head extends keyof T
  ? T[Head] extends Record<string, unknown>
  ? Tail extends PropertyChain<T[Head]>
  ? FromPropertyChain<T[Head], Tail>
  : never
  : never
  : never
  : K extends keyof T
  ? T[K]
  : never;

function getFromPropertyChain<
  O extends Record<string, unknown>,
  C extends PropertyChain<O>
>(obj: O, chain: C): FromPropertyChain<O, C> {
  const chainItems = chain.split(".");
  if (!chainItems.length) throw new Error("Empty chain");
  let item = null;
  for (const key of chainItems) {
    item = obj[key];
  }
  return item as FromPropertyChain<O, C>;
}


export const prop = <
  O extends Record<string, unknown>
>(key: PropertyChain<O>) => (o: O) => getFromPropertyChain(o, key)

/**
 * Create a derived observable from an object
 * aka `lens` in other libraries
 */
export const select = <V extends Record<string, unknown>>($: Observable<V>, path: PropertyChain<V>) => 
  derive($, prop<V>(path))
