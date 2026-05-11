type IsPromise<T> = T extends Promise<any> ? true : false;

export type IsPromiseRecord<
  K extends readonly string[],
  T extends Record<K[number], any>,
> = K extends readonly [
  infer First extends string,
  ...infer Rest extends string[],
]
  ? IsPromise<T[First]> extends true
    ? true
    : IsPromiseRecord<Rest, Pick<T, Rest[number]>>
  : false;

type _Last<T extends readonly any[]> = T extends [...any[], infer Last]
  ? Last
  : never;

type MaybePromise<
  K extends readonly string[],
  T extends Record<K[number], any>,
  Last = T[_Last<K>],
> = IsPromiseRecord<K, T> extends true ? Promise<Last> : Last;

export type MaybePromiseFn<
  Args extends any[] = any[],
  K extends readonly string[] = string[],
  T extends Record<K[number], any> = Record<K[number], any>,
> = (...args: Args) => MaybePromise<K, T>;
