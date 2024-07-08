export const create=(M=new Map())=>[
(s,f)=>(!M.has(s)&&M.set(s,new Set()),M.get(s).add(f),_=>M.get(s).delete(f)),
(s,v)=>(M.get(s)?.forEach(f=>f(v)),v),
M.clear.bind(M)]
export const [on,emit,clear]=create()
export const value=(d,r,S=Symbol(),M={value:d})=>[
f=>(d!==undefined&&f(d),on(S,f)),
r?pl=>(M.value=d=r(pl,d),emit(S,M.value))
:v=>(d=v,emit(S,v)),
M]
