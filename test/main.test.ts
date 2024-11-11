import { describe, expect, it, vi } from "vitest";
import { derive, on, signal, bind, when, Signal } from "../main";

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
    const unsub = on(thing, cb);

    thing.set("123");
    thing.set("123");
    thing.set("123");
    thing.set("123");

    // call every function only once
    expect(cb).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();

    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith("123");
    unsub();

    thing.set("foo");
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

  it("values can be taken from scope, toString called automatically", async () => {
    const name = signal("john");
    const things = signal(0);
    const el = document.createElement("div");

    bind([name, things], () => el.innerHTML = `${name} ${things}`)

    expect(el.innerHTML).toEqual("john 0")
    name.value = "peter"
    await vi.runAllTimersAsync();
    expect(el.innerHTML).toEqual("peter 0")
    things.value = 3
    await vi.runAllTimersAsync();
    expect(el.innerHTML).toEqual("peter 3")
  })
})


// -- signal:update(fn, ...args) -> self    -- for mutation with chaining
// -- signal:set(value) -> self             -- direct value set
// -- signal:map(fn) -> Signal              -- derives new signal
// -- signal:call(fn, ...args) -> result    -- calls fn with signal value + args
// -- signal:ap(signalOfFn) -> Signal       -- applies signal of function
// -- signal:bind(fn) -> Signal             -- flatMap: fn must return a Signal

describe('Signal#update', () => {
  it('sets value using update function', async () => {
    const count = signal(1);
    count.update(n => n + 1);
    await vi.runAllTimersAsync();
    expect(count.value).toBe(2);

    count.update((n, m) => n + m, 5);
    await vi.runAllTimersAsync();
    expect(count.value).toBe(7);
  });
});

describe("Signal#when", () => {
  it('triggers when value has a defined value', async () => {
    const thing = signal<string | undefined>(undefined);
    const cb = vi.fn();

    thing.when(cb);
    await vi.runAllTimersAsync();
    expect(cb).not.toHaveBeenCalled();

    thing.value = "test";
    await vi.runAllTimersAsync();
    expect(cb).toHaveBeenCalledWith("test");
  });
});

describe("when([[signal, 10], [signal, 20]] cb)", () => {
  it('triggers when things match', async () => {
    const a = signal(0);
    const b = signal(0);
    const cb = vi.fn();

    when([[a, 10], [b, 20]], cb);
    await vi.runAllTimersAsync();
    expect(cb).not.toHaveBeenCalled();

    a.value = 10;
    await vi.runAllTimersAsync();
    expect(cb).not.toHaveBeenCalled();

    b.value = 20;
    await vi.runAllTimersAsync();
    expect(cb).toHaveBeenCalled();
  });
});

describe('Signal#flatMap', () => {
  it('is an applicative', async () => {
    const a = signal(5);
    const result = a.flatMap(x => signal(x * 2));
    expect(result.value).toBe(10);

    a.value = 10;
    await vi.runAllTimersAsync();
    expect(result.value).toBe(20);
  });
});

describe('Signal#ap', () => {
  it('is an applicative', async () => {
    const value = signal(5);
    const fn = signal((x: number) => x * 2);
    const result = value.ap(fn);
    expect(result.value).toBe(10);

    fn.value = (x: number) => x * 3;
    await vi.runAllTimersAsync();
    expect(result.value).toBe(15);
  });
});

describe('Signal methods', () => {
  it('supports map for deriving new signals', async () => {
    const a = signal(5);
    const b = a.map(x => x * 2);
    expect(b.value).toBe(10);

    a.value = 10;
    await vi.runAllTimersAsync();
    expect(b.value).toBe(20);
  });

  it('supports call for applying functions with args', () => {
    const a = signal(5);
    const result = a.call((x, y) => x + y, 3);
    expect(result).toBe(8);
  });
});

describe('Signal additional features', () => {
  vi.useFakeTimers();

  describe('filter', () => {
    it('only updates when predicate is true', async () => {
      const numbers = signal(0);
      const evenNumbers = numbers.filter(n => n % 2 === 0);

      numbers.value = 1;
      await vi.runAllTimersAsync();
      expect(evenNumbers.value).toBe(0);

      numbers.value = 2;
      await vi.runAllTimersAsync();
      expect(evenNumbers.value).toBe(2);
    });
  });

  describe('debounce', () => {
    it('debounces rapid updates', async () => {
      const input = signal('');
      const debounced = input.debounce(100);
      const cb = vi.fn();

      on(debounced, cb);

      input.value = 'h';
      input.value = 'he';
      input.value = 'hel';
      input.value = 'hell';
      input.value = 'hello';

      await vi.advanceTimersByTime(50);
      expect(cb).not.toHaveBeenCalled();

      await vi.advanceTimersByTime(100);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith('hello');
    });
  });

  describe('distinct', () => {
    it('only emits when value actually changes', async () => {
      const value = signal(1);
      const distinct = value.distinct();
      const cb = vi.fn();

      on(distinct, cb);

      value.value = 1;
      value.value = 1;
      value.value = 2;
      value.value = 2;
      await vi.runAllTimersAsync();

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(2);
    });
  });

  describe('withPrevious', () => {
    it('provides access to previous value', async () => {
      const counter = signal(0);
      const withPrev = counter.withPrevious();
      const cb = vi.fn();

      on(withPrev, cb);

      counter.value = 1;
      await vi.runAllTimersAsync();
      expect(cb).toHaveBeenCalledWith({ current: 1, previous: 0 });
    });
  });

  describe('batch', () => {
    it('batches multiple updates into one emission', async () => {
      const counter = signal(0);
      const cb = vi.fn();

      on(counter, cb);

      Signal.batch(() => {
        counter.value = 1;
        counter.value = 2;
        counter.value = 3;
      });

      await vi.runAllTimersAsync();
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(3);
    });
  });

  describe('combine', () => {
    it('combines multiple signals into an object', async () => {
      const firstName = signal('John');
      const lastName = signal('Doe');
      const age = signal(30);

      const person = Signal.combine({
        firstName,
        lastName,
        age
      });

      expect(person.value).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        age: 30
      });

      firstName.value = 'Jane';
      await vi.runAllTimersAsync();

      expect(person.value).toEqual({
        firstName: 'Jane',
        lastName: 'Doe',
        age: 30
      });
    });
  });

  describe.skip('reduce', () => {
    it('accumulates values over time', async () => {
      const events = signal(0);
      const sum = events.reduce((acc, curr) => acc + curr, 0);

      events.value = 1;
      events.value = 2;
      events.value = 3;
      await vi.runAllTimersAsync();

      expect(sum.value).toBe(6);
    });
  });

  describe.skip('throttle', () => {
    it('limits updates to specified interval', async () => {
      const value = signal(0);
      const throttled = value.throttle(100);
      const cb = vi.fn();

      on(throttled, cb);

      value.value = 1;
      value.value = 2;
      value.value = 3;

      await vi.advanceTimersByTime(50);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(1);

      await vi.advanceTimersByTime(100);
      expect(cb).toHaveBeenCalledTimes(2);
      expect(cb).toHaveBeenLastCalledWith(3);
    });
  });
});
