import { assign, createPipe } from './index';
import { type as typings } from '@bemedev/typings';
import * as v from 'valibot';
import * as z from 'zod';

type Ctx = { value: number };

describe('createPipe', () => {
  describe('#01 => entry-only pipeline', () => {
    test('#01 => entry action produces context from params', () => {
      const fn = createPipe('init')
        .type(
          typings(({ tuple }) => ({
            params: tuple('number'),
            context: { value: 'number' },
          })),
        )
        .define({
          actions: { init: x => ({ value: x }) },
        });

      expect(fn(5)).toStrictEqual({ value: 5 });
    });

    test('#02 => entry with multiple params', () => {
      const fn = createPipe('init')
        .type(
          v.object({
            params: v.tuple([v.number(), v.string()]),
            context: v.object({ value: v.number(), name: v.string() }),
          }),
        )
        .define({
          actions: {
            init: (x, name) => ({ value: x, name }),
          },
        });

      expect(fn(3, 'hi')).toStrictEqual({ value: 3, name: 'hi' });
    });
  });

  describe('#02 => plain Describer config (direct action)', () => {
    test('#01 => single plain action after entry', () => {
      const fn = createPipe('init', 'increment')
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: x => ({ value: x }),
            increment: ctx => ({ value: ctx.value + 1 }),
          },
        });

      expect(fn(4)).toStrictEqual({ value: 5 });
    });

    test('#02 => chained plain actions', () => {
      const fn = createPipe('init', 'double', 'increment')
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: x => ({ value: x }),
            double: ctx => ({ value: ctx.value * 2 }),
            increment: ctx => ({ value: ctx.value + 1 }),
          },
        });

      expect(fn(3)).toStrictEqual({ value: 7 }); // 3 * 2 + 1
    });
  });

  describe('#03 => Condition[] — conditional branches', () => {
    test('#01 => first matching condition is executed', () => {
      const fn = createPipe('init', [
        { guard: 'isPositive', fn: 'increment' },
        {
          guard: {
            name: 'isNegative',
            description: 'Description of isNegative fn',
          },
          fn: 'decrement',
        },
      ])
        .type<{ params: [number]; context: Ctx }>(
          typings(({ tuple }) => ({
            params: tuple('number'),
            context: { value: 'number' },
          })),
        )
        .define({
          actions: {
            init: x => ({ value: x }),
            increment: ctx => ({ value: ctx.value + 1 }),
            decrement: ctx => ({ value: ctx.value - 1 }),
          },
          guards: {
            isPositive: ctx => ctx.value > 0,
            isNegative: ctx => ctx.value < 0,
          },
        });

      expect(fn(5)).toStrictEqual({ value: 6 });
      expect(fn(-3)).toStrictEqual({ value: -4 });
    });

    test('#02 => no condition matches returns context unchanged', () => {
      const fn = createPipe('init', [
        { guard: 'isPositive', fn: 'increment' },
      ])
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: x => ({ value: x }),
            increment: ctx => ({ value: ctx.value + 1 }),
          },
          guards: { isPositive: ctx => ctx.value > 0 },
        });

      expect(fn(0)).toStrictEqual({ value: 0 });
    });

    test('#03 => boolean guard literal', () => {
      const fn = createPipe('init', [{ guard: 'always', fn: 'increment' }])
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: x => ({ value: x }),
            increment: ctx => ({ value: ctx.value + 1 }),
          },
          guards: { always: true },
        });

      expect(fn(10)).toStrictEqual({ value: 11 });
    });

    test('#04 => boolean guard literal #2', () => {
      const fn = createPipe('init', [
        {
          guard: { name: 'always', description: 'Always true' },
          fn: 'increment',
        },
      ])
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: x => ({ value: x }),
            increment: ctx => ({ value: ctx.value + 1 }),
          },
          guards: { always: true },
        });

      expect(fn(10)).toStrictEqual({ value: 11 });
    });
  });

  describe('#04 => and/or guard composition', () => {
    test('#01 => and guard: all must pass', () => {
      const fn = createPipe('init', [
        {
          guard: { and: ['isPositive', 'isSmall'] },
          fn: 'increment',
        },
      ])
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: x => ({ value: x }),
            increment: ctx => ({ value: ctx.value + 1 }),
          },
          guards: {
            isPositive: ctx => ctx.value > 0,
            isSmall: ctx => ctx.value < 10,
          },
        });

      expect(fn(5)).toStrictEqual({ value: 6 }); // both pass
      expect(fn(15)).toStrictEqual({ value: 15 }); // isSmall fails → no match
      expect(fn(-1)).toStrictEqual({ value: -1 }); // isPositive fails → no match
    });

    test('#02 => or guard: at least one must pass', () => {
      const fn = createPipe('init', [
        {
          guard: { or: ['isZero', 'isLarge'] },
          fn: 'increment',
        },
      ])
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: x => ({ value: x }),
            increment: ctx => ({ value: ctx.value + 1 }),
          },
          guards: {
            isZero: ctx => ctx.value === 0,
            isLarge: ctx => ctx.value >= 100,
          },
        });

      expect(fn(0)).toStrictEqual({ value: 1 }); // isZero passes
      expect(fn(100)).toStrictEqual({ value: 101 }); // isLarge passes
      expect(fn(5)).toStrictEqual({ value: 5 }); // neither → no match
    });
  });

  test('#05 => Delayed config', async () => {
    const fn = createPipe('init', {
      delay: 'shortDelay',
      fn: 'increment',
    })
      .type<{ params: [number]; context: Ctx }>()
      .define({
        actions: {
          init: x => ({ value: x }),
          increment: ctx => ({ value: ctx.value + 1 }),
        },
        delays: { shortDelay: ctx => ctx.value }, // delay in ms based on context value
      });

    expect(await fn(7)).toStrictEqual({ value: 8 });
  });

  describe('#06 => assign helper', () => {
    test('#01 => assign with path and action', () => {
      const addOne = assign('value', (ctx: Ctx) => ctx.value + 1);
      const ctx: Ctx = { value: 4 };
      expect(addOne(ctx)).toStrictEqual({ value: 5 });
    });

    test('#02 => assign inside pipeline action', () => {
      const fn = createPipe('init', 'bump')
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: x => ({ value: x }),
            bump: assign('value', ctx => ctx.value + 100),
          },
        });

      expect(fn(1)).toStrictEqual({ value: 101 });
    });

    test('#03 => action can be redefined in pipeline', () => {
      const fn = createPipe('init', 'bump')
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: x => ({ value: x }),
            bump: assign('value', ctx => ctx.value + 100),
          },
        });

      const fn2 = fn.define({
        actions: {
          bump: assign('value', ctx => ctx.value * 2),
        },
      });

      expect(fn2(1)).toStrictEqual({ value: 2 });
    });
  });

  describe('#07 => Describer objects (name + description)', () => {
    const fn = createPipe({
      name: 'init',
      description: 'Initialize context',
    })
      .type<{ params: [number]; context: Ctx }>()
      .define({
        actions: { init: x => ({ value: x }) },
      });

    expect(fn(9)).toStrictEqual({ value: 9 });
  });

  describe('#08 => assign with level-3 nested paths', () => {
    type Deep3Ctx = { user: { profile: { score: number } } };

    test('#01 => assign via dot path at depth 3', () => {
      const bump = assign(
        'user.profile.score',
        (ctx: Deep3Ctx) => ctx.user.profile.score + 1,
      );
      const ctx: Deep3Ctx = { user: { profile: { score: 10 } } };
      expect(bump(ctx)).toStrictEqual({
        user: { profile: { score: 11 } },
      });
    });

    test('#02 => assign via dot path preserves sibling keys at every level', () => {
      type RichCtx = {
        user: {
          profile: { score: number; rank: string };
          active: boolean;
        };
      };
      const bump = assign(
        'user.profile.score',
        (ctx: RichCtx) => ctx.user.profile.score * 2,
      );
      const ctx = {
        user: { profile: { score: 5, rank: 'gold' }, active: true },
      };
      expect(bump(ctx)).toStrictEqual({
        user: { profile: { score: 10, rank: 'gold' }, active: true },
      });
    });

    test('#03 => assign via dot path inside pipeline action at depth 3', () => {
      const fn = createPipe('init', 'levelUp')
        .type<{ params: [number]; context: Deep3Ctx }>()
        .define({
          actions: {
            init: x => ({ user: { profile: { score: x } } }),
            levelUp: assign(
              'user.profile.score',
              ctx => ctx.user.profile.score + 100,
            ),
          },
        });

      expect(fn(7)).toStrictEqual({ user: { profile: { score: 107 } } });
    });
  });

  describe('#09 => guard as array of guards (multi-guard condition, lines 106-107)', () => {
    test('#01 => array guard with all guards passing executes action', () => {
      const fn = createPipe('init', [
        { guard: ['isPositive', 'isSmall'], fn: 'increment' },
      ])
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: x => ({ value: x }),
            increment: ctx => ({ value: ctx.value + 1 }),
          },
          guards: {
            isPositive: ctx => ctx.value > 0,
            isSmall: ctx => ctx.value < 10,
          },
        });

      expect(fn(5)).toStrictEqual({ value: 6 }); // both pass
    });

    test('#02 => array guard with first guard failing skips action', () => {
      const fn = createPipe('init', [
        { guard: ['isPositive', 'isSmall'], fn: 'increment' },
      ])
        .type(
          z.object({
            params: z.tuple([z.number()]),
            context: z.object({ value: z.number() }),
          }),
        )
        .define({
          actions: {
            init: x => ({ value: x }),
            increment: ctx => ({ value: ctx.value + 1 }),
          },
          guards: {
            isPositive: ctx => ctx.value > 0,
            isSmall: ctx => ctx.value < 10,
          },
        });

      expect(fn(-3)).toStrictEqual({ value: -3 }); // isPositive fails
    });

    test('#03 => array guard with second guard failing skips action', () => {
      const fn = createPipe('init', [
        { guard: ['isPositive', 'isSmall'], fn: 'increment' },
      ])
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: x => ({ value: x }),
            increment: ({ value }) => ({ value: value + 1 }),
          },
          guards: {
            isPositive: ({ value }) => value > 0,
            isSmall: ({ value }) => value < 10,
          },
        });

      expect(fn(15)).toStrictEqual({ value: 15 }); // isSmall fails
    });

    test('#04 => array guard with three guards, all passing', () => {
      const fn = createPipe('init', [
        { guard: ['isPositive', 'isSmall', 'isOdd'], fn: 'increment' },
      ])
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: x => ({ value: x }),
            increment: ctx => ({ value: ctx.value + 1 }),
          },
          guards: {
            isPositive: ({ value }) => value > 0,
            isSmall: ({ value }) => value < 10,
            isOdd: ({ value }) => value % 2 !== 0,
          },
        });

      expect(fn(3)).toStrictEqual({ value: 4 }); // all pass
      expect(fn(4)).toStrictEqual({ value: 4 }); // isOdd fails
    });
  });

  describe('#10 => async actions', () => {
    test('#01 => single async action returns Promise<Context>', async () => {
      const fn = createPipe('init', 'increment')
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: async x => ({ value: x }),
            increment: ctx => ({ value: ctx.value + 1 }),
          },
        });

      expect(await fn(4)).toStrictEqual({ value: 5 });
    });

    test('#02 => all async actions', async () => {
      const fn = createPipe('init', 'double', 'increment')
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: async x => ({ value: x }),
            double: async ctx => ({ value: ctx.value * 2 }),
            increment: async ctx => ({ value: ctx.value + 1 }),
          },
        });

      expect(await fn(3)).toStrictEqual({ value: 7 }); // 3 * 2 + 1
    });

    describe('#03 => sync pipeline result is not a Promise', () => {
      const fn = createPipe('init')
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: { init: x => ({ value: x }) },
        });

      const result = fn(5);

      test('#01 => result is correct', () =>
        expect(result).toStrictEqual({ value: 5 }));
      test('#02 => result is not a Promise', () =>
        expect(result).not.toBeInstanceOf(Promise));
    });

    describe('#04 => async action with conditions', () => {
      const fn = createPipe('init', [
        { guard: 'isPositive', fn: 'increment' },
      ])
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: async x => ({ value: x }),
            increment: async ctx => ({ value: ctx.value + 1 }),
          },
          guards: { isPositive: ctx => ctx.value > 0 },
        });

      test('#01 => positive value increments', async () => {
        expect(await fn(5)).toStrictEqual({ value: 6 });
      });

      test('#02 => negative value unchanged', async () => {
        expect(await fn(-1)).toStrictEqual({ value: -1 });
      });

      test('#03 => action can be redefined to +10', async () => {
        const fn2 = fn.define({
          actions: {
            increment: ctx => ({ value: ctx.value + 10 }),
          },
        });

        expect(await fn2(5)).toStrictEqual({ value: 15 });
      });

      test('#04 => redefined action can be redefined to +20', async () => {
        const fn2 = fn.define({
          actions: {
            increment: ctx => ({ value: ctx.value + 10 }),
          },
        });

        const fn3 = fn2.define({
          actions: {
            increment: ctx => ({ value: ctx.value + 20 }),
          },
        });

        expect(await fn3(5)).toStrictEqual({ value: 25 });
      });

      test('#05 => action can be redefined to +15', async () => {
        const fn4 = fn.define({
          actions: {
            increment: ctx => ({ value: ctx.value + 15 }),
          },
        });

        expect(await fn4(5)).toStrictEqual({ value: 20 });
      });
    });
  });

  describe('#11 => build method', () => {
    test('#01 => sync pipeline: build extracts selected value', () => {
      const fn = createPipe('init', 'increment')
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: x => ({ value: x }),
            increment: ctx => ({ value: ctx.value + 1 }),
          },
        })
        .build(ctx => ctx.value);

      expect(fn(4)).toStrictEqual(5);
      expect(fn(4)).not.toBeInstanceOf(Promise);
    });

    test('#02 => async pipeline: build returns Promise of selected value', async () => {
      const fn = createPipe('init', 'increment')
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: async x => ({ value: x }),
            increment: ctx => ({ value: ctx.value + 1 }),
          },
        })
        .build(ctx => ctx.value);

      expect(await fn(4)).toStrictEqual(5);
    });

    test('#03 => delayed pipeline: build returns Promise of selected value', async () => {
      const fn = createPipe('init', { delay: 'd', fn: 'increment' })
        .type<{ params: [number]; context: Ctx }>()
        .define({
          actions: {
            init: x => ({ value: x }),
            increment: ctx => ({ value: ctx.value + 1 }),
          },
          delays: { d: 10 },
        })
        .build(ctx => ctx.value);

      expect(await fn(3)).toStrictEqual(4);
    });
  });
});
