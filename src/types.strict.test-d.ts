import { createPipe } from './pipe';
import type {
  FirstIndexOf,
  IndexOf,
  Next,
  Previous,
} from './types.strict';

type _Pr = ['a', 'b', 'c', 'd', 'e'];
expectTypeOf<Previous<_Pr, 0>>().toEqualTypeOf<never>();
expectTypeOf<Previous<_Pr, 1>>().toEqualTypeOf<'a'>();
expectTypeOf<Previous<_Pr, 2>>().toEqualTypeOf<'b'>();
expectTypeOf<Previous<_Pr, 3>>().toEqualTypeOf<'c'>();
expectTypeOf<Previous<_Pr, 4>>().toEqualTypeOf<'d'>();
expectTypeOf<Previous<_Pr, 5>>().toEqualTypeOf<never>();
expectTypeOf<Previous<_Pr, 6>>().toEqualTypeOf<never>();

type _Pr2 = ['x', 'y', { z: number }, boolean, string, Date];
expectTypeOf<Previous<_Pr2, 0>>().toEqualTypeOf<never>();
expectTypeOf<Previous<_Pr2, 1>>().toEqualTypeOf<'x'>();
expectTypeOf<Previous<_Pr2, 2>>().toEqualTypeOf<'y'>();
expectTypeOf<Previous<_Pr2, 3>>().toEqualTypeOf<{ z: number }>();
expectTypeOf<Previous<_Pr2, 3>['z']>().toEqualTypeOf<number>();
expectTypeOf<Previous<_Pr2, 4>>().toEqualTypeOf<boolean>();
expectTypeOf<Previous<_Pr2, 5>>().toEqualTypeOf<string>();
expectTypeOf<Previous<_Pr2, 6>>().toEqualTypeOf<never>();
expectTypeOf<Previous<_Pr2, 7>>().toEqualTypeOf<never>();

type _Nx = ['a', 'b', 'c', 'd', 'e'];
expectTypeOf<Next<_Nx, 0>>().toEqualTypeOf<'b'>();
expectTypeOf<Next<_Nx, 1>>().toEqualTypeOf<'c'>();
expectTypeOf<Next<_Nx, 2>>().toEqualTypeOf<'d'>();
expectTypeOf<Next<_Nx, 3>>().toEqualTypeOf<'e'>();
expectTypeOf<Next<_Nx, 4>>().toEqualTypeOf<never>();
expectTypeOf<Next<_Nx, 5>>().toEqualTypeOf<never>();
expectTypeOf<Next<_Nx, 6>>().toEqualTypeOf<never>();

type _Nx2 = ['x', 'y', { z: number }, boolean, string, Date];
expectTypeOf<Next<_Nx2, 0>>().toEqualTypeOf<'y'>();
expectTypeOf<Next<_Nx2, 1>>().toEqualTypeOf<{ z: number }>();
expectTypeOf<Next<_Nx2, 2>>().toEqualTypeOf<boolean>();
expectTypeOf<Next<_Nx2, 3>>().toEqualTypeOf<string>();
expectTypeOf<Next<_Nx2, 4>>().toEqualTypeOf<Date>();
expectTypeOf<Next<_Nx2, 5>>().toEqualTypeOf<never>();
expectTypeOf<Next<_Nx2, 6>>().toEqualTypeOf<never>();

type _IdxOf = ['a', 'b', 'c', 'd', 'e'];
expectTypeOf<IndexOf<_IdxOf, 'a'>>().toEqualTypeOf<0>();
expectTypeOf<IndexOf<_IdxOf, 'b'>>().toEqualTypeOf<1>();
expectTypeOf<IndexOf<_IdxOf, 'c'>>().toEqualTypeOf<2>();
expectTypeOf<IndexOf<_IdxOf, 'd'>>().toEqualTypeOf<3>();
expectTypeOf<IndexOf<_IdxOf, 'e'>>().toEqualTypeOf<4>();
expectTypeOf<IndexOf<_IdxOf, 'f'>>().toEqualTypeOf<never>();

type _IdxOf2 = ['x', 'y', { z: number }, boolean, string, Date, 'x'];
expectTypeOf<IndexOf<_IdxOf2, 'x'>>().toEqualTypeOf<0 | 6>();
expectTypeOf<FirstIndexOf<_IdxOf2, 'x'>>().toEqualTypeOf<0>();
expectTypeOf<IndexOf<_IdxOf2, 'y'>>().toEqualTypeOf<1>();
expectTypeOf<FirstIndexOf<_IdxOf2, 'y'>>().toEqualTypeOf<1>();
expectTypeOf<IndexOf<_IdxOf2, { z: number }>>().toEqualTypeOf<2>();
expectTypeOf<IndexOf<_IdxOf2, boolean>>().toEqualTypeOf<3>();
expectTypeOf<IndexOf<_IdxOf2, string>>().toEqualTypeOf<0 | 1 | 4 | 6>();
expectTypeOf<FirstIndexOf<_IdxOf2, string>>().toEqualTypeOf<0>();
expectTypeOf<IndexOf<_IdxOf2, Date>>().toEqualTypeOf<5>();
expectTypeOf<IndexOf<_IdxOf2, number>>().toEqualTypeOf<never>();

createPipe('add1', 'double', 'add1', 'double', 'add1').init(
  // @ts-expect-error --- no multiple args allowed in first step when keys are duplicated
  (a: number, b: number) => a + b,
);

createPipe('add1', 'double', 'add1', 'double', 'add1').init(
  (a: number) => a + 1,
);
