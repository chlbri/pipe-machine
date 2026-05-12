import type { Describer, FromDescriber } from './types';

export const fromDescriber = <D extends Describer>(
  d: D,
): FromDescriber<D> => {
  const out: any = typeof d === 'string' ? d : d.name;
  return out;
};
