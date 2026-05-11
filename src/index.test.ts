import { describe, test, expect } from 'vitest';
import { createPipe } from './index';

// Helper functions for tests
const add1 = (x: number) => x + 1;
const double = (x: number) => x * 2;
const triple = (x: number) => x * 3;
const numToStr = (x: number) => String(x);
// const upper = (s: string) => s.toUpperCase();
// const trim = (s: string) => s.trim();

describe('Pipe — untyped path', () => {
  test('#01 single step returns function behavior', () => {
    const fn = createPipe('add1').define({ add1 });
    expect(fn(5)).toBe(6);
  });

  test('#02 two-step composition', () => {
    const fn = createPipe('add1', 'double').define({ add1, double });
    expect(fn(5)).toBe(12); // (5 + 1) * 2
  });

  test('#03 three-step composition', () => {
    const fn = createPipe('add1', 'double', 'triple').define({
      add1,
      double,
      triple,
    });
    expect(fn(2)).toBe(18); // ((2 + 1) * 2) * 3 = (3 * 2) * 3 = 18
  });

  test('#04 five-step pipeline', () => {
    const fn = createPipe(
      'add1',
      'double',
      'add1',
      'double',
      'add1',
    ).define({
      add1,
      double,
    });
    // ((((2 + 1) * 2) + 1) * 2) + 1 = ((6 + 1) * 2) + 1 = (14) + 1 = 15
    expect(fn(2)).toBe(15);
  });

  test('#05 first step with multiple arguments', () => {
    const hypot = (a: number, b: number) => Math.hypot(a, b);
    const fn = createPipe('hypot', 'double').define({
      hypot,
      double,
    });
    expect(fn(3, 4)).toBe(10); // hypot(3,4) = 5, double(5) = 10
  });

  test('#06 all-sync pipeline returns non-promise', () => {
    const fn = createPipe('add1', 'double')
      .define({ add1, double: x => x * 2 })
      .define({
        double: x => x * 3,
      });
    const result = fn(1);
    expect(result).toBe(6);
    expect(
      typeof result === 'object' && result !== null && 'then' in result,
    ).toBe(false);
  });

  test('#07 async step makes pipeline async', async () => {
    const asyncAdd1 = async (x: number) => x + 1;
    const fn = createPipe('asyncAdd1', 'double').define({
      asyncAdd1,
      double,
    });
    const result = await fn(5);
    expect(result).toBe(12); // (5 + 1) * 2
  });
});

describe('Pipe — partial overrides (untyped)', () => {
  test('#11 partial define() creates new pipeline', () => {
    const fn = createPipe('add1', 'double').define({ add1, double });
    expect(fn(5)).toBe(12); // (5 + 1) * 2

    const fn2 = fn.define({ double: x => x * 3 });
    expect(fn2(5)).toBe(18); // (5 + 1) * 3
  });

  test('#12 partial override only affects specified key', () => {
    const fn = createPipe('add1', 'double', 'triple').define({
      add1,
      double,
      triple,
    });
    expect(fn(2)).toBe(18); // ((2 + 1) * 2) * 3 = 18

    const fn2 = fn.define({ double: (x: number) => x * 10 });
    expect(fn2(2)).toBe(90); // ((2 + 1) * 10) * 3 = 90
  });

  test('#13 chained partial overrides', () => {
    const fn = createPipe('add1', 'double').define({ add1, double });
    expect(fn(2)).toBe(6); // (2 + 1) * 2

    const fn2 = fn.define({ add1: (x: number) => x + 10 });
    expect(fn2(2)).toBe(24); // (2 + 10) * 2

    const fn3 = fn2.define({ double: (x: number) => x * 5 });
    expect(fn3(2)).toBe(60); // (2 + 10) * 5
  });
});

describe('Pipe — error cases', () => {
  test('#15 missing step key throws', () => {
    expect(() => {
      createPipe('add1', 'double').define({ add1 } as any);
    }).toThrow('Step "double" is not implemented');
  });

  test('#16 zero steps throws', () => {
    expect(() => {
      createPipe().define({});
    }).toThrow('createPipe requires at least one step');
  });
});

describe('Pipe — order enforcement', () => {
  test('#17 execution order follows createPipe, not object key order', () => {
    const fn = createPipe('double', 'add1').define({
      add1, // defined first in object
      double, // defined second in object
    });
    // But createPipe order is: double, then add1
    expect(fn(5)).toBe(11); // double(5) = 10, then add1(10) = 11
    // If it was add1 then double: add1(5) = 6, double(6) = 12
  });
});

describe('Pipe — type-level assertions', () => {
  test('#18 untyped define() creates callable function', () => {
    const fn = createPipe('add1', 'numToStr').define({ add1, numToStr });
    expect(typeof fn).toBe('function');
    expect(fn(5)).toBe('6');
  });

  test('#19 Pipeline has .define() method', () => {
    const fn = createPipe('add1', 'double').define({ add1, double });
    expect(typeof fn.define).toBe('function');
    const fn2 = fn.define({ double: (x: number) => x * 5 });
    expect(fn2(2)).toBe(15); // (2 + 1) * 5
  });
});
