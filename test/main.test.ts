import { suite, test, expect, vi } from 'vitest';
import { create } from 'kloenen';

suite('kloenen', _ => {
  test("basic usage", _ => {
    const [sub, fire] = create()
    const cb = vi.fn()
    const unsub = sub('topic', cb)
    fire('topic', 'hello')
    expect(cb).toHaveBeenCalledWith('hello')
    unsub()
    fire('topic', 'hello')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test("multiple subscribers", _ => {
    const [sub, fire] = create()
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    const unsub1 = sub('topic', cb1)
    const unsub2 = sub('topic', cb2)
    fire('topic', 'hello')
    expect(cb1).toHaveBeenCalledWith('hello')
    expect(cb2).toHaveBeenCalledWith('hello')
    unsub1()
    fire('topic', 'hello')
    expect(cb1).toHaveBeenCalledTimes(1)
    expect(cb2).toHaveBeenCalledTimes(2)
  })
})

