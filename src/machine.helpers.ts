import recursive from "@bemedev/boolean-recursive";
import { decompose, recompose } from "@bemedev/decompose";
import { GUARD_TYPE } from "./constants";
import type { GuardAnd, GuardConfig, GuardOr } from "./config.type";

export type GuardImpl<Context> = ((ctx: Context) => boolean) | boolean;

export function toPredicate<Context>(
  guardConfig: GuardConfig,
  guardsMap: Record<string, GuardImpl<Context>>,
): (ctx: Context) => boolean {
  if (typeof guardConfig === "string") {
    const impl = guardsMap[guardConfig];
    return typeof impl === "boolean" ? () => impl : impl;
  }
  if ("name" in guardConfig) {
    const impl = guardsMap[guardConfig.name];
    return typeof impl === "boolean" ? () => impl : impl;
  }
  if (GUARD_TYPE.and in guardConfig) {
    const preds = (guardConfig as GuardAnd)[GUARD_TYPE.and].map(
      (g: GuardConfig) => toPredicate(g, guardsMap),
    );
    return recursive(...preds);
  }
  const preds = (guardConfig as GuardOr)[GUARD_TYPE.or].map((g: GuardConfig) =>
    toPredicate(g, guardsMap),
  );
  return (ctx: Context) => preds.some((p: (c: Context) => boolean) => p(ctx));
}

export function toSoA<T>(v: T | T[] | readonly T[]): T[] {
  return Array.isArray(v) ? [...v] : [v as T];
}

export function assign<T extends object, K extends string>(
  key: K,
  action: (arg: T) => any,
): (ctx: T) => T;
export function assign<T extends object>(
  key: string,
  action: (arg: T) => any,
): (ctx: T) => T;
export function assign<T extends object>(
  key: string,
  action: (arg: T) => any,
): (ctx: T) => T {
  return (ctx: T) => {
    const value = action(ctx);
    if (!key.includes(".") && !key.includes("[")) {
      return { ...ctx, [key]: value } as T;
    }
    const flat: Record<string, unknown> = decompose(ctx) as any;
    flat[key] = value;
    return recompose(flat as any) as T;
  };
}
