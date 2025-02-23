## TODO: indexedDB wrapper

## TODO: lazy eval via tracking

emit value only when subscribers present
execute update/mutate on read or when subscribers present

```
$signal.isWatched 
```

## TODO: WebComponent

```js
const $value = signal.for('signal-id');
window.KLOEN_ELEMENT_PREFIX = 'signal'
```

```html
<signal-value for="signal-id">loading</signal-value>
```

```html
<signal-input id="something" type="color" export-css="--custom-prop"></signal-input>
<signal-value for="something"></signal-value>
<signal-ui-input label="Some Value" hint="..." id="something" type="range" export-css="--custom-prop"></signal-input>

<script>
    signal.for('todos', ['a', 'b', 'c'])
</script>
<signal-list for="todos">
    <signal-value for=""></signal-value>
</signal-list>
```
