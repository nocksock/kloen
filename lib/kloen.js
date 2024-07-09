export const create=(M=new Map())=>[
(s,f)=>(!M.has(s)&&M.set(s,new Set()),M.get(s).add(f),_=>M.get(s).delete(f)),
(s,v)=>(M.get(s)?.forEach(f=>f(v)),v),
_=>M.clear()]
export const [on,emit,clear]=create()
export const value=(d,r)=>((S=Symbol(),M={value:d})=>[
f=>(d!==void 0&&f(d),on(S,f)),
r?m=>(M.value=d=r(m,d),emit(S,m)):pl=>(M.value=pl,emit(S,pl)),
f=>c=>(d!==void 0&&c(f(M.value)),on(S,v=>c(f(v)))),
M])()
