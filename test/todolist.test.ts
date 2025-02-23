import { describe, test, vi, expect } from "vitest"
import { distinct, reduce, ap, flatMap, when } from '../src/extras'
import { fromPromise } from '../src/extras/async'
import { read, update, mutate, call, map, derive, watch, signal, effect, batch, write } from '../src/kloen'

const createTodo = (title: string, description: null | string = null) => ({
  id: crypto.randomUUID(),
  title,
  description
})

const DB = [
  createTodo('A'),
  createTodo('B', 'todo item B'),
  createTodo('C')
] as const

type Todo = typeof DB[number];

const todos = {
  async listAll() {
    return structuredClone(DB) as unknown as Todo[]
  },
  async updateTodo(id: Todo['id'], todo: Todo) {
    const index = DB.findIndex(todo => todo.id === id)
    const item = DB.at(index)
    if (!item) throw new Error(`todo:${todo.id} no longer exists`)
    return Object.assign(item, todo)
  }
}

describe.skip('todolist', () => {
  vi.useFakeTimers()

  test('', async () => {
    const $asyncTodos = fromPromise(() => todos.listAll()).fallback([])
    const $$todos = derive($asyncTodos, list =>
      list.map(item => signal.for(`todo:${item.id}`, item))
    )

    await vi.runAllTimersAsync()
    expect($$todos().length).toBe(3)

    const [$a, $b, $c] = $$todos();

    expect($a().title).toBe('A')
    mutate($a, todo => todo.title = 'New A')
  })
})
