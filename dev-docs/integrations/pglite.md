# Integrating with pglite live queries?

PGlite has this API

```js
const ret = pg.live.query('SELECT name FROM users;', [], (res) => {
  // res is the same as a standard query result object
})
```

## Variant A: factory fn

```js
const $names = query('SELECT name FROM users', []);
```
