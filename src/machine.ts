import { fromDescriber } from "./helpers";
import { toPredicate, toSoA } from "./machine.helpers";
import type {
  AllActionsFromConfigs,
  AllDelaysFromConfigs,
  AllGuardsFromConfigs,
  FromDescriber,
  MachineCreated,
} from "./machine.types";
import type { Condition, Config, Delayed } from "./config.type";
import type { Describer } from "./types";

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

function resolveConfigs(
  configs: readonly Config[],
  impl: any,
): ResolvedConfig[] {
  return configs.map((c) => resolveOne(c, impl));
}

function resolveOne(config: Config, impl: any): ResolvedConfig {
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
}

function executeResolved(resolved: ResolvedConfig, ctx: any): any {
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
}

class MachineTypedImpl {
  readonly #firstDescriber: Describer;
  readonly #configs: readonly Config[];

  constructor(firstDescriber: Describer, configs: readonly Config[]) {
    this.#firstDescriber = firstDescriber;
    this.#configs = configs;
  }

  define = (impl: { actions: any; guards: any; delays: any }) => {
    const firstKey = fromDescriber(this.#firstDescriber);
    const resolved = resolveConfigs(this.#configs, impl);

    return (...params: any[]) => {
      let ctx: any = impl.actions[firstKey](...params);
      for (const r of resolved) ctx = executeResolved(r, ctx);
      return ctx;
    };
  };
}

class MachineImpl {
  readonly #firstDescriber: Describer;
  readonly #configs: readonly Config[];

  constructor(firstDescriber: Describer, configs: readonly Config[]) {
    this.#firstDescriber = firstDescriber;
    this.#configs = configs;
  }

  type = () => new MachineTypedImpl(this.#firstDescriber, this.#configs) as any;
}

export function createPipe<
  const D extends Describer,
  const Configs extends readonly Config[],
>(
  firstDescriber: D,
  ...configs: Configs
): MachineCreated<
  FromDescriber<D>,
  AllGuardsFromConfigs<Configs>,
  AllActionsFromConfigs<Configs>,
  AllDelaysFromConfigs<Configs>
> {
  return new MachineImpl(firstDescriber, configs) as any;
}
