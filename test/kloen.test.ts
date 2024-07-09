import { suite, test, it, expect, vi, afterEach, expectTypeOf } from 'vitest'
import { on, emit, clear, value, create, derive } from '../lib/kloen.js'

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
    const [onValue, setValue] = value<0 | 'hello'>(0)
    expect(setValue('hello')).toEqual('hello')
  })

  suite('value', _ => {
    it('calls handlers immediately when given default Value', _ => {
      const [onValue] = value('foo'),
        handler = vi.fn()
      onValue(handler)
      expect(handler).toHaveBeenCalledWith('foo')
    })
    it('does not call handler immediately without default value', _ => {
      const [onValue, setValue, _derive, ref] = value()
      const handler = vi.fn()
      const unsub = onValue(handler)
      expect(handler).not.toHaveBeenCalled()
      setValue(1)
      expect(handler).toHaveBeenCalledWith(1)
      unsub()
      setValue(2)
      expect(handler).not.toHaveBeenCalledWith(2)
    })

    it('returns a derive method', () => {
      const cb = vi.fn()
      const cb2 = vi.fn()
      const [onTasks, setTasks, derive, ref] = value([1, 2, 3])
      onTasks(cb2)
      expect(cb2).toHaveBeenCalledWith([1, 2, 3])
      expect(ref.value).toEqual([1, 2, 3])
      const onLength = derive(tasks => {
        expectTypeOf(tasks).toEqualTypeOf<number[]>()
        return tasks.length
      })
      onLength(cb)
      expect(cb).toHaveBeenCalledWith(3)
      setTasks([1, 2, 3, 4])
      expect(cb).toHaveBeenCalledWith(4)
      expect(ref.value).toEqual([1, 2, 3, 4])
    })

    it('can take a transformer', _ => {
      const cb = vi.fn((payload, oldValue) => oldValue + (payload || 1))
      const [onValue, increment] = value(0, cb)
      increment(1)
      expect(cb).toHaveBeenCalledWith(1, 0)
      // @ts-expect-error
      increment('foo')
      expect(cb).toHaveBeenCalledWith('foo', 1)
    })

    it('can be used as a reducer', _ => {
      const reducer = vi.fn((action: { type: string; data: string }, state) => {
        switch (action.type) {
          case 'addUser': {
            return { users: [...state.users, action.data] }
          }
          default: {
            return state
          }
        }
      })
      const [onUpdate, dispatch] = value({ users: [] }, reducer)

      dispatch({ type: 'addUser', data: 'foo' })

      onUpdate(newValue => {
        expect(reducer).toHaveBeenCalledWith(
          { type: 'addUser', data: 'foo' },
          { users: [] }
        )
        expect(newValue).toEqual({ users: ['foo'] })
      })
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
        // TODO: find a way to allow this in ts
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
