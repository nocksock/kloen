import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { effect, signal } from '../../../src'

const signalValue = signal(0)
setInterval(() => {
  console.log('inside value', signalValue())
  signalValue(signalValue() + 1)
}, 500)

effect(() => {
  console.log('effect value', signalValue())
})

@customElement('signal-value')
export class SignalValue extends LitElement {
  constructor() {
    super()
    effect(() => {
      console.log('value', signalValue())
      this.render()
      this.requestUpdate()
    })
  }

  render() {
    return html` <div>Value: ${signalValue()}</div> `
  }
}
