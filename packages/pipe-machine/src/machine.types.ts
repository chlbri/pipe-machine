import type { GuardImpl } from './helpers';
import type { Describer, FromDescriber } from './types/common';
import type {
  Config,
  ExtractActions,
  ExtractDelays,
  ExtractGuards,
} from './types/config';

export type { Describer, FromDescriber };

export type MachineDefineInput<
  AllGuards extends string,
  AllActions extends string,
  AllDelays extends string,
  Context,
> = ([AllActions] extends [never]
  ? unknown
  : {
      actions: Record<
        AllActions,
        (ctx: Context) => Context | Promise<Context>
      >;
    }) &
  ([AllGuards] extends [never]
    ? unknown
    : { guards: Record<AllGuards, GuardImpl<Context>> }) &
  ([AllDelays] extends [never]
    ? unknown
    : { delays: Record<AllDelays, number | ((ctx: Context) => number)> });

type HasAsyncIn<T> =
  T extends Record<string, (...args: any[]) => any>
    ? true extends {
        [K in keyof T]: ReturnType<T[K]> extends Promise<any>
          ? true
          : false;
      }[keyof T]
      ? true
      : false
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
      MachineDefineInput<AllGuards, AllActions, AllDelays, Context>
    >,
  ): MachinePipeline<
    Params,
    Context,
    AllGuards,
    AllActions,
    AllDelays,
    IsAsync
  >;
};

export type MachineTyped<
  Configs extends readonly Config[],
  AllGuards extends string,
  AllActions extends string,
  AllDelays extends string,
  Params extends any[],
  Context,
  IsFirstAsync extends boolean = false,
> = Configs['length'] extends 0
  ? {
      (
        ...params: Params
      ): IsFirstAsync extends true ? Promise<Context> : Context;
      build<T1>(
        select: (ctx: Context) => T1,
      ): IsFirstAsync extends true
        ? (...params: Params) => Promise<T1>
        : (...params: Params) => T1;
    }
  : {
      define<
        Impl extends MachineDefineInput<
          AllGuards,
          AllActions,
          AllDelays,
          Context
        >,
      >(
        impl: Impl,
      ): MachinePipeline<
        Params,
        Context,
        AllGuards,
        AllActions,
        AllDelays,
        IsFirstAsync extends true
          ? true
          : [AllDelays] extends [never]
            ? Impl extends { actions: any }
              ? HasAsyncIn<Impl['actions']>
              : false
            : true
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
