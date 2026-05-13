import type { Config } from "./config.type";
import { executeResolved, resolveConfigs, fromDescriber } from "./helpers";
import type {
  AllActionsFromConfigs,
  AllDelaysFromConfigs,
  AllGuardsFromConfigs,
  FromDescriber,
  MachineCreated,
} from "./machine.types";
import type { Describer } from "./types";

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
