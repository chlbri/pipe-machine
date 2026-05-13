import recursive from "@bemedev/boolean-recursive";
import { decompose, recompose } from "@bemedev/decompose";
import type {
  Condition,
  Config,
  Delayed,
  GuardAnd,
  GuardConfig,
} from "./config.type";
import { GUARD_TYPE } from "./constants";

import type { Describer, FromDescriber } from "./types";

export const fromDescriber = <D extends Describer>(d: D): FromDescriber<D> => {
  const out: any = typeof d === "string" ? d : d.name;
  return out;
};

export type GuardImpl<Context> = ((ctx: Context) => boolean) | boolean;

type ToPreficate_F = <Context>(
  guardConfig: GuardConfig,
  guardsMap: Record<string, GuardImpl<Context>>,
) => (ctx: Context) => boolean;

export const toPredicate: ToPreficate_F = (guardConfig, guardsMap) => {
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

  const preds = guardConfig[GUARD_TYPE.or].map((g) =>
    toPredicate(g, guardsMap),
  );
  return (ctx) => preds.some((check) => check(ctx));
};

export function toSoA<T>(v: T | T[] | readonly T[]): T[] {
  return Array.isArray(v) ? [...v] : [v as T];
}

export type Assign_F = <T extends object, K extends string>(
  key: K,
  action: (arg: T) => any,
) => (ctx: T) => T;

export const assign: Assign_F = (key, action) => {
  return (ctx) => {
    const value = action(ctx);
    if (!key.includes(".") && !key.includes("[")) {
      return { ...ctx, [key]: value } as any;
    }
    const flat: Record<string, unknown> = decompose(ctx) as any;
    flat[key] = value;
    return recompose.low(flat);
  };
};

type ResolvedConfig =
  | { tag: "action"; fn: (ctx: any) => any }
  | {
      tag: "conditions";
      branches: Array<{
        pred: (ctx: any) => boolean;
        fns: ResolvedConfig[];
      }>;
    }
  | {
      tag: "delay";
      ms: number | ((ctx: any) => number);
      fns: ResolvedConfig[];
    };

function isDescriber(config: Describer | Delayed): config is Describer {
  return typeof config === "string" || !("delay" in config);
}

export const resolveConfigs = (
  configs: readonly Config[],
  impl: any,
): ResolvedConfig[] => {
  return configs.map((c) => resolveOne(c, impl));
};

const resolveOne = (config: Config, impl: any): ResolvedConfig => {
  if (Array.isArray(config)) {
    return {
      tag: "conditions",
      branches: (config as readonly Condition[]).map((condition) => {
        const guards = toSoA(condition.cond);
        const preds = guards.map((g) => toPredicate(g, impl.guards));
        const pred =
          preds.length === 1
            ? preds[0]
            : (ctx: any) => preds.every((p) => p(ctx));
        return { pred, fns: resolveConfigs(toSoA(condition.fn), impl) };
      }),
    };
  }

  if (isDescriber(config as Describer | Delayed)) {
    return {
      tag: "action",
      fn: impl.actions[fromDescriber(config as Describer)],
    };
  }

  const delayed = config as Delayed;
  return {
    tag: "delay",
    ms: impl.delays[fromDescriber(delayed.delay)],
    fns: resolveConfigs(toSoA(delayed.fn), impl),
  };
};

export const executeResolved = (resolved: ResolvedConfig, ctx: any): any => {
  if (resolved.tag === "action") return resolved.fn(ctx);

  if (resolved.tag === "conditions") {
    for (const { pred, fns } of resolved.branches) {
      if (pred(ctx)) {
        let result = ctx;
        for (const fn of fns) result = executeResolved(fn, result);
        return result;
      }
    }
    return ctx;
  }

  let result = ctx;
  for (const fn of resolved.fns) result = executeResolved(fn, result);
  return result;
};
