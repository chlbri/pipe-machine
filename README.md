# @bemedev/pipe-machine

## Features

- **3-Step Builder** - Separate type declaration from implementation for
  maximum clarity: `createPipe → type → define`
- **Strongly-Typed Pipes** - Full TypeScript type inference and validation
  throughout the pipeline
- **Named-Step Support** - Create named pipeline steps for better code
  clarity and partial overrides
- **Explicit Type Spec** - Declare input/output types before providing
  implementations
- **Async Support** - Handle both synchronous and asynchronous function
  pipelines
- **Duplicate Key Support** - Reuse a step name to run the same function
  multiple times in the pipeline

## Installation

```bash
npm install @bemedev/pipe-machine
# or
pnpm add @bemedev/pipe-machine
```

## Quick Start

```typescript
import { createPipe } from '@bemedev/pipe-machine';

const pipe = createPipe('double', 'add10')
  .type<{
    double: { parameters: [number]; return: number };
    add10: number;
  }>()
  .define({
    double: x => x * 2,
    add10: x => x + 10,
  });

pipe(5); // 20
```

## The 3-Step Flow

### Step 1 — `createPipe(...keys)`

Declares the ordered list of named steps in the pipeline.

```typescript
const builder = createPipe('parse', 'validate', 'transform');
```

### Step 2 — `.type<TypeSpec>()`

Declares the TypeScript types for the pipeline — no runtime argument, pure
generic. Only the **first key** is required and must have the shape
`{ parameters: [...], return: ... }`. All other keys are optional and
specify just their **return type**. Unspecified keys default to **identity
typing** (pass-through: same input and output type as the previous step).

```typescript
const typed = builder.type<{
  parse: { parameters: [string]; return: number };
  validate: number; // (n: number) => number
  // 'transform' not listed → identity: (n: number) => number
}>();
```

### Step 3 — `.define(impl)`

Provides the function implementation for every unique key. Types are
enforced by the spec from `.type<T>()`.

```typescript
const pipeline = typed.define({
  parse: s => parseInt(s, 10),
  validate: n => Math.abs(n),
  transform: n => n * 100, // (number) => number — identity-typed
});

pipeline('−42'); // 4200
```

## Advanced Usage

### Duplicate keys

Repeat a key name to run that function more than once:

```typescript
const fn = createPipe('add1', 'double', 'add1', 'double', 'add1')
  .type<{
    add1: { parameters: [number]; return: number };
    double: number;
  }>()
  .define({ add1: x => x + 1, double: x => x * 2 });

fn(2); // ((((2+1)*2)+1)*2)+1 = 15
```

When a key appears more than once, its `DefineImpl` slot is typed as
`IdentityFn<PrevReturn>` — an identity function `(x: T) => T` — enforcing
that a duplicated step passes its input value through unchanged in type.
When the first key is duplicated, its `parameters` type is restricted to a
single-element tuple to prevent ambiguous multi-arg signatures.

### Multi-argument first step

```typescript
const fn = createPipe('hypot', 'double')
  .type<{
    hypot: { parameters: [number, number]; return: number };
    double: number;
  }>()
  .define({
    hypot: (a, b) => Math.hypot(a, b),
    double: x => x * 2,
  });

fn(3, 4); // 10
```

### Async pipelines

If any step returns a `Promise`, the entire pipeline becomes async:

```typescript
const fn = createPipe('fetch', 'parse')
  .type<{
    fetch: { parameters: [string]; return: Promise<string> };
    parse: number;
  }>()
  .define({
    fetch: async url => (await fetch(url)).text(),
    parse: s => parseInt(s, 10),
  });

await fn('https://example.com/value'); // number
```

### Partial overrides

After building a pipeline, create variants by overriding specific steps:

```typescript
const base = createPipe('add1', 'double')
  .type<{
    add1: { parameters: [number]; return: number };
    double: number;
  }>()
  .define({ add1: x => x + 1, double: x => x * 2 });

base(5); // 12

const tripled = base.define({ double: x => x * 3 });
tripled(5); // 18
```

## API

### `createPipe(...keys: Describer[]): MachineCreated`

Creates a pipeline builder with named steps. Each key can be a plain
`string` or a `{ name: string; description: string }` object to attach a
human-readable description. Throws if called with no keys. Returns an
object with a `.type<T>()` method.

### `.type<T extends MachineTypeSpec>(schema?: StandardSchemaV1): MachineTyped`

Declares types for the pipeline. `T` is a pure TypeScript generic with
shape `{ params: any[]; context: Record<string, any> }`. An optional
`StandardSchemaV1`-compatible schema (e.g. a `zod`, a `@bemedev/typings`
object, or `valibot` object) may be passed as a runtime argument for
schema-based validation. Returns an object with only a `.define(impl)`
method.

### `.define(impl: MachineDefineInput): MachinePipeline`

Provides implementations for actions and configuration. Returns the
completed, callable pipeline.

### `pipeline(...params): Context | Promise<Context>`

Calls the composed pipeline. Returns a `Promise` if any step is async,
otherwise returns synchronously. The return type matches the `context` type
from the `MachineTypeSpec`.

### `pipeline.define(overrides: Partial<MachineDefineInput>): MachinePipeline`

Creates a new pipeline with some actions or guards replaced. Original
pipeline is unchanged.

### `pipeline.build<T>(select: (ctx: Context) => T): (params) => T`

Transforms the output of the pipeline using a selector function.

## Exported Types

| Type                 | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `MachineCreated`     | Returned by `createPipe()`                                         |
| `MachineTyped`       | Returned by `.type<T>()`                                           |
| `MachinePipeline`    | Completed callable pipeline                                        |
| `MachineTypeSpec`    | Type spec shape: `{ params: any[]; context: Record<string, any> }` |
| `MachineDefineInput` | Shape of the `.define(impl)` argument                              |
| `Describer`          | Step key type: `string` or `{ name: string; description: string }` |
| `FromDescriber<D>`   | Extracts the string key name from a `Describer`                    |
| `Config`             | Configuration object shape for guards and delays                   |
| `Condition`          | Guard condition type                                               |
| `Delayed`            | Delayed action configuration with delay timing                     |
| `GuardConfig`        | Shape for guard configuration                                      |
| `ExtractActions<C>`  | Extracts action names from a config                                |
| `ExtractGuards<C>`   | Extracts guard names from a config                                 |
| `ExtractDelays<C>`   | Extracts delay names from a config                                 |
| `SoA`                | Struct-of-Arrays utility type                                      |

## Licence

MIT

## CHANGE_LOG

Read [CHANGELOG.md](CHANGELOG.md) for more details about the changes.

<br/>

## Author

chlbri (bri_lvi@icloud.com)

[My github](https://github.com/chlbri?tab=repositories)

[<svg width="98" height="96" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="#24292f"/></svg>](https://github.com/chlbri?tab=repositories)

<br/>

## Links

- [Repository](https://github.com/chlbri/pipe-machine)
- [npm Package](https://www.npmjs.com/package/@bemedev/pipe-machine)
