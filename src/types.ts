import type { Fn, MaybePromiseFn } from '@bemedev/pipe';

export type { Fn, MaybePromiseFn };

/**
 * Describes a pipeline step with a name and optional description.
 */
export type Describer<Name extends string = string> = {
  name: Name;
  description: string;
};

/**
 * A step reference: either a string (name only) or a {@link Describer} object.
 */
export type StepRef<Name extends string = string> = Name | Describer<Name>;

/**
 * A registry that maps step names to their function implementations.
 */
export type Registry = Record<string, Fn>;

/**
 * Returns all step names whose first parameter type is compatible with
 * the awaited return type of step `KPrev`.
 */
export type ValidNext<
  TDefs extends Registry,
  KPrev extends keyof TDefs & string,
> = {
  [K in keyof TDefs & string]: Awaited<
    ReturnType<TDefs[KPrev]>
  > extends Parameters<TDefs[K]>[0]
    ? K
    : never;
}[keyof TDefs & string];
