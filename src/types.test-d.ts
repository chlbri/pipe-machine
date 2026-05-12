import type { _PrevRM } from "./types";

type TT = _PrevRM<
  ["add1", "double", "str", "double"],
  "double",
  { add1: number; double: number; str: string }
>; // number
expectTypeOf<TT>().toEqualTypeOf<number | string>();
