import { html } from "lit"
import { AsyncDirective, directive } from "lit/async-directive.js"
import { Observable, watch } from "../kloen";

class SignalDirective<T = any> extends AsyncDirective {
  #signal!: Observable<T>
  #unsubscribe?: () => void

  #subscribe(signal: Observable<T>) {
    this.#unsubscribe = watch(signal, () => this.setValue(signal()));
  }

  render($value: Observable<T>) {
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
