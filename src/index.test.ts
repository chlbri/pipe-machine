import { describe, expect, test } from "vitest";
import { assign, createPipe } from "./index";

type Ctx = { value: number };
type Ctx2 = { value: number; name: string };

describe("createPipe", () => {
  describe("#01 => entry-only pipeline", () => {
    test("#01 => entry action produces context from params", () => {
      const fn = createPipe("init")
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: { init: (x) => ({ value: x }) },
          guards: {},
          delays: {},
        });

      expect(fn(5)).toStrictEqual({ value: 5 });
    });

    test("#02 => entry with multiple params", () => {
      const fn = createPipe("init")
        .type<{ params: [number, string]; context: Ctx2 }>()
        .define({
          actions: {
            init: (x, name) => ({ value: x, name }),
          },
          guards: {},
          delays: {},
        });

      expect(fn(3, "hi")).toStrictEqual({ value: 3, name: "hi" });
    });
  });

  describe("#02 => plain Describer config (direct action)", () => {
    test("#01 => single plain action after entry", () => {
      const fn = createPipe("init", "increment")
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: (x) => ({ value: x }),
            increment: (ctx) => ({ value: ctx.value + 1 }),
          },
          guards: {},
          delays: {},
        });

      expect(fn(4)).toStrictEqual({ value: 5 });
    });

    test("#02 => chained plain actions", () => {
      const fn = createPipe("init", "double", "increment")
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: (x) => ({ value: x }),
            double: (ctx) => ({ value: ctx.value * 2 }),
            increment: (ctx) => ({ value: ctx.value + 1 }),
          },
          guards: {},
          delays: {},
        });

      expect(fn(3)).toStrictEqual({ value: 7 }); // 3 * 2 + 1
    });
  });

  describe("#03 => Condition[] — conditional branches", () => {
    test("#01 => first matching condition is executed", () => {
      const fn = createPipe("init", [
        { cond: "isPositive", fn: "increment" },
        { cond: "isNegative", fn: "decrement" },
      ])
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: (x) => ({ value: x }),
            increment: (ctx) => ({ value: ctx.value + 1 }),
            decrement: (ctx) => ({ value: ctx.value - 1 }),
          },
          guards: {
            isPositive: (ctx) => ctx.value > 0,
            isNegative: (ctx) => ctx.value < 0,
          },
          delays: {},
        });

      expect(fn(5)).toStrictEqual({ value: 6 });
      expect(fn(-3)).toStrictEqual({ value: -4 });
    });

    test("#02 => no condition matches returns context unchanged", () => {
      const fn = createPipe("init", [{ cond: "isPositive", fn: "increment" }])
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: (x) => ({ value: x }),
            increment: (ctx) => ({ value: ctx.value + 1 }),
          },
          guards: { isPositive: (ctx) => ctx.value > 0 },
          delays: {},
        });

      expect(fn(0)).toStrictEqual({ value: 0 });
    });

    test("#03 => boolean guard literal", () => {
      const fn = createPipe("init", [{ cond: "always", fn: "increment" }])
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: (x) => ({ value: x }),
            increment: (ctx) => ({ value: ctx.value + 1 }),
          },
          guards: { always: true },
          delays: {},
        });

      expect(fn(10)).toStrictEqual({ value: 11 });
    });
  });

  describe("#04 => and/or guard composition", () => {
    test("#01 => and guard: all must pass", () => {
      const fn = createPipe("init", [
        {
          cond: { and: ["isPositive", "isSmall"] },
          fn: "increment",
        },
      ])
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: (x) => ({ value: x }),
            increment: (ctx) => ({ value: ctx.value + 1 }),
          },
          guards: {
            isPositive: (ctx) => ctx.value > 0,
            isSmall: (ctx) => ctx.value < 10,
          },
          delays: {},
        });

      expect(fn(5)).toStrictEqual({ value: 6 }); // both pass
      expect(fn(15)).toStrictEqual({ value: 15 }); // isSmall fails → no match
      expect(fn(-1)).toStrictEqual({ value: -1 }); // isPositive fails → no match
    });

    test("#02 => or guard: at least one must pass", () => {
      const fn = createPipe("init", [
        {
          cond: { or: ["isZero", "isLarge"] },
          fn: "increment",
        },
      ])
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: (x) => ({ value: x }),
            increment: (ctx) => ({ value: ctx.value + 1 }),
          },
          guards: {
            isZero: (ctx) => ctx.value === 0,
            isLarge: (ctx) => ctx.value >= 100,
          },
          delays: {},
        });

      expect(fn(0)).toStrictEqual({ value: 1 }); // isZero passes
      expect(fn(100)).toStrictEqual({ value: 101 }); // isLarge passes
      expect(fn(5)).toStrictEqual({ value: 5 }); // neither → no match
    });
  });

  describe("#05 => Delayed config", () => {
    test("#01 => delayed fn is executed (synchronously)", () => {
      const fn = createPipe("init", {
        delay: "shortDelay",
        fn: "increment",
      })
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: (x) => ({ value: x }),
            increment: (ctx) => ({ value: ctx.value + 1 }),
          },
          guards: {},
          delays: { shortDelay: 200 },
        });

      expect(fn(7)).toStrictEqual({ value: 8 });
    });
  });

  describe("#06 => assign helper", () => {
    test("#01 => assign with path and action", () => {
      const addOne = assign("value", (ctx: Ctx) => ctx.value + 1);
      const ctx: Ctx = { value: 4 };
      expect(addOne(ctx)).toStrictEqual({ value: 5 });
    });

    test("#02 => assign with static value via action", () => {
      const setTen = assign("value", () => 10);
      const ctx: Ctx = { value: 4 };
      expect(setTen(ctx)).toStrictEqual({ value: 10 });
    });

    test("#03 => assign inside pipeline action", () => {
      const fn = createPipe("init", "bump")
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: (x) => ({ value: x }),
            bump: assign("value", (ctx) => ctx.value + 100),
          },
          guards: {},
          delays: {},
        });

      expect(fn(1)).toStrictEqual({ value: 101 });
    });
  });

  describe("#07 => Describer objects (name + description)", () => {
    test("#01 => object describer as first arg", () => {
      const fn = createPipe({
        name: "init",
        description: "Initialize context",
      })
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: { init: (x) => ({ value: x }) },
          guards: {},
          delays: {},
        });

      expect(fn(9)).toStrictEqual({ value: 9 });
    });
  });
});
