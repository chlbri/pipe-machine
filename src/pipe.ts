import { pipe as nomPipe } from '@bemedev/pipe';
import type {
  Describer,
  Fn,
  MaybePromiseFn,
  Registry,
  StepRef,
  ValidNext,
} from './types';

function nameOf<N extends string>(ref: StepRef<N>): N {
  return typeof ref === 'string' ? ref : (ref as Describer<N>).name;
}

/**
 * A strongly-typed pipeline machine that composes named functions.
 *
 * Steps are declared by name using {@link Pipe.define} or {@link Pipe.type},
 * then wired together into a pipeline via {@link Pipe#pipe}.
 *
 * @example
 * ```typescript
 * const machine = Pipe
 *   .define('trim',   (s: string)  => s.trim())
 *   .define('upper',  (s: string)  => s.toUpperCase())
 *   .define('wrap',   (s: string)  => `[${s}]`);
 *
 * const format = machine.pipe('trim', 'upper', 'wrap');
 * format('  hello  '); // '[HELLO]'
 * ```
 */
export class Pipe<TDefs extends Registry = Record<never, never>> {
  private readonly _defs: Record<string, Fn | undefined>;

  private constructor(defs: Record<string, Fn | undefined>) {
    this._defs = defs;
  }

  // ── Static factory ──────────────────────────────────────────────────────

  /**
   * Start building a `Pipe` machine by registering a named step with its
   * function implementation.
   *
   * @example
   * ```typescript
   * const m = Pipe.define('add1', (x: number) => x + 1);
   * ```
   */
  static define<N extends string, F extends Fn>(
    name: N,
    fn: F,
  ): Pipe<Record<N, F>> {
    return new Pipe<Record<N, F>>({ [name]: fn });
  }

  /**
   * Start building a `Pipe` machine by declaring the **type** of a named
   * step without providing an implementation yet.
   *
   * Returns a curried function so TypeScript can infer the step's name
   * as a literal type while you supply the function type explicitly:
   *
   * @example
   * ```typescript
   * const m = Pipe
   *   .type<(x: number) => string>()('numToStr')
   *   .impl('numToStr', x => x.toString());
   * ```
   */
  static type<F extends Fn>(): <N extends string>(
    name: N,
  ) => Pipe<Record<N, F>> {
    return <N extends string>(name: N): Pipe<Record<N, F>> =>
      new Pipe<Record<N, F>>({ [name]: undefined });
  }

  // ── Instance methods ─────────────────────────────────────────────────────

  /**
   * Register a new named step with its function implementation.
   */
  define<N extends string, F extends Fn>(
    name: N,
    fn: F,
  ): Pipe<TDefs & Record<N, F>> {
    return new Pipe<TDefs & Record<N, F>>({ ...this._defs, [name]: fn });
  }

  /**
   * Declare the **type** of a new named step without providing an
   * implementation. Call {@link Pipe#impl} later to add the implementation.
   *
   * @example
   * ```typescript
   * const m = existing
   *   .type<(s: string) => boolean>()('hasContent')
   *   .impl('hasContent', s => s.length > 0);
   * ```
   */
  type<F extends Fn>(): <N extends string>(
    name: N,
  ) => Pipe<TDefs & Record<N, F>> {
    return <N extends string>(name: N): Pipe<TDefs & Record<N, F>> =>
      new Pipe<TDefs & Record<N, F>>({ ...this._defs, [name]: undefined });
  }

  /**
   * Provide the implementation for a step that was previously declared with
   * {@link Pipe.type} or {@link Pipe#type}. The function type is constrained
   * to match the earlier type declaration.
   */
  impl<N extends keyof TDefs & string>(
    name: N,
    fn: TDefs[N],
  ): Pipe<TDefs> {
    return new Pipe<TDefs>({ ...this._defs, [name]: fn as Fn });
  }

  // ── pipe() overloads ─────────────────────────────────────────────────────

  /**
   * Compose one or more named steps into a single function.
   *
   * Each step's input type must be compatible with the previous step's
   * return type (async or sync). TypeScript will report a type error if an
   * incompatible step name is used.
   *
   * Overloads are provided for up to **10** steps with full type inference.
   * For longer pipelines use {@link Pipe#notTyped}.
   *
   * @example
   * ```typescript
   * const fn = machine.pipe('trim', 'upper');
   * fn('  hi  '); // 'HI'
   * ```
   */
  pipe<K1 extends keyof TDefs & string>(s1: StepRef<K1>): TDefs[K1];

  pipe<K1 extends keyof TDefs & string, K2 extends ValidNext<TDefs, K1>>(
    s1: StepRef<K1>,
    s2: StepRef<K2>,
  ): MaybePromiseFn<
    Parameters<TDefs[K1]>,
    [ReturnType<TDefs[K1]>, ReturnType<TDefs[K2]>]
  >;

  pipe<
    K1 extends keyof TDefs & string,
    K2 extends ValidNext<TDefs, K1>,
    K3 extends ValidNext<TDefs, K2>,
  >(
    s1: StepRef<K1>,
    s2: StepRef<K2>,
    s3: StepRef<K3>,
  ): MaybePromiseFn<
    Parameters<TDefs[K1]>,
    [ReturnType<TDefs[K1]>, ReturnType<TDefs[K2]>, ReturnType<TDefs[K3]>]
  >;

  pipe<
    K1 extends keyof TDefs & string,
    K2 extends ValidNext<TDefs, K1>,
    K3 extends ValidNext<TDefs, K2>,
    K4 extends ValidNext<TDefs, K3>,
  >(
    s1: StepRef<K1>,
    s2: StepRef<K2>,
    s3: StepRef<K3>,
    s4: StepRef<K4>,
  ): MaybePromiseFn<
    Parameters<TDefs[K1]>,
    [
      ReturnType<TDefs[K1]>,
      ReturnType<TDefs[K2]>,
      ReturnType<TDefs[K3]>,
      ReturnType<TDefs[K4]>,
    ]
  >;

  pipe<
    K1 extends keyof TDefs & string,
    K2 extends ValidNext<TDefs, K1>,
    K3 extends ValidNext<TDefs, K2>,
    K4 extends ValidNext<TDefs, K3>,
    K5 extends ValidNext<TDefs, K4>,
  >(
    s1: StepRef<K1>,
    s2: StepRef<K2>,
    s3: StepRef<K3>,
    s4: StepRef<K4>,
    s5: StepRef<K5>,
  ): MaybePromiseFn<
    Parameters<TDefs[K1]>,
    [
      ReturnType<TDefs[K1]>,
      ReturnType<TDefs[K2]>,
      ReturnType<TDefs[K3]>,
      ReturnType<TDefs[K4]>,
      ReturnType<TDefs[K5]>,
    ]
  >;

  pipe<
    K1 extends keyof TDefs & string,
    K2 extends ValidNext<TDefs, K1>,
    K3 extends ValidNext<TDefs, K2>,
    K4 extends ValidNext<TDefs, K3>,
    K5 extends ValidNext<TDefs, K4>,
    K6 extends ValidNext<TDefs, K5>,
  >(
    s1: StepRef<K1>,
    s2: StepRef<K2>,
    s3: StepRef<K3>,
    s4: StepRef<K4>,
    s5: StepRef<K5>,
    s6: StepRef<K6>,
  ): MaybePromiseFn<
    Parameters<TDefs[K1]>,
    [
      ReturnType<TDefs[K1]>,
      ReturnType<TDefs[K2]>,
      ReturnType<TDefs[K3]>,
      ReturnType<TDefs[K4]>,
      ReturnType<TDefs[K5]>,
      ReturnType<TDefs[K6]>,
    ]
  >;

  pipe<
    K1 extends keyof TDefs & string,
    K2 extends ValidNext<TDefs, K1>,
    K3 extends ValidNext<TDefs, K2>,
    K4 extends ValidNext<TDefs, K3>,
    K5 extends ValidNext<TDefs, K4>,
    K6 extends ValidNext<TDefs, K5>,
    K7 extends ValidNext<TDefs, K6>,
  >(
    s1: StepRef<K1>,
    s2: StepRef<K2>,
    s3: StepRef<K3>,
    s4: StepRef<K4>,
    s5: StepRef<K5>,
    s6: StepRef<K6>,
    s7: StepRef<K7>,
  ): MaybePromiseFn<
    Parameters<TDefs[K1]>,
    [
      ReturnType<TDefs[K1]>,
      ReturnType<TDefs[K2]>,
      ReturnType<TDefs[K3]>,
      ReturnType<TDefs[K4]>,
      ReturnType<TDefs[K5]>,
      ReturnType<TDefs[K6]>,
      ReturnType<TDefs[K7]>,
    ]
  >;

  pipe<
    K1 extends keyof TDefs & string,
    K2 extends ValidNext<TDefs, K1>,
    K3 extends ValidNext<TDefs, K2>,
    K4 extends ValidNext<TDefs, K3>,
    K5 extends ValidNext<TDefs, K4>,
    K6 extends ValidNext<TDefs, K5>,
    K7 extends ValidNext<TDefs, K6>,
    K8 extends ValidNext<TDefs, K7>,
  >(
    s1: StepRef<K1>,
    s2: StepRef<K2>,
    s3: StepRef<K3>,
    s4: StepRef<K4>,
    s5: StepRef<K5>,
    s6: StepRef<K6>,
    s7: StepRef<K7>,
    s8: StepRef<K8>,
  ): MaybePromiseFn<
    Parameters<TDefs[K1]>,
    [
      ReturnType<TDefs[K1]>,
      ReturnType<TDefs[K2]>,
      ReturnType<TDefs[K3]>,
      ReturnType<TDefs[K4]>,
      ReturnType<TDefs[K5]>,
      ReturnType<TDefs[K6]>,
      ReturnType<TDefs[K7]>,
      ReturnType<TDefs[K8]>,
    ]
  >;

  pipe<
    K1 extends keyof TDefs & string,
    K2 extends ValidNext<TDefs, K1>,
    K3 extends ValidNext<TDefs, K2>,
    K4 extends ValidNext<TDefs, K3>,
    K5 extends ValidNext<TDefs, K4>,
    K6 extends ValidNext<TDefs, K5>,
    K7 extends ValidNext<TDefs, K6>,
    K8 extends ValidNext<TDefs, K7>,
    K9 extends ValidNext<TDefs, K8>,
  >(
    s1: StepRef<K1>,
    s2: StepRef<K2>,
    s3: StepRef<K3>,
    s4: StepRef<K4>,
    s5: StepRef<K5>,
    s6: StepRef<K6>,
    s7: StepRef<K7>,
    s8: StepRef<K8>,
    s9: StepRef<K9>,
  ): MaybePromiseFn<
    Parameters<TDefs[K1]>,
    [
      ReturnType<TDefs[K1]>,
      ReturnType<TDefs[K2]>,
      ReturnType<TDefs[K3]>,
      ReturnType<TDefs[K4]>,
      ReturnType<TDefs[K5]>,
      ReturnType<TDefs[K6]>,
      ReturnType<TDefs[K7]>,
      ReturnType<TDefs[K8]>,
      ReturnType<TDefs[K9]>,
    ]
  >;

  pipe<
    K1 extends keyof TDefs & string,
    K2 extends ValidNext<TDefs, K1>,
    K3 extends ValidNext<TDefs, K2>,
    K4 extends ValidNext<TDefs, K3>,
    K5 extends ValidNext<TDefs, K4>,
    K6 extends ValidNext<TDefs, K5>,
    K7 extends ValidNext<TDefs, K6>,
    K8 extends ValidNext<TDefs, K7>,
    K9 extends ValidNext<TDefs, K8>,
    K10 extends ValidNext<TDefs, K9>,
  >(
    s1: StepRef<K1>,
    s2: StepRef<K2>,
    s3: StepRef<K3>,
    s4: StepRef<K4>,
    s5: StepRef<K5>,
    s6: StepRef<K6>,
    s7: StepRef<K7>,
    s8: StepRef<K8>,
    s9: StepRef<K9>,
    s10: StepRef<K10>,
  ): MaybePromiseFn<
    Parameters<TDefs[K1]>,
    [
      ReturnType<TDefs[K1]>,
      ReturnType<TDefs[K2]>,
      ReturnType<TDefs[K3]>,
      ReturnType<TDefs[K4]>,
      ReturnType<TDefs[K5]>,
      ReturnType<TDefs[K6]>,
      ReturnType<TDefs[K7]>,
      ReturnType<TDefs[K8]>,
      ReturnType<TDefs[K9]>,
      ReturnType<TDefs[K10]>,
    ]
  >;

  // Implementation (runtime)
  pipe(...steps: StepRef[]): Fn {
    if (steps.length === 0) {
      throw new Error('Pipe.pipe() requires at least one step.');
    }
    const fns = steps.map(ref => {
      const name = nameOf(ref);
      const fn = this._defs[name];
      if (typeof fn !== 'function') {
        throw new Error(
          `Step "${name}" is not implemented. Use .define() or .impl() to provide an implementation.`,
        );
      }
      return fn;
    });
    return nomPipe.notTyped(...(fns as [Fn, ...Fn[]]));
  }

  /**
   * Compose any number of named steps without strict type checking.
   * Use this when your pipeline exceeds 10 steps or when the type
   * constraints are too complex to express.
   */
  notTyped(...steps: StepRef[]): Fn {
    if (steps.length === 0) {
      throw new Error('Pipe.notTyped() requires at least one step.');
    }
    const fns = steps.map(ref => {
      const name = nameOf(ref);
      const fn = this._defs[name];
      if (typeof fn !== 'function') {
        throw new Error(
          `Step "${name}" is not implemented. Use .define() or .impl() to provide an implementation.`,
        );
      }
      return fn;
    });
    return nomPipe.notTyped(...(fns as [Fn, ...Fn[]]));
  }
}
