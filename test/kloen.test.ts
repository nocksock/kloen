import { suite, test, expect, vi, afterEach, expectTypeOf } from 'vitest'
import { on, emit, clear, value, create } from '../lib/kloen.js'

suite('kloen', _ => {
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

  suite('create', _ => {
    test('types', _ => {
      const symb = Symbol('foo')
      const fn = (foo: string) => {}
      const [on, emit] = create<{
        foo: 'bar' | 'baz'
        bar: 'somefoo'
        trigger: undefined
        [symb]: Record<any, any>
        // TODO: find a way to allow this
        // [fn]: Parameters<typeof fn>
      }>()

      // @ts-expect-error 'nope' is not a defined scope
      emit('nope', 'bar')

      on('foo', message => {
        expectTypeOf(message).toEqualTypeOf<'bar' | 'baz'>()
      })

      on('trigger', message => {
        expectTypeOf(message).toEqualTypeOf<undefined>()
      })

      emit('trigger')

      on('bar', message => {
        expectTypeOf(message).toEqualTypeOf<'somefoo'>()
      })
    })

    test('can take a setter', _ => {
      const cb = vi.fn((payload, oldValue) => oldValue + (payload || 1))
      const [onValue, increment] = value(0, cb)
      increment()
      expect(cb).toHaveBeenCalledWith(undefined, 0)
      increment(1)
      expect(cb).toHaveBeenCalledWith(1, 1)
      increment('foo')
      expect(cb).toHaveBeenCalledWith('foo', 2)
    })

    test('setter can be used as a reducer', _ => {
      const reducer = vi.fn((action, state) => {
        switch (action.type) {
          case 'addUser': {
            return { users: [...state.users, action.data] }
          }
          default: {
            return state
          }
        }
      })
      const [onUpdate, dispatch, ref] = value({ users: [] }, reducer)

      expect(ref.value).toEqual({ users: [] })
      dispatch({ type: 'addUser', data: 'foo' })

      onUpdate(newValue => {
        expect(reducer).toHaveBeenCalledWith(
          { type: 'addUser', data: 'foo' },
          { users: [] }
        )
        expect(newValue).toEqual({ users: ['foo'] })
      })

      expect(ref.value).toEqual({ users: ['foo'] })
    })

    // TODO: implement this
    // test.('can take map', _ => {
    //   const map = new Map<object, number>()
    //   const [on, emit] = create(map)
    //   on('foo', message => {
    //     expectTypeOf(message).toEqualTypeOf<'bar' | 'baz'>()
    //   })
    // })
  })
})
