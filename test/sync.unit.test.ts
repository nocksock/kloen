import { describe, expect, it } from 'vitest'
import { sync } from '../src/extras/experimental/sync'
import { verifySignalBehaviour } from './test-helpers'
import { identity } from '../src/extras/identity'
import { effect, signal } from '../src/core'
import { mutate } from '../src/extras'

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

  it('can sync in both directions', () => {
    type User = { name: string }
    const db = signal(new Map<string, User>())

    const fromDB = sync<User>(
      // @ts-expect-error - TODO: fix types
      (key, self) => {
        effect(() => self(db().get(key) || undefined))
        return 'foo'
      },
      (key, newValue) => {
        mutate(db, db => db.set(key, newValue))
        return newValue
      }
    )

    const frodo = fromDB('frodo')
    const sam = fromDB('sam')

    expect(frodo()).toBeUndefined()
    mutate(db, db => db.set('frodo', { name: 'Frodo' }))

    expect(frodo()).toEqual({ name: 'Frodo' })

    sam({ name: 'Sam' })
    expect(db().get('sam')).toEqual({ name: 'Sam' })
  })
})
