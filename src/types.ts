export type Describer =
  | {
      name: string;
      description: string;
    }
  | string;

export type FromDescriber<D extends Describer> = D extends string
  ? D
  : D extends { name: infer N extends string }
    ? N
    : never;

export type Cast<T, U> = T extends U ? T : U;
