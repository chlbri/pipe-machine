import type { GUARD_TYPE } from "./constants";
import type { Describer, FromDescriber } from "./types";

type gType = typeof GUARD_TYPE;
type and = gType["and"];
type or = gType["or"];

export type SoA<T> = T | T[] | readonly T[];

export type ReduceArray<T> = T extends SoA<infer U> ? U : T;

export type GuardConfig = Describer | GuardAnd | GuardOr;

export type GuardAnd = {
  [k in and]: GuardConfig[];
};

export type GuardOr = {
  [k in or]: GuardConfig[];
};

export type Condition = {
  cond: SoA<GuardConfig>;
  fn: SoA<Config>;
  description?: string;
};

export type Delayed = {
  delay: Describer;
  fn: SoA<Config>;
  description?: string;
};

export type Config = Condition[] | Describer | Delayed;

export type ReduceGuards<T extends GuardConfig> = T extends Describer
  ? T
  : T extends GuardAnd
    ? ReduceGuards<T[and][number]>
    : T extends GuardOr
      ? ReduceGuards<T[or][number]>
      : never;

type _ExtractGuards<T extends Config | Condition> = T extends (infer E extends
  Condition)[]
  ? E extends Condition
    ? ReduceArray<E["cond"]> extends infer R1 extends GuardConfig
      ? ReduceGuards<R1> extends infer R extends Describer
        ? FromDescriber<R> | _ExtractGuards<ReduceArray<E["fn"]>>
        : never
      : never
    : never
  : never;

export type ExtractGuards<T extends Config> = _ExtractGuards<T>;

type ExtractActionsFromFn<F> = F extends Describer
  ? FromDescriber<F>
  : F extends Config
    ? _ExtractActions<F>
    : never;

type _ExtractActions<T extends Config> = T extends (infer E extends Condition)[]
  ? E extends Condition
    ? ExtractActionsFromFn<ReduceArray<E["fn"]>>
    : never
  : T extends Delayed
    ? ExtractActionsFromFn<ReduceArray<T["fn"]>>
    : never;

export type ExtractActions<T extends Config> = _ExtractActions<T>;

type ExtractDelayFromFn<F> = F extends Describer
  ? never
  : F extends Config
    ? _ExtractDelays<F>
    : never;

type _ExtractDelays<T extends Config> = T extends (infer E extends Condition)[]
  ? E extends Condition
    ? ExtractDelayFromFn<ReduceArray<E["fn"]>>
    : never
  : T extends Delayed
    ? FromDescriber<T["delay"]> | ExtractDelayFromFn<ReduceArray<T["fn"]>>
    : never;

export type ExtractDelays<T extends Config> = _ExtractDelays<T>;
