# @bemedev/pipe-machine

## Features

- **2-Step Builder** - Define input parameters and starting context directly via an initializer function in `createPipe`, then provide implementations in `.define()`.
- **Type Inference** - Automatic inference of inputs, context, and steps from your initializer function and configuration. No manual type specifications needed.
- **Strongly-Typed Pipes** - Full TypeScript type inference and validation throughout the pipeline.
- **Named-Step Support** - Create named pipeline steps for better code clarity and partial overrides.
- **Async Support** - Handle both synchronous and asynchronous function pipelines seamlessly.
- **Duplicate Key Support** - Reuse an action name to run the same function multiple times in the pipeline.

## Installation

```bash
npm install @bemedev/pipe-machine
# or
pnpm add @bemedev/pipe-machine
```

## Quick Start

```typescript
import { createPipe } from '@bemedev/pipe-machine';

const pipe = createPipe(
  (x: number) => ({ value: x }),
  'double',
  'add10'
).define({
  actions: {
    double: ctx => ({ value: ctx.value * 2 }),
    add10: ctx => ({ value: ctx.value + 10 })
  }
}).build(ctx => ctx.value);

pipe(5); // 20
```

## The 2-Step Flow

### Step 1 — `createPipe(initializer, ...configs)`

Declares the entry point function (which determines the inputs and initial context) and the ordered list of named steps or configurations in the pipeline.

```typescript
const builder = createPipe(
  (input: string) => ({ text: input, count: 0 }),
  'parse',
  'validate'
);
```

### Step 2 — `.define(impl)`

Provides the function implementations for actions, guards, and delays. Types are automatically inferred from the initializer function and the configuration array.

```typescript
const runner = builder.define({
  actions: {
    parse: ctx => ({ ...ctx, count: parseInt(ctx.text, 10) }),
    validate: ctx => ({ ...ctx, count: Math.abs(ctx.count) }),
  }
});

runner('−42'); // { text: '−42', count: 42 }
```

## Advanced Usage

### Duplicate keys

Repeat a key name to run that function more than once:

```typescript
const fn = createPipe(
  (x: number) => ({ value: x }),
  'add1', 'double', 'add1', 'double', 'add1'
).define({
  actions: {
    add1: ctx => ({ value: ctx.value + 1 }),
    double: ctx => ({ value: ctx.value * 2 }),
  }
}).build(ctx => ctx.value);

fn(2); // ((((2+1)*2)+1)*2)+1 = 15
```

All actions operate on the unified context type returned by the initializer, mapping `Context` to `Context | Promise<Context>`.

### Multi-argument first step

The initializer function can accept any number of parameters, which defines the inputs of the completed pipeline:

```typescript
const fn = createPipe(
  (a: number, b: number) => ({ value: Math.hypot(a, b) }),
  'double'
).define({
  actions: {
    double: ctx => ({ value: ctx.value * 2 }),
  }
}).build(ctx => ctx.value);

fn(3, 4); // 10
```

### Async pipelines

If the initializer function or any step action returns a `Promise`, the entire pipeline becomes async (returns a `Promise`):

```typescript
const fn = createPipe(
  async (url: string) => ({ text: await (await fetch(url)).text() }),
  'parse'
).define({
  actions: {
    parse: ctx => ({ value: parseInt(ctx.text, 10) }),
  }
}).build(ctx => ctx.value);

await fn('https://example.com/value'); // number
```

### Partial overrides

After building a pipeline, create variants by overriding specific steps:

```typescript
const base = createPipe(
  (x: number) => ({ value: x }),
  'add1',
  'double'
).define({
  actions: {
    add1: ctx => ({ value: ctx.value + 1 }),
    double: ctx => ({ value: ctx.value * 2 }),
  }
});

base(5); // { value: 12 }

const tripled = base.define({
  actions: {
    double: ctx => ({ value: ctx.value * 3 }),
  }
});
tripled(5); // { value: 18 }
```

## API

### `createPipe(initializer: (...params) => Context, ...configs: Config[]): MachineTyped`

Creates a pipeline builder. The `initializer` function defines the parameter inputs and initial context. The `configs` are an ordered sequence of configurations, which can be plain actions (strings/Describers), conditional branches (`Condition[]`), or delayed actions (`Delayed`).

### `.define(impl: MachineDefineInput): MachinePipeline`

Provides implementations for the required actions, guards, and delays. Returns the completed, callable pipeline.

### `pipeline(...params): Context | Promise<Context>`

Calls the composed pipeline. Returns a `Promise` if the initializer or any action/delay is async, otherwise returns synchronously.

### `pipeline.define(overrides: Partial<MachineDefineInput>): MachinePipeline`

Creates a new pipeline with some actions, guards, or delays replaced. Original pipeline is unchanged.

### `pipeline.build<T>(select: (ctx: Context) => T): (...params) => T`

Transforms the output of the pipeline using a selector function. Returns a Promise-based function if the pipeline is async.

## Exported Types

| Type                 | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `MachineTyped`       | Returned by `createPipe(...)`                                      |
| `MachinePipeline`    | Completed callable pipeline                                        |
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
