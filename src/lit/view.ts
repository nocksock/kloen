import { html } from "lit"
import { AsyncDirective, directive } from "lit/async-directive.js"
import { Observable, watch } from "../kloen";

class SignalDirective<T = any> extends AsyncDirective {
  #signal!: Observable<T>
  #unsubscribe?: () => void

  #subscribe(signal: Observable<T>) {
    this.#unsubscribe = watch(signal, () => this.setValue(signal()));
  }

  render(signal: Observable<T>) {
    if (this.#signal !== signal) {
      this.#unsubscribe?.();
      this.#signal = signal
      if (this.isConnected)  {
        this.#subscribe(signal);
      }
    }
    return html`value: ${signal()}`;
  }

  disconnected() { this.#unsubscribe?.(); }
  reconnected() { this.#subscribe(this.#signal); }
}

export const view = directive(SignalDirective);
