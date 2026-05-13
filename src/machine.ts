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
  #impl: any = {};

  constructor(firstDescriber: Describer, configs: readonly Config[]) {
    this.#firstDescriber = firstDescriber;
    this.#configs = configs;
    this.#hasDelays = configs.some(configHasDelay);
  }

  define = (impl: any) => {
    this.#impl = impl;
    const firstKey = fromDescriber(this.#firstDescriber);
    const resolved = resolveMany(this.#configs, this.#impl);
    const isAsync = this.#hasDelays || hasAsyncFns(this.#impl.actions);

    if (isAsync) {
      const asyncFn = async (...params: any[]) => {
        let ctx: any = await this.#impl.actions[firstKey](...params);
        for (const r of resolved) ctx = await executeResolvedAsync(r, ctx);
        return ctx;
      };
      (asyncFn as any).build =
        (select: any) =>
        async (...params: any[]) =>
          select(await asyncFn(...params));

      (asyncFn as any).define = (impl: any) => {
        return new MachineTypedImpl(this.#firstDescriber, this.#configs).define(
          {
            actions: { ...this.#impl.actions, ...impl.actions },
            guards: { ...this.#impl.guards, ...impl.guards },
            delays: { ...this.#impl.delays, ...impl.delays },
          },
        );
      };
      return asyncFn;
    }

    const syncFn = (...params: any[]) => {
      let ctx: any = this.#impl.actions[firstKey](...params);
      for (const r of resolved) ctx = executeResolved(r, ctx);
      return ctx;
    };
    (syncFn as any).build =
      (select: any) =>
      (...params: any[]) =>
        select(syncFn(...params));

    (syncFn as any).define = (impl: any) => {
      return new MachineTypedImpl(this.#firstDescriber, this.#configs).define({
        actions: { ...this.#impl.actions, ...impl.actions },
        guards: { ...this.#impl.guards, ...impl.guards },
        delays: { ...this.#impl.delays, ...impl.delays },
      });
    };
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
