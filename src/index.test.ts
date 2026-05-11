import { Pipe } from './pipe';
import type { Describer, StepRef } from './types';

// ── helpers ──────────────────────────────────────────────────────────────────

const add1 = (x: number) => x + 1;
const double = (x: number) => x * 2;
const square = (x: number) => x ** 2;
const numToStr = (x: number) => x.toString();
const strLen = (s: string) => s.length;
const isPositive = (x: number) => x > 0;
const trim = (s: string) => s.trim();
const upper = (s: string) => s.toUpperCase();
const wrapBrackets = (s: string) => `[${s}]`;

// ── Pipe.define (static) ─────────────────────────────────────────────────────

test('#01 => Pipe.define creates a Pipe instance', () => {
  const m = Pipe.define('add1', add1);
  expect(m).toBeInstanceOf(Pipe);
});

test('#02 => single-step pipe returns the original function', () => {
  const m = Pipe.define('add1', add1);
  const fn = m.pipe('add1');
  expect(fn(4)).toBe(5);
});

test('#03 => two-step pipe composes correctly', () => {
  const m = Pipe.define('add1', add1).define('double', double);
  const fn = m.pipe('add1', 'double');
  expect(fn(3)).toBe(8); // (3+1)*2
});

test('#04 => three-step pipe composes correctly', () => {
  const m = Pipe.define('add1', add1)
    .define('double', double)
    .define('square', square);
  const fn = m.pipe('add1', 'double', 'square');
  expect(fn(2)).toBe(36); // ((2+1)*2)^2
});

test('#05 => step referenced by Describer object', () => {
  const m = Pipe.define('trim', trim).define('upper', upper);
  const desc: Describer<'upper'> = {
    name: 'upper',
    description: 'Uppercase the string',
  };
  const fn = m.pipe(
    { name: 'trim', description: 'Trim whitespace' },
    desc,
  );
  expect(fn('  hello  ')).toBe('HELLO');
});

test('#06 => mixed string and Describer references', () => {
  const m = Pipe.define('trim', trim)
    .define('upper', upper)
    .define('wrap', wrapBrackets);
  const fn = m.pipe(
    'trim',
    { name: 'upper', description: 'uppercase' },
    'wrap',
  );
  expect(fn('  world  ')).toBe('[WORLD]');
});

// ── Pipe.type (static) ───────────────────────────────────────────────────────

test('#07 => Pipe.type declares a step without implementation', () => {
  const m = Pipe.type<(x: number) => string>()('numToStr').impl(
    'numToStr',
    numToStr,
  );
  const fn = m.pipe('numToStr');
  expect(fn(42)).toBe('42');
});

test('#08 => type + define chain works together', () => {
  const m = Pipe.type<(x: number) => string>()('numToStr')
    .define('double', double)
    .impl('numToStr', numToStr);
  // double → numToStr
  const fn = m.pipe('double', 'numToStr');
  expect(fn(5)).toBe('10');
});

// ── instance .type() ─────────────────────────────────────────────────────────

test('#09 => instance type() with subsequent impl()', () => {
  const m = Pipe.define('add1', add1)
    .type<(x: number) => boolean>()('isPositive')
    .impl('isPositive', isPositive);
  const fn = m.pipe('add1', 'isPositive');
  expect(fn(-1)).toBe(false);
  expect(fn(0)).toBe(true);
});

// ── async steps ──────────────────────────────────────────────────────────────

test('#10 => async step makes pipeline return a Promise', async () => {
  const asyncDouble = async (x: number) => x * 2;
  const m = Pipe.define('asyncDouble', asyncDouble).define(
    'numToStr',
    numToStr,
  );
  const fn = m.pipe('asyncDouble', 'numToStr');
  expect(await fn(3)).toBe('6');
});

test('#11 => all-sync pipeline returns a plain value (not a Promise)', () => {
  const m = Pipe.define('add1', add1).define('double', double);
  const fn = m.pipe('add1', 'double');
  const result = fn(1);
  expect(result).toBe(4);
  expect(result).not.toBeInstanceOf(Promise);
});

// ── .notTyped() ──────────────────────────────────────────────────────────────

test('#12 => notTyped composes more than 10 steps', () => {
  const inc = (x: number) => x + 1;
  let m = Pipe.define('s0', inc);
  for (let i = 1; i <= 11; i++) {
    m = m.define(`s${i}`, inc) as typeof m;
  }
  const steps: StepRef[] = Array.from({ length: 12 }, (_, i) => `s${i}`);
  const fn = m.notTyped(...steps);
  expect(fn(0)).toBe(12);
});

// ── error handling ───────────────────────────────────────────────────────────

test('#13 => pipe() throws when a step has no implementation', () => {
  const m = Pipe.type<(x: number) => string>()('numToStr');
  expect(() => m.pipe('numToStr')).toThrow(
    '"numToStr" is not implemented',
  );
});

test('#14 => pipe() throws when no steps are provided', () => {
  const m = Pipe.define('add1', add1);
  expect(() => (m.pipe as (...args: StepRef[]) => unknown)()).toThrow(
    'at least one step',
  );
});

// ── multi-argument first step ─────────────────────────────────────────────────

test('#15 => first step can accept multiple arguments', () => {
  const hypot = (a: number, b: number) => Math.sqrt(a ** 2 + b ** 2);
  const m = Pipe.define('hypot', hypot).define('round', Math.round);
  const fn = m.pipe('hypot', 'round');
  expect(fn(3, 4)).toBe(5);
});

// ── chained define ───────────────────────────────────────────────────────────

test('#16 => five-step pipeline', () => {
  const m = Pipe.define('trim', trim)
    .define('upper', upper)
    .define('strLen', strLen)
    .define('add1', add1)
    .define('double', double);
  const fn = m.pipe('trim', 'upper', 'strLen', 'add1', 'double');
  expect(fn('  hi  ')).toBe(6); // trim→'hi'(2), upper→'HI'(2), len→2, +1→3, *2→6
});

// ── type-safety: ValidNext ────────────────────────────────────────────────────

test('#17 => Describer step in the middle of a chain', () => {
  const m = Pipe.define('add1', add1)
    .define('numToStr', numToStr)
    .define('strLen', strLen);
  const fn = m.pipe(
    'add1',
    { name: 'numToStr', description: 'to string' },
    'strLen',
  );
  expect(fn(9)).toBe(2); // 9+1=10, '10', len=2
});

test('#18 => all Describer steps', () => {
  const m = Pipe.define('add1', add1).define('double', double);
  const fn = m.pipe(
    { name: 'add1', description: 'Add one' },
    { name: 'double', description: 'Double' },
  );
  expect(fn(4)).toBe(10);
});

// ── impl() re-definition ─────────────────────────────────────────────────────

test('#19 => impl() overrides a type-only placeholder', () => {
  const m = Pipe.type<(x: number) => number>()('triple').impl(
    'triple',
    x => x * 3,
  );
  const fn = m.pipe('triple');
  expect(fn(4)).toBe(12);
});

// ── notTyped error paths ──────────────────────────────────────────────────────

test('#20 => notTyped throws when no steps are provided', () => {
  const m = Pipe.define('add1', add1);
  expect(() => m.notTyped()).toThrow('at least one step');
});

test('#21 => notTyped throws when a step has no implementation', () => {
  const m = Pipe.type<(x: number) => string>()('numToStr');
  expect(() => m.notTyped('numToStr')).toThrow('"numToStr" is not implemented');
});
