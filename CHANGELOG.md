## CHANGELOG

<details>
<summary>

## **[1.0.2] - 12/05/2026** => _12:30_

</summary>

- Update `README.md`: ajout d'une note de compatibilité avertissant que la
  version 2.x.x+ introduira des changements de types incompatibles avec
  1.x.x
- <u>Test coverage **_100%_**</u>

</details>

<br/>

<details>
<summary>

## **[1.0.1] - 12/05/2026** => _12:04_

</summary>

- Add `Describer` type — step keys can now be `string` or
  `{ name: string; description: string }`, enabling human-readable step
  descriptions
- Add `descriptionOf(key)` method to `PipeCreated`, `PipeTyped`, and
  `Pipeline` — retrieve the description of a step at runtime
- Add new type exports: `Describer`, `FromDescriber<D>`,
  `FromDescribers<Keys>`, `IndexesOfArray<T>`
- Add `helpers.ts` with runtime helpers `fromDescriber` and
  `fromDescribers`
- Fix CI script: include missing test command in the pipeline
- <u>Test coverage **_100%_**</u>

</details>

<br/>

<details>
<summary>

## **[1.0.0] - 12/05/2026** => _10:00_

</summary>

- **BREAKING** Remove `init()` method and positional `define(name, fn)` /
  `define(fn)` overloads — replaced by the new 3-step API
- **BREAKING** Remove type exports `PipeUntyped` and `PipeBuilderType`
- Add new 3-step builder API:
  `createPipe(...keys) → .type<T>() → .define(impl)`
- Add identity typing: unspecified step keys default to pass-through typing
  (same input/output type as the previous step)
- Add optional `StandardSchemaV1` runtime argument to `.type()` for
  schema-based type validation
- Add new type exports: `PipeCreated`, `PipeTyped`, `DefineImpl`,
  `ResolvedReturnTypes`, `TypeSpec`
- Add new type exports: `IsDuplicatedKey<T, K>`, `RemoveIndexOf<T, I>`,
  `IdentityFn<T>`, `_PrevRM` (désormais publics)
- Add re-export of `StandardSchemaV1` from `@standard-schema/spec`
- Add `@bemedev/typings` integration for runtime type-spec construction
- Add `@standard-schema/spec` as runtime dependency; add `@bemedev/typings`
  as devDependency
- Add `valibot ^1.4.0` and `zod ^4.4.3` as devDependencies (tests
  d'intégration SchemaV1)
- Enhance `DefineImpl`: les clés dupliquées imposent désormais le type
  `IdentityFn<_PrevRM>` pour garantir la transparence de la valeur
- Refactor `pipe.ts`: replace `PipeBuilderImpl` + `Pipe.create()` with
  leaner `PipeTypedImpl` + direct `Pipe` constructor
- Refactor `types.strict.ts`: remove unused utilities (`Next`,
  `Dependances`, `FilterTuple`, `GetAtIndex`, `PreviousReturnType`)
- <u>Test coverage **_100%_**</u>

</details>

<br/>

<details>
<summary>

## **[0.1.2] - 11/05/2026** => _15:51_

</summary>

- Update: Clarify API documentation in README by removing outdated
  `build()` method reference
- <u>Test coverage **_100%_**</u>

</details>

<br/>

<details>
<summary>

## **[0.1.1] - 11/05/2026** => _15:44_

</summary>

- Update: Correct API documentation in README to reflect `define()` method
  naming
- <u>Test coverage **_100%_**</u>

</details>

<br/>

<details>
<summary>

## **[0.1.0] - 11/05/2026** => _15:28_

</summary>

- Fiest release of `@bemedev/pipe-machine` package
- Add strongly-typed `Pipe` class with fluent builder pattern for function
  composition
- Add named-step Pipe implementation using `@bemedev/pipe` library
- Add `@standard-schema/spec` integration for schema validation support
- Add comprehensive TypeScript type exports (`Pipe`, `Fn`, `Pipeline`,
  `PipeBuilderType`, etc.)
- Add support for both sync and async function pipelines via
  `MaybePromiseFn`
- Fix error message in `notTyped()` method for better debugging
- <u>Test coverage **_100%_**</u>

</details>

<br/>
<br/>

<br/>

## Auteur

chlbri (bri_lvi@icloud.com)

[My github](https://github.com/chlbri?tab=repositories)

[<svg width="98" height="96" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="#24292f"/></svg>](https://github.com/chlbri?tab=repositories)

<br/>

## Liens

- [Documentation](https://github.com/chlbri/new-package)
