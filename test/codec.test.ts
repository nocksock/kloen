import { describe, expect, it } from 'vitest'
import { codec } from '../src/extras'
import { verifySignalBehaviour } from './test-helpers'
import { identity } from '../src/extras/identity'

describe('codec', () => {
  it('creates a signal factory', verifySignalBehaviour(codec(null)))

  it('uses onWrite', () => {
    const map = ['one', 'two', 'three']
    const fooCodec = codec((v: number, _prev) => map[v - 1] || 'unknown')

    const foo = fooCodec(1)
    expect(foo()).toEqual('one')
    foo(2)
    expect(foo()).toEqual('two')
  })

  it('uses onRead', () => {
    const map = {
      one: 1,
      two: 2,
      three: 3,
    }

    const numCodec = codec(null, (v: string) => map[v])

    const foo = numCodec('one')
    expect(foo()).toEqual(1)
    foo('two')
    expect(foo()).toEqual(2)
  })
})
