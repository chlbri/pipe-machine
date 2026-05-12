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
