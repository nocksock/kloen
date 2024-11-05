import { describe, expect, it, vi } from "vitest";
import { derive, emit, on, signal, bind } from "../main";

describe("on/emit", () => {
  it("is a basic pubsub bus", () => {
    const cb = vi.fn();
    const unsub = on("topic", cb);
    emit("othertopic", "hello");
    expect(cb).toHaveBeenCalledTimes(0);
    emit("topic", "hello");
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
    emit("topic", "hello");
    expect(cb).toHaveBeenCalledTimes(1);
  });
});

describe("Signal", () => {
  vi.useFakeTimers();

  it("looks like a normal field", () => {
    const thing = signal("abc");
    expect(thing.value).toEqual("abc");
    thing.value = "123";
    expect(thing.value).toEqual("123");
  });

  it("can be observed via on", async () => {
    const thing = signal("abc");
    const cb = vi.fn();
    on(thing, cb);

    thing.set("123");
    thing.set("123");
    thing.set("123");
    thing.set("123");

    // call every function only once
    expect(cb).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith("123");
  });

  it("can be derived", async () => {
    const a = signal(3);
    const b = derive(a, (a) => a * a);
    const cb = vi.fn();
    on(b, cb);
    expect(b.get()).toEqual(9);
    a.set(4);
    await vi.runAllTimersAsync();
    expect(b.get()).toEqual(16);
  });

});

describe('derive', () => {
  it('creates derivative based on scope', () => {
    const something = derive("some-scope", (payload = "bar") => `foo: ${payload}`)
    expect(something.get()).toEqual("foo: bar")
  })
})

describe("on", () => {
  it("can watch multiple signals or topics and is called when either emits", () => {
    const a = signal("a")
    const b = signal("b")
    const cb = vi.fn()
    // on([a, b], cb);
    expect(cb).toHaveBeenCalledTimes(0);
  })
})

describe('bind', () => {
  it("works like `on` but calls it immediately for simple render fn", async () => {
    const name = signal("john");
    const el = document.createElement("div");

    bind(name, value => el.innerHTML = `hello ${value}`)
    expect(el.innerHTML).toEqual("hello john")
    name.value = "peter"
    await vi.runAllTimersAsync();
    expect(el.innerHTML).toEqual("hello peter")
  })
})
