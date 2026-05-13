import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { GuardImpl } from "./helpers";
import type {
  Config,
  ExtractActions,
  ExtractDelays,
  ExtractGuards,
} from "./config.type";
import type { Describer, FromDescriber } from "./types";

export type { Describer, FromDescriber };

export type MachineTypeSpec = {
  params: any[];
  context: Record<string, any>;
};

type ActionsImpl<
  FirstKey extends string,
  AllActions extends string,
  Params extends any[],
  Context,
> = {
  [K in AllActions]: K extends FirstKey
    ? (...params: Params) => Context
    : (ctx: Context) => Context;
};

export type MachineDefineInput<
  FirstKey extends string,
  AllGuards extends string,
  AllActions extends string,
  AllDelays extends string,
  Params extends any[],
  Context,
> = {
  actions: ActionsImpl<FirstKey, AllActions, Params, Context>;
  guards: Record<AllGuards, GuardImpl<Context>>;
  delays: Record<AllDelays, number | ((ctx: Context) => number)>;
};

export type MachinePipeline<Params extends any[], Context> = (
  ...params: Params
) => Context;

export interface MachineTyped<
  FirstKey extends string,
  AllGuards extends string,
  AllActions extends string,
  AllDelays extends string,
  Params extends any[],
  Context,
> {
  define(
    impl: MachineDefineInput<
      FirstKey,
      AllGuards,
      AllActions,
      AllDelays,
      Params,
      Context
    >,
  ): MachinePipeline<Params, Context>;
}

export type MachineCreated<
  FirstKey extends string,
  AllGuards extends string,
  ConfigActions extends string,
  AllDelays extends string,
> = {
  type<
    T extends {
      params: FirstKey extends ConfigActions ? [any] : any[];
      context: Record<string, any>;
    },
  >(
    typings?: StandardSchemaV1<any, T>,
  ): MachineTyped<
    FirstKey,
    AllGuards,
    FirstKey | ConfigActions,
    AllDelays,
    T["params"],
    T["context"]
  >;
};

export type AllGuardsFromConfigs<Configs extends readonly Config[]> =
  Configs extends readonly (infer C extends Config)[]
    ? ExtractGuards<C>
    : never;

export type AllActionsFromConfigs<Configs extends readonly Config[]> =
  Configs extends readonly (infer C extends Config)[]
    ? ExtractActions<C>
    : never;

export type AllDelaysFromConfigs<Configs extends readonly Config[]> =
  Configs extends readonly (infer C extends Config)[]
    ? ExtractDelays<C>
    : never;

export type MachineFirstKey<D extends Describer> = FromDescriber<D>;
