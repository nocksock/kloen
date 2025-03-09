# Why?

This is mostly to study signals and understand their various implementations better as well as an exercise in API design.

However I personally use this when prototyping, in my solo-side-projects and all features are written using TDD and the core primitives are *somewhat* stable.
Initially I event implemented my own reactivity system, but I didn't prioritise efficiency/performance.
So when that had served its purpose, I replaced it with [alien-signals]'s reactivity system.
*Now* it's using [alien-signals]'; so it's *very* efficient and fast.

**However** I am maintaining this in bursts, rather than steadily - so I don't advice using this for anything other than experiments at the moment.
Also it will likely take a while if you happend to file an issue until I find time to get to it.
