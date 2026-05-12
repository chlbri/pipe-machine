import type { Describer, FromDescriber, FromDescribers } from "./types";

export const fromDescriber = <D extends Describer>(d: D): FromDescriber<D> => {
  const out: any = typeof d === "string" ? d : d.name;
  return out;
};

export const fromDescribers = <Keys extends readonly Describer[]>(
  keys: Keys,
): FromDescribers<Keys> => {
  const out: any = keys.map(fromDescriber);
  return out;
};
