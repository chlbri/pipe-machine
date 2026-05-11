import { createPipe } from './pipe';
import type { Pipeline } from './types';
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
type _P1Expected = ReturnType<_P1>;
expectTypeOf<_P1Expected>().toEqualTypeOf<boolean>();

type P1 = ReturnType<_P1>;
expectTypeOf<P1>().toEqualTypeOf<boolean>();

const cr1 = createPipe('a', 'b')
  .init((x: number) => x.toString())
  .define('b', (y: string) => y.length > 2);
expectTypeOf(cr1).toBeFunction();
expectTypeOf(cr1).toHaveProperty('define');

const result = cr1(123);
expectTypeOf(result).toEqualTypeOf<boolean>();

const constrainedPipe = createPipe('a', 'b')
  .init((x: number) => x.toString())
  .define('b', (y: string) => y.length);

type ConstrainedPipeType = typeof constrainedPipe;
expectTypeOf<ReturnType<ConstrainedPipeType>>().toEqualTypeOf<number>();

// Valid override - 'b' expects string (from 'a' which outputs string)
const validOverride = constrainedPipe.define({
  b: (y: string) => y.toUpperCase().length,
});
expectTypeOf<ReturnType<typeof validOverride>>().toEqualTypeOf<number>();
