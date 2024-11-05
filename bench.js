import _ from 'lodash'

const a =
  'Consectetur rerum repellendus nobis sed nisi. Provident maxime amet molestiae error mollitia? Consequatur impedit quas eum ipsa distinctio omnis, cupiditate? Dolorum accusantium dolor saepe saepe quae nihil eaque praesentium? Molestiae'

const AMOUNT = 5_000

const caller = function (msg, fn) {
  return fn(msg + ' ' + _.eq(a, msg) + ' ' + _.eq(a, msg))
}

function withArrowFn() {
  const store = new Set()
  const listeners = new Set()
  const on = fn => listeners.add(fn)

  for (let i = 0; i < AMOUNT; i++) {
    on(r => store.add(r))
  }

  const emit = msg => listeners.forEach(fn => caller(msg, fn))

  for (let i = 0; i < AMOUNT; i++) {
    emit('foo' + i)
  }

  console.log(store.size)
}

function withBind() {
  const store = new Set()
  const listeners = new Set()
  const on = fn => listeners.add(fn)

  for (let i = 0; i < AMOUNT; i++) {
    on(r => store.add(r))
  }

  const emit = msg => listeners.forEach(fn => caller(msg, fn))

  for (let i = 0; i < AMOUNT; i++) {
    emit('foo' + i)
  }

  console.log(store.size)
}

let pre

const getmem = pre =>
  console.log(
    ((process.memoryUsage().heapUsed - pre) / 1024 / 1024).toFixed(2),
    'MB'
  )

global.gc()
pre = process.memoryUsage().heapUsed
withArrowFn()
getmem(pre)

global.gc()
pre = process.memoryUsage().heapUsed
withBind()
getmem(pre)

// $ node --expose-gc bench.js
// 4.93 MB
// 4.40 MB
