import type { Equals } from '@bemedev/pipe';
import type { Fn } from './types';

/**
 * Get the previous member of an array given the current index.
 * Returns never if index is 0 or out of bounds.
 *
 * @example
 * ```ts
 * type Arr = [string, number, boolean];
 * type Prev = Previous<Arr, 2>; // number
 * type NoPrev = Previous<Arr, 0>; // never
 * ```
 */
export type Previous<
  T extends readonly unknown[],
  I extends number,
  _Acc extends unknown[] = [],
> = I extends 0
  ? never
  : _Acc['length'] extends I
    ? T extends readonly []
      ? never
      : _Acc extends readonly [...infer _Rest, infer Last]
        ? Last
        : never
    : T extends readonly [infer H, ...infer Rest]
      ? Previous<Rest, I, [..._Acc, H]>
      : never;

/**
 * Get the next member of an array given the current index.
 * Returns never if index is at the last position or out of bounds.
 *
 * @example
 * ```ts
 * type Arr = [string, number, boolean];
 * type Next = Next<Arr, 1>; // boolean
 * type NoNext = Next<Arr, 2>; // never
 * ```
 */
export type Next<
  T extends readonly unknown[],
  I extends number,
  _Acc extends unknown[] = [],
> = _Acc['length'] extends I
  ? T extends readonly [unknown, ...infer Rest]
    ? Rest extends readonly [infer H, ...unknown[]]
      ? H
      : never
    : never
  : T extends readonly [unknown, ...infer Rest]
    ? Next<Rest, I, [..._Acc, unknown]>
    : never;

/**
 * Get the index of an element inside an array.
 * Returns the index if the element extends T, otherwise returns never.
 *
 * @example
 * ```ts
 * type Arr = [string, number, boolean];
 * type Index = IndexOf<Arr, number>; // 1
 * type NotFound = IndexOf<Arr, symbol>; // never
 * ```
 */
export type FirstIndexOf<
  T extends readonly unknown[],
  E,
  _Acc extends unknown[] = [],
> = T extends readonly [infer First, ...infer Rest]
  ? First extends E
    ? _Acc['length']
    : FirstIndexOf<Rest, E, [..._Acc, First]>
  : never;

/**
 * Get the index of an element inside an array.
 * Returns all indices where the element extends E, or never if not found.
 *
 * @example
 * ```ts
 * type Arr = [string, number, boolean];
 * type Index = IndexOf<Arr, number>; // 1
 * type AllStrings = IndexOf<['a', 'b', 'c'], string>; // 0 | 1 | 2
 * type NotFound = IndexOf<Arr, symbol>; // never
 * ```
 */
export type IndexOf<
  T extends readonly unknown[],
  E,
  _Acc extends unknown[] = [],
> = T extends readonly [infer First, ...infer Rest]
  ?
      | (First extends E ? _Acc['length'] : never)
      | IndexOf<Rest, E, [..._Acc, First]>
  : never;

type PreviousReturn<
  T extends readonly string[],
  K extends T[number],
  TFns extends Partial<Record<T[number], Fn>>,
> =
  Previous<T, IndexOf<T, K>> extends infer U extends keyof TFns
    ? Equals<U, never> extends true
      ? any
      : ReturnType<Extract<TFns[U], Fn>>
    : any;

type NextParam<
  T extends readonly string[],
  K extends T[number],
  TFns extends Partial<Record<T[number], Fn>>,
> =
  Next<T, IndexOf<T, K>> extends infer U extends keyof TFns
    ? Equals<U, never> extends true
      ? any
      : Parameters<Extract<TFns[U], Fn>>[0]
    : any;

export type Dependances<
  T extends readonly string[],
  TFns extends Partial<Record<T[number], Fn>>,
> = {
  [K in T[number]]: {
    previous: PreviousReturn<T, K, TFns>;
    next: NextParam<T, K, TFns>;
  };
};

export type UniqueOrdered<
  T extends readonly string[],
  Seen extends string = never,
  Acc extends readonly string[] = [],
> = T extends readonly [
  infer H extends string,
  ...infer Rest extends string[],
]
  ? H extends Seen
    ? UniqueOrdered<Rest, Seen, Acc>
    : UniqueOrdered<Rest, Seen | H, [...Acc, H]>
  : Acc;

export type FirstKeyIsDuplicated<T extends readonly string[]> = [
  Exclude<IndexOf<T, T[0]>, 0>,
] extends [never]
  ? false
  : true;

export type FilterTuple<
  T extends readonly string[],
  Exclude extends string,
  Acc extends readonly string[] = [],
> = T extends readonly [
  infer H extends string,
  ...infer Rest extends string[],
]
  ? H extends Exclude
    ? FilterTuple<Rest, Exclude, Acc>
    : FilterTuple<Rest, Exclude, [...Acc, H]>
  : Acc;

export type GetAtIndex<
  T extends readonly unknown[],
  I extends number,
  _Acc extends unknown[] = [],
> = _Acc['length'] extends I
  ? T extends readonly [infer H, ...unknown[]]
    ? H
    : never
  : T extends readonly [unknown, ...infer Rest]
    ? GetAtIndex<Rest, I, [..._Acc, unknown]>
    : never;

export type PreviousReturnType<
  Keys extends readonly string[],
  TFns extends Record<Keys[number], any>,
  Key extends Keys[number],
> =
  FirstIndexOf<Keys, Key> extends infer Idx extends number
    ? Idx extends 0
      ? never
      : Previous<Keys, Idx> extends infer PrevKey extends Keys[number]
        ? PrevKey extends Keys[number]
          ? ReturnType<TFns[PrevKey]>
          : never
        : never
    : never;
