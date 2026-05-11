import { notTyped } from '@bemedev/pipe';
import type { Fn, Pipeline, PipeUntyped } from './types';
import type { Dependances } from './types.strict';

class Pipe<
  Keys extends readonly string[],
  // Remains definitions of functions
  D extends Dependances<Keys> = Dependances<Keys>,
> implements PipeUntyped<Keys> {
  readonly #keys: Keys;

  private constructor(keys: Keys) {
    this.#keys = keys;
  }

  static create<Keys extends readonly string[]>(
    ...keys: Keys
  ): PipeUntyped<Keys> {
    return new Pipe(keys) as unknown as PipeUntyped<Keys>;
  }

  define<const TFns extends Record<Keys[number], Fn>>(
    fns: TFns,
  ): Pipeline<Keys, TFns> {
    if (this.#keys.length === 0) {
      throw new Error('createPipe requires at least one step.');
    }
    const ordered = this.#keys.map(k => {
      const fn = fns[k as Keys[number]];
      if (typeof fn !== 'function') {
        throw new Error(
          `Step "${k}" is not implemented. Pass it in the define() record.`,
        );
      }
      return fn;
    });
    const composed = notTyped(...(ordered as unknown as [Fn, ...Fn[]]));
    const result = Object.assign(composed, {
      define: (overrides: Partial<Record<Keys[number], Fn>>) => {
        const merged: any = { ...fns, ...overrides };
        return this.define(merged);
      },
    }) as Pipeline<Keys, TFns>;
    return result;
  }
}

export { Pipe };

export function createPipe<Keys extends readonly string[]>(
  ...keys: Keys
): PipeUntyped<Keys> {
  return Pipe.create(...keys) as any;
}
