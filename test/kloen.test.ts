import { suite, test, it, expect, vi, afterEach, expectTypeOf } from 'vitest'
import { on, emit, clear, value, create } from '../lib/kloen.max'

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

  test('multiple signals', _ => {
    const cb = vi.fn()
    const [a$, setA] = value(1)
    const [b$, setB] = value('hello')
    on([a$, b$], cb)
    expect(cb).toHaveBeenCalledWith([1, 'hello'])
    setA(2)
    expect(cb).toHaveBeenCalledWith([2, 'hello'])
    setB('world')
    expect(cb).toHaveBeenCalledWith([2, 'world'])
  })

  test('current values are available in callbacks', _ => {
    const [a, setA, fromA] = value('hello')
    const [b] = fromA(v => v + ' world')

    const cb = vi.fn(v => {
      expect(a.cur).toEqual('moin')
      expect(b.cur).toEqual('moin world')
    })

    on(a, cb)
    setA('moin')
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
      const [onValue, setValue, _derive] = value()
      const handler = vi.fn()
      const unsub = onValue(handler)
      expect(handler).not.toHaveBeenCalled()
      setValue(1)
      expect(handler).toHaveBeenCalledWith(1)
      unsub()
      setValue(2)
      expect(handler).not.toHaveBeenCalledWith(2)
    })

    it('actually uses the observer as scope', () => {
      const [onValue, setValue] = value(0)
      const cb = vi.fn()
      on(onValue, cb)
      setValue(1)
      expect(cb).toHaveBeenCalledWith(1)
    })

    it('returns a derive method', () => {
      value.debug = true
      const handleTaskUpdate = vi.fn()
      const [tasks$, setTasks, deriveTasks$] = value([1, 2, 3])
      tasks$(handleTaskUpdate)
      expect(handleTaskUpdate).toHaveBeenCalledWith([1, 2, 3])
      expect(tasks$.cur).toEqual([1, 2, 3])

      const [length$, fromOnLength] = deriveTasks$(tasks => {
        expectTypeOf(tasks).toEqualTypeOf<number[]>()
        return tasks.length
      })

      const handleLengthUpdate = vi.fn()
      length$(handleLengthUpdate) // wasn't called, means length doesn't call the fn
      expect(handleLengthUpdate).toHaveBeenCalledWith(3)
      
      setTasks([1, 2, 3, 4])

      expect(handleLengthUpdate).toHaveBeenCalledWith(4)
      expect(tasks$.cur).toEqual([1, 2, 3, 4])
    })


    it('should be possible to have derivatives of derivatives', () => {
      const [value$, setValue, fromValue] = value(0)
      const [double$, fromDouble] = fromValue(v => v * 2)
      const [doubleDouble$] = fromDouble(v => v * 2)

      const cb = vi.fn()
      const cb2 = vi.fn()

      double$(cb)
      doubleDouble$(cb2)
      expect(cb).toHaveBeenCalledWith(0)
      expect(cb2).toHaveBeenCalledWith(0)

      setValue(2)
      expect(cb).toHaveBeenCalledWith(4)
      expect(cb2).toHaveBeenCalledWith(8)
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


  })
})
