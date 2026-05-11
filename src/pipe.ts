import { notTyped } from '@bemedev/pipe';
import type { Fn, PipeUntyped } from './types';

class PipeBuilderImpl<
  AllKeys extends readonly string[],
  TFns extends Partial<Record<AllKeys[number], Fn>>,
> {
  readonly #allKeys: AllKeys;
  readonly #fns: TFns;

  constructor(allKeys: AllKeys, fns: TFns) {
    this.#allKeys = allKeys;
    this.#fns = fns;
  }

  define(name: string | Fn, impl?: Fn): any {
    if (typeof name === 'function') {
      impl = name;
      const keys1 = new Set(Object.keys(this.#fns));
      const keys2 = new Set(this.#allKeys);
      const remain = Array.from(keys1.symmetricDifference(keys2))[0];
      name = remain;
    }
    const newFns = { ...this.#fns, [name]: impl } as any;
    const uniqueKeys = [...new Set(this.#allKeys)];
    const allDefined = uniqueKeys.every(k => k in newFns);
    if (allDefined) {
      return this.build(newFns as any);
    }
    return new PipeBuilderImpl(this.#allKeys, newFns);
  }

  build(fns: Record<string, Fn>): any {
    const ordered = this.#allKeys.map(k => fns[k]);
    const composed = notTyped(...(ordered as unknown as [Fn, ...Fn[]]));
    const result = Object.assign(composed, {
      define: (overrides: Record<string, Fn>) => {
        return new PipeBuilderImpl(this.#allKeys, fns as any).build({
          ...fns,
          ...overrides,
        } as any);
      },
    });
    return result as any;
  }
}

class Pipe<Keys extends readonly string[]> implements PipeUntyped<Keys> {
  readonly #keys: Keys;

  private constructor(keys: Keys) {
    this.#keys = keys;
  }

  static create<Keys extends readonly string[]>(
    ...keys: Keys
  ): PipeUntyped<Keys> {
    return new Pipe(keys) as unknown as PipeUntyped<Keys>;
  }

  init(impl: Fn): any {
    if (this.#keys.length === 0) {
      throw new Error('createPipe requires at least one step.');
    }
    const firstKey = this.#keys[0];
    const fns = { [firstKey]: impl } as any;
    const uniqueKeys = [...new Set(this.#keys)];
    const allDefined = uniqueKeys.every(k => k in fns);
    if (allDefined) {
      return new PipeBuilderImpl(this.#keys, fns).build(fns);
    }
    return new PipeBuilderImpl(this.#keys, fns);
  }
}

export { Pipe };

export function createPipe<Keys extends readonly string[]>(
  ...keys: Keys
): PipeUntyped<Keys> {
  return Pipe.create(...keys) as any;
}
