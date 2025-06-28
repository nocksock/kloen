import { describe, expect, it } from 'vitest'
import { sync } from '../src/extras/sync'
import { verifySignalBehaviour } from './test-helpers'
import { identity } from '../src/extras/identity'

describe('sync', () => {
  it(
    'behaves like a signal',
    verifySignalBehaviour(sync(() => null as any, identity))
  )

  it('syncs a signal with a read and write function', () => {
    const db = new Map()
    const fromDB = sync(
      key => db.get(key),
      (key, newValue) => (db.set(key, newValue), newValue)
    )
    const value = fromDB('key')
    expect(value()).toBeUndefined()
    value('some value')
    // verify eager writes
    expect(db.get('key')).toEqual('some value')
    expect(value()).toEqual('some value')
  })
})
