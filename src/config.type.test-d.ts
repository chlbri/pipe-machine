import type { AllGuardsFromConfigs } from "./machine.types";
import type {
  ExtractActions,
  ExtractDelays,
  ExtractGuards,
} from "./config.type";

type _PipeArg1 = [
  {
    cond: "guard1";
    fn: "fn1";
  },
  {
    cond: {
      and: [
        "guard2",
        {
          or: ["guard3", { name: "guard4"; description: "guard4 description" }];
        },
      ];
    };
    fn: [
      {
        delay: "delay1";
        fn: "fn2";
      },
      {
        name: "fn3";
        description: "fn3 description";
      },

      [
        {
          cond: "guard5";
          fn: "fn3";
        },

        {
          cond: { name: "guard6"; description: "guard6 description" };
          fn: {
            delay: "delay2";
            fn: "fn4";
          };
        },
        {
          cond: "guard4";
          fn: "fn5";
        },
      ],
      "fn6",
    ];
  },
];

type EG1 = ExtractGuards<_PipeArg1>;
type EG2 = AllGuardsFromConfigs<[_PipeArg1]>;

expectTypeOf<EG1>().toEqualTypeOf<
  "guard1" | "guard2" | "guard3" | "guard4" | "guard5" | "guard6"
>();

expectTypeOf<EG2>().toEqualTypeOf<
  "guard1" | "guard2" | "guard3" | "guard4" | "guard5" | "guard6"
>();

type EA1 = ExtractActions<_PipeArg1>;
expectTypeOf<EA1>().toEqualTypeOf<
  "fn1" | "fn2" | "fn3" | "fn4" | "fn5" | "fn6"
>();

type ED1 = ExtractDelays<_PipeArg1>;
expectTypeOf<ED1>().toEqualTypeOf<"delay1" | "delay2">();
