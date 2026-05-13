import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { GuardImpl } from "./helpers";
import type {
  Config,
  ExtractActions,
  ExtractDelays,
  ExtractGuards,
} from "./types/config";
import type { Describer, FromDescriber } from "./types/common";

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
    ? (...params: Params) => Context | Promise<Context>
    : (ctx: Context) => Context | Promise<Context>;
};

export type MachineDefineInput<
  FirstKey extends string,
  AllGuards extends string,
  AllActions extends string,
  AllDelays extends string,
  Params extends any[],
  Context,
> = { actions: ActionsImpl<FirstKey, AllActions, Params, Context> } & ([
  AllGuards,
] extends [never]
  ? unknown
  : { guards: Record<AllGuards, GuardImpl<Context>> }) &
  ([AllDelays] extends [never]
    ? unknown
    : { delays: Record<AllDelays, number | ((ctx: Context) => number)> });

type HasAsyncIn<T extends Record<string, (...args: any[]) => any>> =
  true extends {
    [K in keyof T]: ReturnType<T[K]> extends Promise<any> ? true : false;
  }[keyof T]
    ? true
    : false;

type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends any[] | readonly any[]
    ? T
    : T extends object
      ? {
          [P in keyof T]?: DeepPartial<T[P]>;
        }
      : T;

export type MachinePipeline<
  Params extends any[],
  Context,
  FirstKey extends string,
  AllGuards extends string,
  AllActions extends string,
  AllDelays extends string,
  IsAsync extends boolean = false,
> = {
  (...params: Params): IsAsync extends true ? Promise<Context> : Context;
  build<T1>(
    select: (ctx: Context) => T1,
  ): IsAsync extends true
    ? (...params: Params) => Promise<T1>
    : (...params: Params) => T1;
  define(
    impl: DeepPartial<
      MachineDefineInput<
        FirstKey,
        AllGuards,
        AllActions,
        AllDelays,
        Params,
        Context
      >
    >,
  ): MachinePipeline<
    Params,
    Context,
    FirstKey,
    AllGuards,
    AllActions,
    AllDelays,
    IsAsync
  >;
};

export interface MachineTyped<
  FirstKey extends string,
  AllGuards extends string,
  AllActions extends string,
  AllDelays extends string,
  Params extends any[],
  Context,
> {
  define<
    Impl extends MachineDefineInput<
      FirstKey,
      AllGuards,
      AllActions,
      AllDelays,
      Params,
      Context
    >,
  >(
    impl: Impl,
  ): MachinePipeline<
    Params,
    Context,
    FirstKey,
    AllGuards,
    AllActions,
    AllDelays,
    [AllDelays] extends [never] ? HasAsyncIn<Impl["actions"]> : true
  >;
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
