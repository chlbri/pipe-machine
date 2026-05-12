import { notTyped } from "@bemedev/pipe";
import { fromDescriber, fromDescribers } from "./helpers";
import type {
  Describer,
  Fn,
  FromDescribers,
  PipeCreated,
  PipeTyped,
  TypeSpec,
} from "./types";

class PipeTypedImpl<Describers extends readonly Describer[]> {
  readonly #keys: FromDescribers<Describers>;
  readonly #describers: Describers;

  constructor(keys: Describers) {
    this.#describers = keys;
    this.#keys = fromDescribers(this.#describers);
  }

  descriptionOf = (key: string) => {
    const out = this.#describers.find((d) => fromDescriber(d) === key)!;

    return typeof out === "string" ? out : out.description;
  };

  define = (impl: Record<string, Fn>) => {
    // Map over original keys (with duplicates) so duplicate steps run in order
    const ordered = (this.#keys as readonly string[]).map((k) => impl[k]);
    const composed = notTyped(...(ordered as unknown as [Fn, ...Fn[]]));
    return Object.assign(composed, {
      define: (overrides: Record<string, Fn>) =>
        new PipeTypedImpl(this.#keys).define({ ...impl, ...overrides }),
      descriptionOf: this.descriptionOf,
    });
  };
}

class Pipe<
  Describers extends readonly Describer[],
  Keys extends FromDescribers<Describers> = FromDescribers<Describers>,
> implements PipeCreated<Keys> {
  readonly #describers: Describers;

  constructor(...keys: Describers) {
    if (keys.length === 0) {
      throw new Error("createPipe requires at least one step.");
    }
    this.#describers = keys;
  }

  descriptionOf = (key: string) => {
    const out = this.#describers.find((d) => fromDescriber(d) === key)!;

    return typeof out === "string" ? out : out.description;
  };

  type = <T extends TypeSpec<Keys>>(): PipeTyped<Keys, T> => {
    return new PipeTypedImpl(this.#describers) as any;
  };
}

export { Pipe };

export function createPipe<
  const Keys extends readonly [Describer, ...Describer[]],
>(...keys: Keys): PipeCreated<FromDescribers<Keys>> {
  return new Pipe(...keys) as any;
}
