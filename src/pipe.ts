import { notTyped } from '@bemedev/pipe';
import type { Fn, PipeCreated, PipeTyped, TypeSpec } from './types';

class PipeTypedImpl<Keys extends readonly string[]> {
  readonly #keys: Keys;

  constructor(keys: Keys) {
    this.#keys = keys;
  }

  define(impl: Record<string, Fn>): any {
    // Map over original keys (with duplicates) so duplicate steps run in order
    const ordered = (this.#keys as readonly string[]).map(k => impl[k]);
    const composed = notTyped(...(ordered as unknown as [Fn, ...Fn[]]));
    return Object.assign(composed, {
      define: (overrides: Record<string, Fn>) =>
        new PipeTypedImpl(this.#keys).define({ ...impl, ...overrides }),
    });
  }
}

class Pipe<Keys extends readonly string[]> implements PipeCreated<Keys> {
  readonly #keys: Keys;

  constructor(...keys: Keys) {
    if (keys.length === 0) {
      throw new Error('createPipe requires at least one step.');
    }
    this.#keys = keys;
  }

  type<T extends TypeSpec<Keys>>(): PipeTyped<Keys, T> {
    return new PipeTypedImpl(this.#keys) as any;
  }
}

export { Pipe };

export function createPipe<Keys extends readonly [string, ...string[]]>(
  ...keys: Keys
): PipeCreated<Keys> {
  return new Pipe(...keys) as any;
}
