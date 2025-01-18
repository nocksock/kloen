import { LitElement, html } from 'lit'
import { property, customElement } from 'lit/decorators.js'
import { derive, signal, update } from '../../../src/kloen'
import { view } from '../../../src/lit'

const $value = signal(0);
const $crossTotal = derive($value, v =>
  String(v).split('').reduce((acc, cv) => acc + Number(cv), 0)
)

@customElement('view-value')
class ViewValue extends LitElement {
  render() {
    return html`
      <p>the current value is:</p>
      <output>
        ${view($value)}
      </output>
    `
  }
}

@customElement('cross-total')
class CrossTotal extends LitElement {
  render() {
    return html`
      <div>
        <p>the cross total is:</p>
        <output>
          ${view($crossTotal)}
        </output>
      </div>
    `
  }
}


@customElement('add-button')
class AddButton extends LitElement {
  @property({ type: Number })
  amount = 1

  render() {
    return html`
      <button @click=${this.#add} part="button">
        Add ${this.amount}
      </button>
    `
  }

  #add() {
    update($value, v => v + this.amount)
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'view-value': ViewValue
    'add-button': AddButton
    'cross-total': CrossTotal
  }
}
