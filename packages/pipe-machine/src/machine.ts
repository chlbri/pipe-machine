import type { Config, Delayed } from './types/config';
import {
  executeResolved,
  executeResolvedAsync,
  hasAsyncFns,
  isAsyncFunction,
  resolveMany,
} from './helpers';
import type {
  AllActionsFromConfigs,
  AllDelaysFromConfigs,
  AllGuardsFromConfigs,
  MachineTyped,
} from './machine.types';

function configHasDelay(c: Config): c is Delayed {
  return !Array.isArray(c) && typeof c === 'object' && 'delay' in c;
}

class MachineTypedImpl {
  readonly #firstFn: (...args: any[]) => any;
  readonly #configs: readonly Config[];
  readonly #hasDelays: boolean;
  #impl: any = {};

  constructor(
    firstFn: (...args: any[]) => any,
    configs: readonly Config[],
  ) {
    this.#firstFn = firstFn;
    this.#configs = configs;
    this.#hasDelays = configs.some(configHasDelay);
  }

  define = (impl: any) => {
    this.#impl = impl;
    const resolved = resolveMany(this.#configs, this.#impl);
    const isAsync =
      this.#hasDelays ||
      (this.#impl.actions && hasAsyncFns(this.#impl.actions)) ||
      isAsyncFunction(this.#firstFn);

    if (isAsync) {
      const asyncFn = async (...params: any[]) => {
        let ctx: any = await this.#firstFn(...params);
        for (const r of resolved) ctx = await executeResolvedAsync(r, ctx);
        return ctx;
      };
      (asyncFn as any).build =
        (select: any) =>
        async (...params: any[]) =>
          select(await asyncFn(...params));

      (asyncFn as any).define = (impl2: any) => {
        return new MachineTypedImpl(this.#firstFn, this.#configs).define({
          actions: {
            ...(this.#impl.actions || {}),
            ...(impl2.actions || {}),
          },
          guards: {
            ...(this.#impl.guards || {}),
            ...(impl2.guards || {}),
          },
          delays: {
            ...(this.#impl.delays || {}),
            ...(impl2.delays || {}),
          },
        });
      };
      return asyncFn;
    }

    const syncFn = (...params: any[]) => {
      let ctx: any = this.#firstFn(...params);
      for (const r of resolved) ctx = executeResolved(r, ctx);
      return ctx;
    };
    (syncFn as any).build =
      (select: any) =>
      (...params: any[]) =>
        select(syncFn(...params));

    (syncFn as any).define = (impl2: any) => {
      return new MachineTypedImpl(this.#firstFn, this.#configs).define({
        actions: {
          ...(this.#impl.actions || {}),
          ...(impl2.actions || {}),
        },
        guards: {
          ...(this.#impl.guards || {}),
          ...(impl2.guards || {}),
        },
        delays: {
          ...(this.#impl.delays || {}),
          ...(impl2.delays || {}),
        },
      });
    };
    return syncFn;
  };
}

export function createPipe<
  const Params extends any[],
  const R,
  const Configs extends readonly Config[],
>(
  firstFn: (...params: Params) => R,
  ...configs: Configs
): MachineTyped<
  Configs,
  AllGuardsFromConfigs<Configs>,
  AllActionsFromConfigs<Configs>,
  AllDelaysFromConfigs<Configs>,
  Params,
  Awaited<R>,
  R extends Promise<any> ? true : false
> {
  if (configs.length === 0) {
    const out: any = firstFn;
    out.build =
      (select: any) =>
      (...params: Params) =>
        select(out(...params));

    return out;
  }
  return new MachineTypedImpl(firstFn, configs) as any;
}
