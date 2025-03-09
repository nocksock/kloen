# Notes

## `.lazy`?

```js
const $ = signal.lazy(() => 'value')

// vs
const $ = signal(() => 'value')
```

While the latter seems nice, it'd make creating applicatives harder. 
But maybe, since those probably the rarer case, `signal.ap(fn)` would be the better option?
Seems weird though.
