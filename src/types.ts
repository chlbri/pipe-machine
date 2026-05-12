import type { Fn } from "@bemedev/pipe";
import { StandardSchemaV1 } from "@standard-schema/spec";
import type { MaybePromiseFn } from "./types.return";
import type {
  FirstKeyIsDuplicated,
  IndexOf,
  IsDuplicatedKey,
  Previous,
  UniqueOrdered,
} from "./types.strict";

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

// Constraint for the generic parameter of .type<T>()
// - First key (Keys[0]) is required: { parameters: any[], return: any }
//   (restricted to single-element tuple if first key is duplicated)
// - All other unique keys are optional: just the return type
export type TypeSpec<Keys extends readonly string[]> = Record<
  Keys[0],
  FirstKeyIsDuplicated<Keys> extends true
    ? { parameters: [any]; return: any }
    : { parameters: any[]; return: any }
> &
  Partial<Record<Exclude<Keys[number], Keys[0]>, any>>;

// Private recursive helper: walks UniqueOrdered<Keys> left-to-right,
// building a map of key → resolved return type.
// PrevReturn is always the Awaited version for proper async cascading.
// Keys absent from T fall back to PrevReturn (identity typing, Spec 5).
type _ResolveRT<
  Ordered extends readonly string[],
  FirstKey extends string,
  T,
  PrevReturn,
  Acc extends Record<string, any> = {},
> = Ordered extends readonly [
  infer H extends string,
  ...infer Rest extends string[],
]
  ? H extends FirstKey
    ? T extends Record<H, { parameters: any[]; return: infer R }>
      ? _ResolveRT<Rest, FirstKey, T, Awaited<R>, Acc & Record<H, R>>
      : _ResolveRT<Rest, FirstKey, T, any, Acc & Record<H, any>>
    : T extends Record<H, infer R>
      ? _ResolveRT<Rest, FirstKey, T, Awaited<R>, Acc & Record<H, R>>
      : _ResolveRT<Rest, FirstKey, T, PrevReturn, Acc & Record<H, PrevReturn>>
  : Acc;

// Computes the resolved return type map for all unique keys in the pipeline.
export type ResolvedReturnTypes<
  Keys extends readonly string[],
  T extends TypeSpec<Keys>,
> =
  _ResolveRT<
    UniqueOrdered<Keys>,
    Keys[0],
    T,
    T extends Record<Keys[0], { parameters: any[]; return: infer R }>
      ? Awaited<R>
      : any
  > extends infer Result extends Record<UniqueOrdered<Keys>[number], any>
    ? Result
    : never;

// Looks up the Awaited return type of the key immediately before K.
// Awaited is used because async steps emit resolved values to subsequent steps.
export type _PrevRM<
  Ordered extends readonly string[],
  K extends string,
  RM extends Record<string, any>,
> =
  Previous<Ordered, IndexOf<Ordered, K>> extends infer PK extends string
    ? Awaited<RM[PK]>
    : never;

export type IdentityFn<T> = (x: T) => T;

// Shape of the record passed to .define(impl):
// - First key: (...args: T[Keys[0]]['parameters']) => RM[Keys[0]]
// - Other keys: (arg: RM[PrevKey]) => RM[K]
export type DefineImpl<
  Keys extends readonly string[],
  T extends TypeSpec<Keys>,
  RM extends Record<UniqueOrdered<Keys>[number], any> = ResolvedReturnTypes<
    Keys,
    T
  >,
  Ordered extends readonly string[] = UniqueOrdered<Keys>,
> = {
  [K in Ordered[number]]: K extends Keys[0]
    ? T extends Record<K, { parameters: infer P extends any[] }>
      ? (...args: P) => RM[K]
      : (...args: any[]) => RM[K]
    : IsDuplicatedKey<Keys, K> extends true
      ? IdentityFn<_PrevRM<Keys, K, RM>>
      : (arg: _PrevRM<Ordered, K, RM>) => RM[K];
};

// Returned by createPipe — has only .type<T>()
export interface PipeCreated<Keys extends readonly string[]> {
  type<T extends TypeSpec<Keys>>(
    args?: StandardSchemaV1<any, T>,
  ): PipeTyped<Keys, T>;
}

// Returned by .type<T>() — has only .define(impl)
export interface PipeTyped<
  Keys extends readonly string[],
  T extends TypeSpec<Keys>,
> {
  define(impl: DefineImpl<Keys, T>): Pipeline<Keys, T>;
}

// The completed callable pipeline with partial-override support.
export type Pipeline<
  Keys extends readonly string[],
  T extends TypeSpec<Keys>,
  RM extends Record<UniqueOrdered<Keys>[number], any> = ResolvedReturnTypes<
    Keys,
    T
  >,
> = MaybePromiseFn<
  T extends Record<Keys[0], { parameters: infer P extends any[] }> ? P : any[],
  UniqueOrdered<Keys>,
  RM
> & {
  define(overrides: Partial<DefineImpl<Keys, T, RM>>): Pipeline<Keys, T, RM>;
};
