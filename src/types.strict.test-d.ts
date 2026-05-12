import type {
  FirstIndexOf,
  IndexOf,
  IsDuplicatedKey,
  Previous,
  RemoveIndexOf,
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

type RI1 = RemoveIndexOf<['a', 'b', 'c', 'd', 'e'], 2>; // ['a', 'b', 'd', 'e']
expectTypeOf<RI1>().toEqualTypeOf<['a', 'b', 'd', 'e']>();

type _IsD = ['a', 'b', 'c', 'd', 'e', 'a'];
type IsD1 = IsDuplicatedKey<_IsD, 'a'>; // true
expectTypeOf<IsD1>().toEqualTypeOf<true>();

type IsD2 = IsDuplicatedKey<_IsD, 'e'>;
expectTypeOf<IsD2>().toEqualTypeOf<false>();
