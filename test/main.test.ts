import { suite, test, expect, vi, afterEach } from 'vitest'
import { on, emit, clear, value } from '../lib/main'

suite('kloenen', _ => {
  afterEach(clear)
  test('basic usage', _ => {
    const cb = vi.fn()
    const unsub = on('topic', cb)
    emit('topic', 'hello')
    expect(cb).toHaveBeenCalledWith('hello')
    unsub()
    emit('topic', 'hello')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('multiple subscribers', _ => {
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    const unsub1 = on('topic', cb1)
    const unsub2 = on('topic', cb2)
    emit('topic', 'hello')
    expect(cb1).toHaveBeenCalledWith('hello')
    expect(cb2).toHaveBeenCalledWith('hello')
    unsub1()
    emit('topic', 'hello')
    expect(cb1).toHaveBeenCalledTimes(1)
    expect(cb2).toHaveBeenCalledTimes(2)
  })

  test('emit returns the value for chaining in promises', _ => {
    const cb = vi.fn()
    Promise.resolve(emit('topic', 'hello'))
      .then(cb)
      .then(_ => expect(cb).toHaveBeenCalledWith('hello'))
  })

  test('so does setValue', _ => {
    const cb = vi.fn()
    const [onValue, setValue] = value(0)
    Promise.resolve(setValue('hello'))
      .then(cb)
      .then(_ => expect(cb).toHaveBeenCalledWith('hello'))
  })

  suite('value', _ => {
    test('wrap values in a scope', _ => {
      // value
      const [onValue, setValue] = value(0)
      const handler = vi.fn()
      const unsub = onValue(handler)
      // calls all new handler with the initial value, if present
      expect(handler).toHaveBeenCalledWith(0)
      setValue(1)
      expect(handler).toHaveBeenCalledWith(1)
      unsub()
      setValue(2)
      expect(handler).not.toHaveBeenCalledWith(2)
    })
    test('no handler call if no initial value given', _ => {
      // value
      const [onValue, setValue] = value()
      const handler = vi.fn()
      const unsub = onValue(handler)
      // calls all new handler with the initial value, if present
      expect(handler).not.toHaveBeenCalled()
      setValue(1)
      expect(handler).toHaveBeenCalledWith(1)
      unsub()
      setValue(2)
      expect(handler).not.toHaveBeenCalledWith(2)
    })
  })
})
