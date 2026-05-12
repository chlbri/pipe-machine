import type { _PrevRM, FromDescribers } from "./types";

type PRM1 = _PrevRM<
  ["add1", "double", "str", "double"],
  "double",
  { add1: number; double: number; str: string }
>; // number
expectTypeOf<PRM1>().toEqualTypeOf<number | string>();

type FD1 = FromDescribers<
  ["add1", "double", "str", "double", { name: "name"; description: "Any" }]
>; // "add1" | "double" | "str"
expectTypeOf<FD1>().toEqualTypeOf<
  ["add1", "double", "str", "double", "name"]
>();
