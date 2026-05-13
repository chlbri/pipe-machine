import type { Config, Delayed } from "./types/config";
import {
  executeResolved,
  executeResolvedAsync,
  hasAsyncFns,
  resolveMany,
  fromDescriber,
} from "./helpers";
import type {
  AllActionsFromConfigs,
  AllDelaysFromConfigs,
  AllGuardsFromConfigs,
  FromDescriber,
  MachineCreated,
} from "./machine.types";
import type { Describer } from "./types/common";

function configHasDelay(c: Config): c is Delayed {
  return !Array.isArray(c) && typeof c === "object" && "delay" in c;
}

class MachineTypedImpl {
  readonly #firstDescriber: Describer;
  readonly #configs: readonly Config[];
  readonly #hasDelays: boolean;

  constructor(firstDescriber: Describer, configs: readonly Config[]) {
    this.#firstDescriber = firstDescriber;
    this.#configs = configs;
    this.#hasDelays = configs.some(configHasDelay);
  }

  define = (impl: any) => {
    const firstKey = fromDescriber(this.#firstDescriber);
    const resolved = resolveMany(this.#configs, impl);
    const isAsync = this.#hasDelays || hasAsyncFns(impl.actions);

    if (isAsync) {
      const asyncFn = async (...params: any[]) => {
        let ctx: any = await impl.actions[firstKey](...params);
        for (const r of resolved) ctx = await executeResolvedAsync(r, ctx);
        return ctx;
      };
      (asyncFn as any).build =
        (select: any) =>
        async (...params: any[]) =>
          select(await asyncFn(...params));
      return asyncFn;
    }

    const syncFn = (...params: any[]) => {
      let ctx: any = impl.actions[firstKey](...params);
      for (const r of resolved) ctx = executeResolved(r, ctx);
      return ctx;
    };
    (syncFn as any).build =
      (select: any) =>
      (...params: any[]) =>
        select(syncFn(...params));
    return syncFn;
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
