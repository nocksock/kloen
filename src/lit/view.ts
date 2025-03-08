import { AsyncDirective, directive } from "lit/async-directive.js"
import { effect, Signal, WriteableSignal } from "../core";

class SignalDirective<T = any> extends AsyncDirective {
  #signal!: WriteableSignal<T>
  #unsubscribe?: () => void

  #subscribe(signal: Signal<T>) {
    this.#unsubscribe = effect(() => {
      console.log('effect', signal())
      this.setValue(signal())
    })
  }

  render($value: Signal<T>) {
    console.log('render', $value())
    if (this.#signal !== $value) {
      this.#unsubscribe?.();
      this.#signal = $value
      if (this.isConnected)  {
        this.#subscribe($value);
      }
    }
    return $value()
  }

  disconnected() { this.#unsubscribe?.(); }
  reconnected() { this.#subscribe(this.#signal); }
}

export const view = directive(SignalDirective);
