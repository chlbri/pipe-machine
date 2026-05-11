import type { Fn } from '@bemedev/pipe';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { MaybePromiseFn } from './types.return';

export type { Fn, StandardSchemaV1 };

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

export type SchemaInput<S extends StandardSchemaV1> =
  StandardSchemaV1.InferInput<S>;

export type SchemaOutput<S extends StandardSchemaV1> =
  StandardSchemaV1.InferOutput<S>;

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

export type Pipeline<
  Keys extends readonly string[],
  TFns extends Record<Keys[number], Fn>,
  P extends any[] = First<Keys> extends keyof TFns
    ? Parameters<TFns[First<Keys>]>
    : never,
> = MaybePromiseFn<P, Keys, ReturnTypes<TFns>> & {
  define<const TPartial extends Partial<Record<Keys[number], Fn>>>(
    overrides: TPartial,
  ): Pipeline<Keys, TFns & TPartial>;
};

export interface PipeUntyped<Keys extends readonly string[]> {
  define<const TFns extends Record<Keys[number], Fn>>(
    fns: TFns,
  ): Pipeline<Keys, TFns>;
}
