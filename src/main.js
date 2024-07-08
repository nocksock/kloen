"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _MessageView_received;
Object.defineProperty(exports, "__esModule", { value: true });
require("./style.css");
const main_1 = require("../lib/main");
const { fire, sub } = (0, main_1.create)();
class MessageFire extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        var _a;
        this.innerHTML = `
        <button>
          fire
        </button>
      `;
        (_a = this.querySelector('button')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', _ => fire(MessageFire, { msg: 'hello' }));
    }
}
class MessageView extends HTMLElement {
    constructor() {
        sub(MessageFire, msg => {
            __classPrivateFieldGet(this, _MessageView_received, "f").push(msg);
            this.render();
        });
        super();
        _MessageView_received.set(this, []);
    }
    render() {
        this.innerHTML = `
        <ul>
          ${__classPrivateFieldGet(this, _MessageView_received, "f")
            .map(msg => `<li>${JSON.stringify(msg)}</li>`)
            .join('')}
        </ul>
      `;
    }
}
_MessageView_received = new WeakMap();
sub(MessageFire, msg => console.log('received', msg));
customElements.define('message-view', MessageView);
customElements.define('message-fire', MessageFire);
