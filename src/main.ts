// import { html } from 'todomel'

import { create } from '../lib/kloen.max'

const [on, emit, value] = create()

const session = value(123)
