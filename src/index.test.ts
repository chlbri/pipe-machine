import { describe, expect, test } from 'vitest';
import { createPipe } from './index';
import { type as typings } from '@bemedev/typings';
import * as v from 'valibot';
import * as z from 'zod';
import { tap } from '@bemedev/pipe/extensions';

const add1 = (x: number) => x + 1;
const double = (x: number) => x * 2;
const triple = (x: number) => x * 3;
const numToStr = (x: number) => String(x);

describe('Pipe', () => {
  describe('#01 => Pipe — fluent builder', () => {
    test('#01 => single step returns function behavior', () => {
      const fn = createPipe('add1')
        .type(
          typings(({ tuple }) => ({
            add1: {
              parameters: tuple('number'),
              return: 'number',
            },
          })),
        )
        .define({ add1 });

      expect(fn(5)).toBe(6);

      const fn2 = fn.define({ add1: (x: number) => x + 10 });
      expect(fn2(5)).toBe(15);
    });

    test('#02 => two-step composition', () => {
      const fn = createPipe('add1', 'double')
        .type(
          v.object({
            add1: v.object({
              parameters: v.tuple([v.number()]),
              return: v.number(),
            }),
            double: v.number(),
          }),
        )
        .define({ add1, double });
      expect(fn(5)).toBe(12); // (5 + 1) * 2
    });

    test('#03 => three-step composition', () => {
      const fn = createPipe('add1', 'double', 'triple')
        .type<{
          add1: { parameters: [number]; return: number };
        }>(
          typings(({ tuple }) => ({
            add1: {
              parameters: tuple('number'),
              return: 'number',
            },
          })),
        )
        .define({ add1, double: x => x * 2, triple });
      expect(fn(2)).toBe(18); // ((2 + 1) * 2) * 3
    });

    test('#04 => five-step pipeline with duplicate keys', () => {
      const fn = createPipe('add1', 'double', 'add1', 'double', 'add1')
        .type(
          z.object({
            add1: z.object({
              parameters: z.tuple([z.number()]),
              return: z.number(),
            }),
          }),
        )
        .define({ add1, double });
      // ((((2 + 1) * 2) + 1) * 2) + 1 = 15
      expect(fn(2)).toBe(15);
    });

    test('#05 => first step with multiple arguments', () => {
      const hypot = (a: number, b: number) => Math.hypot(a, b);
      const fn = createPipe('hypot', 'double')
        .type<{
          hypot: { parameters: [number, number]; return: number };
          double: number;
        }>()
        .define({ hypot, double });
      expect(fn(3, 4)).toBe(10); // hypot(3,4) = 5, double(5) = 10
    });

    test('#06 => all-sync pipeline returns non-promise', () => {
      const fn = createPipe('add1', 'double')
        .type<{
          add1: { parameters: [number]; return: number };
          double: number;
        }>()
        .define({ add1, double });
      const result = fn(1);
      expect(result).toBe(4);
      expect(
        typeof result === 'object' && result !== null && 'then' in result,
      ).toBe(false);
    });

    test('#07 => async step makes pipeline async', async () => {
      const asyncAdd1 = async (x: number) => x + 1;
      const fn = createPipe('asyncAdd1', 'double')
        .type<{
          asyncAdd1: { parameters: [number]; return: Promise<number> };
          double: number;
        }>()
        .define({ asyncAdd1, double });
      const result = await fn(5);
      expect(result).toBe(12); // (5 + 1) * 2
    });
  });

  describe('#02 => Pipe — identity typing (unspecified keys)', () => {
    test('#01 => unspecified key defaults to identity typing', () => {
      const fn = createPipe('add1', 'passthrough')
        .type<{ add1: { parameters: [number]; return: number } }>()
        .define({ add1, passthrough: (x: number) => x });
      expect(fn(5)).toBe(6);
    });

    test('#02 => unspecified middle key passes value through', () => {
      const fn = createPipe('add1', 'passthrough', 'double')
        .type<{
          add1: { parameters: [number]; return: number };
          double: number;
        }>()
        .define({ add1, passthrough: (x: number) => x, double });
      expect(fn(2)).toBe(6); // (2 + 1) * 2
    });
  });

  describe('#03 => Pipe — partial overrides (fluent)', () => {
    test('#01 => partial define() creates new pipeline', () => {
      const fn = createPipe('add1', 'double')
        .type<{
          add1: { parameters: [number]; return: number };
          double: number;
        }>()
        .define({ add1, double });
      expect(fn(5)).toBe(12); // (5 + 1) * 2

      const fn2 = fn.define({ double: (x: number) => x * 3 });
      expect(fn2(5)).toBe(18); // (5 + 1) * 3
    });

    test('#02 => partial override only affects specified key', () => {
      const fn = createPipe('add1', 'double', 'triple')
        .type<{
          add1: { parameters: [number]; return: number };
          // double: number;
          triple: number;
        }>()
        .define({ add1, double: x => x * 2, triple });
      expect(fn(2)).toBe(18); // ((2 + 1) * 2) * 3

      const fn2 = fn.define({ double: x => x * 10 });
      expect(fn2(2)).toBe(90); // ((2 + 1) * 10) * 3
    });

    test('#03 => chained partial overrides', () => {
      const fn = createPipe('add1', 'double')
        .type<{
          add1: { parameters: [number]; return: number };
          double: number;
        }>()
        .define({ add1, double });
      expect(fn(2)).toBe(6); // (2 + 1) * 2

      const fn2 = fn.define({ add1: (x: number) => x + 10 });
      expect(fn2(2)).toBe(24); // (2 + 10) * 2

      const fn3 = fn2.define({ double: (x: number) => x * 5 });
      expect(fn3(2)).toBe(60); // (2 + 10) * 5
    });
  });

  test('#04 => Pipe — error cases', () => {
    expect(() => {
      (createPipe as any)();
    }).toThrow('createPipe requires at least one step');
  });

  test('#05 => Pipe — order enforcement', () => {
    const fn = createPipe('double', 'add1')
      .type<{
        double: { parameters: [number]; return: number };
        add1: number;
      }>()
      .define({ double, add1 });
    // createPipe order is: double, then add1
    expect(fn(5)).toBe(11); // double(5) = 10, add1(10) = 11
  });

  describe('#06 => Pipe — type-level assertions', () => {
    test('#01 => fluent chain creates callable function', () => {
      const fn = createPipe('add1', 'numToStr')
        .type<{
          add1: { parameters: [number]; return: number };
          numToStr: string;
        }>()
        .define({ add1, numToStr });
      expect(typeof fn).toBe('function');
      expect(fn(5)).toBe('6');
    });

    test('#02 => fluent chain creates callable function, multiple types', () => {
      const fn = createPipe(
        'add1',
        'tap',
        'numToStr',
        'tap',
        'length',
        'tap',
        'isEven',
        'tap',
      )
        .type(
          typings(({ tuple }) => ({
            add1: {
              parameters: tuple('number'),
              return: 'number',
            },
            numToStr: 'string',
            length: 'number',
            isEven: 'boolean',
          })),
        )
        .define({
          add1,
          numToStr,
          length: s => s.length,
          isEven: n => n % 2 === 0,
          tap: tap(x => console.log(x)),
        });

      vi.spyOn(console, 'log').mockImplementation(() => {}); // Suppress console output during test
      expect(typeof fn).toBe('function');
      expect(fn(5)).toBe(false);
      expect(console.log).toHaveBeenNthCalledWith(1, 6);
      expect(console.log).toHaveBeenNthCalledWith(2, '6');
      expect(console.log).toHaveBeenNthCalledWith(3, 1);
      expect(console.log).toHaveBeenNthCalledWith(4, false);
    });

    test('#03 => Pipeline has .define() method', () => {
      const fn = createPipe('add1', 'double')
        .type<{
          add1: { parameters: [number]; return: number };
          double: number;
        }>()
        .define({ add1, double });

      expect(typeof fn.define).toBe('function');
      const fn2 = fn.define({ double: (x: number) => x * 5 });
      expect(fn2(2)).toBe(15); // (2 + 1) * 5
    });
  });
});
