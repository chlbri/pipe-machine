import recursive from '@bemedev/boolean-recursive';
import { decompose, recompose } from '@bemedev/decompose';
import { GUARD_TYPE } from './constants';
import type { GuardAnd, GuardConfig, GuardOr } from './new.type';

export type GuardImpl<Context> = ((ctx: Context) => boolean) | boolean;

export function toPredicate<Context>(
  guardConfig: GuardConfig,
  guardsMap: Record<string, GuardImpl<Context>>,
): (ctx: Context) => boolean {
  if (typeof guardConfig === 'string') {
    const impl = guardsMap[guardConfig];
    return typeof impl === 'boolean' ? () => impl : impl;
  }
  if ('name' in guardConfig) {
    const impl = guardsMap[guardConfig.name];
    return typeof impl === 'boolean' ? () => impl : impl;
  }
  if (GUARD_TYPE.and in guardConfig) {
    const preds = (guardConfig as GuardAnd)[GUARD_TYPE.and].map(
      (g: GuardConfig) => toPredicate(g, guardsMap),
    );
    return recursive(...preds);
  }
  const preds = (guardConfig as GuardOr)[GUARD_TYPE.or].map(
    (g: GuardConfig) => toPredicate(g, guardsMap),
  );
  return (ctx: Context) =>
    preds.some((p: (c: Context) => boolean) => p(ctx));
}

export function toSoA<T>(v: T | T[] | readonly T[]): T[] {
  return Array.isArray(v) ? [...v] : [v as T];
}

type Updater<Context> =
  | ((ctx: Context) => Partial<Context>)
  | Partial<Context>;

export function assign<Context extends Record<string, any>>(
  updater: Updater<Context>,
): (ctx: Context) => Context;
export function assign<Context extends Record<string, any>>(
  path: string,
  value: unknown,
): (ctx: Context) => Context;
export function assign<Context extends Record<string, any>>(
  pathOrUpdater: string | Updater<Context>,
  value?: unknown,
): (ctx: Context) => Context {
  if (typeof pathOrUpdater === 'string') {
    const path = pathOrUpdater;
    if (!path.includes('.') && !path.includes('[')) {
      return (ctx: Context) => ({ ...ctx, [path]: value }) as Context;
    }
    return (ctx: Context) => {
      const flat: Record<string, unknown> = decompose(ctx) as any;
      flat[path] = value;
      return recompose(flat as any) as Context;
    };
  }
  return (ctx: Context) => {
    const partial =
      typeof pathOrUpdater === 'function'
        ? pathOrUpdater(ctx)
        : pathOrUpdater;
    return { ...ctx, ...partial } as Context;
  };
}
