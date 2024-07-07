import './style.css'
import { create } from '../lib/main'

const { fire, sub } = create()

class MessageFire extends HTMLElement {
  constructor() {
    super()
  }
  connectedCallback() {
    this.innerHTML = `
        <button>
          fire
        </button>
      `

    this.querySelector('button')?.addEventListener('click', _ =>
      fire(MessageFire, { msg: 'hello' })
    )
  }
}

class MessageView extends HTMLElement {
  #received = [] as unknown[]
  constructor() {
    sub(MessageFire, msg => {
      this.#received.push(msg)
      this.render()
    })

    super()
  }
  render() {
    this.innerHTML = `
        <ul>
          ${this.#received
            .map(msg => `<li>${JSON.stringify(msg)}</li>`)
            .join('')}
        </ul>
      `
  }
}

sub(MessageFire, msg => console.log('received', msg))

customElements.define('message-view', MessageView)
customElements.define('message-fire', MessageFire)
