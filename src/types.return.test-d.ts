import { createPipe } from './pipe';
import type { Fn, Pipeline } from './types';
import type { IsPromiseRecord } from './types.return';

type IPR1 = IsPromiseRecord<['a', 'b'], { a: Promise<string>; b: number }>;
expectTypeOf<IPR1>().toEqualTypeOf<true>();

type IPR2 = IsPromiseRecord<['a', 'b'], { a: string; b: number }>;
expectTypeOf<IPR2>().toEqualTypeOf<false>();

type _P1 = Pipeline<
  ['a', 'b'],
  { a: (x: number) => string; b: (y: string) => boolean },
  [x: number]
>;
expectTypeOf<_P1>().toEqualTypeOf<
  ((x: number) => boolean) & {
    define<TPartial extends Partial<Record<'a' | 'b', Fn>>>(
      overrides: TPartial,
    ): Pipeline<
      ['a', 'b'],
      { a: (x: number) => string; b: (y: string) => boolean } & TPartial
    >;
  }
>();

type P1 = ReturnType<_P1>;
expectTypeOf<P1>().toEqualTypeOf<boolean>();

const cr1 = createPipe('a', 'b').define({
  a: (x: number) => x.toString(),
  b: (y: string) => y.length > 2,
});
expectTypeOf(cr1).toBeFunction();
expectTypeOf(cr1).toHaveProperty('define');

const result = cr1(123);
expectTypeOf(result).toEqualTypeOf<boolean>();
