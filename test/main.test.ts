import { describe, expect, it, vi } from "vitest";
import { derive, emit, on, signal, bind } from "../main";

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
  it('works with multiple signals', async () => {
    const a = signal(3)
    const b = signal(4)
    const result = derive([a, b], (a, b) => a * b)
    expect(result.value).toEqual(12)
    a.value = 5
    await vi.runAllTimersAsync();
    expect(result.value).toEqual(20)
  })
})

describe("on", () => {
  it("can watch multiple signals or topics and is called when either emits", async () => {
    const a = signal("a")
    const b = signal("b")

    const cb = vi.fn()
    on([a, b], cb);
    a.set('c')
    await vi.runAllTimersAsync();
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith("c", "b");
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

  it("it also can take multiple", async () => {
    const name = signal("john");
    const things = signal(0);
    const el = document.createElement("div");

    bind([name, things], (name, things) => el.innerHTML = `${name} ${things}`)

    expect(el.innerHTML).toEqual("john 0")
    name.value = "peter"
    await vi.runAllTimersAsync();
    expect(el.innerHTML).toEqual("peter 0")
    things.value = 3
    await vi.runAllTimersAsync();
    expect(el.innerHTML).toEqual("peter 3")
  })

  it("values can be taken from scope", async () => {
    const name = signal("john");
    const things = signal(0);
    const el = document.createElement("div");

    bind([name, things], () => el.innerHTML = `${name.get()} ${things.get()}`)

    expect(el.innerHTML).toEqual("john 0")
    name.value = "peter"
    await vi.runAllTimersAsync();
    expect(el.innerHTML).toEqual("peter 0")
    things.value = 3
    await vi.runAllTimersAsync();
    expect(el.innerHTML).toEqual("peter 3")
  })
})
