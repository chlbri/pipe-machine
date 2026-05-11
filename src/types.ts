import type { Fn } from '@bemedev/pipe';
import type { MaybePromiseFn } from './types.return';
import type {
  Dependances,
  FilterTuple,
  FirstKeyIsDuplicated,
  PreviousReturnType,
  UniqueOrdered,
} from './types.strict';

export type { Fn };

export type First<T extends readonly unknown[]> = T extends readonly [
  infer F,
  ...unknown[],
]
  ? F
  : never;

export type Last<T extends readonly unknown[]> = T extends readonly [
  ...unknown[],
  infer L,
]
  ? L
  : never;

export type ReturnTypes<TFns extends Record<string, Fn>> = {
  [K in keyof TFns]: ReturnType<TFns[K]>;
};

export type MergeFns<
  TFns extends Record<string, Fn>,
  TPartial extends Partial<Record<string, Fn>>,
> = {
  [K in keyof TFns]: K extends keyof TPartial
    ? TPartial[K] extends Fn
      ? TPartial[K]
      : TFns[K]
    : TFns[K];
};

type ValidateOverride<
  Keys extends readonly string[],
  TFns extends Record<Keys[number], Fn>,
  K extends Keys[number],
  Impl extends Fn,
> =
  PreviousReturnType<Keys, TFns, K> extends never
    ? Impl
    : Parameters<Impl>[0] extends PreviousReturnType<Keys, TFns, K>
      ? Impl
      : Parameters<Impl> extends [
            PreviousReturnType<Keys, TFns, K>,
            ...unknown[],
          ]
        ? Impl
        : never;

type ValidateOverrides<
  Keys extends readonly string[],
  TFns extends Record<Keys[number], Fn>,
  Overrides extends Partial<Record<Keys[number], Fn>>,
> = {
  [K in keyof Overrides]: K extends Keys[number]
    ? Overrides[K] extends Fn
      ? ValidateOverride<Keys, TFns, K, Overrides[K]>
      : Overrides[K]
    : Overrides[K];
};

export type Pipeline<
  Keys extends readonly string[],
  TFns extends Record<Keys[number], Fn>,
  P extends any[] = First<Keys> extends keyof TFns
    ? Parameters<TFns[First<Keys>]>
    : never,
> = MaybePromiseFn<P, Keys, ReturnTypes<TFns>> & {
  define<const TPartial extends Partial<Record<Keys[number], Fn>>>(
    overrides: ValidateOverrides<Keys, TFns, TPartial> extends infer V
      ? [V] extends [never]
        ? never
        : TPartial
      : TPartial,
  ): Pipeline<Keys, TFns & TPartial>;
};

export type PipeBuilderType<
  AllKeys extends readonly string[],
  Remaining extends readonly string[],
  TFns extends Partial<Record<AllKeys[number], Fn>>,
  D extends Dependances<AllKeys, TFns> = Dependances<AllKeys, TFns>,
> = {
  define<
    const Name extends Remaining[number],
    Impl extends Fn<
      [Awaited<D[Name]['previous']>],
      Awaited<D[Name]['next']>
    >,
  >(
    ...args: Remaining['length'] extends 1
      ? [impl: Impl] | [name: Name, impl: Impl]
      : [name: Name, impl: Impl]
  ): FilterTuple<Remaining, Name & string> extends []
    ? Pipeline<
        AllKeys,
        TFns & Record<Name, Impl> extends Record<AllKeys[number], Fn>
          ? TFns & Record<Name, Impl>
          : never
      >
    : PipeBuilderType<
        AllKeys,
        FilterTuple<Remaining, Name & string>,
        TFns & Record<Name, Impl>
      >;
};

export interface PipeUntyped<Keys extends readonly string[]> {
  init<
    Impl extends FirstKeyIsDuplicated<Keys> extends true
      ? (arg: any) => any
      : (...args: any[]) => any,
  >(
    impl: Impl,
  ): UniqueOrdered<Keys> extends [
    infer _First extends string,
    ...infer Rest extends readonly string[],
  ]
    ? Rest extends []
      ? Pipeline<Keys, Record<Keys[0], Impl>>
      : PipeBuilderType<Keys, Rest, Record<Keys[0], Impl>>
    : never;
}
