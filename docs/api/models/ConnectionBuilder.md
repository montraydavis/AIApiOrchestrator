# ConnectionBuilder

A builder class for defining a connection between two schema properties, including optional mapping and transformation logic.

## Type Parameters

- `TSource` — The type of the source schema property.
- `TTarget` — The type of the target schema property.

## Constructor

### `new ConnectionBuilder(source: SchemaProperty<TSource>, target: SchemaProperty<TTarget>, mapping?: string)`

- **source**: The source schema property.
- **target**: The target schema property.
- **mapping?**: (Optional) A natural language mapping or description for the connection.

## Methods

### `withTransform(transform: TransformFunction<TSource, TTarget>): ConnectionBuilder<TSource, TTarget>`

Specifies a transformation function to apply to the source value before assigning to the target.

### `withMapping(mapping: string): ConnectionBuilder<TSource, TTarget>`

Sets a natural language mapping or description for the connection.

### `build(): EndpointConnection`

Builds and returns the `EndpointConnection` object representing this connection.

## Usage Example

```typescript
import { ConnectionBuilder } from './ConnectionBuilder';
import { SchemaProperty } from './SchemaProperty';
import { Transforms } from './Transforms';

const sourceProp: SchemaProperty<string> = /* ... */;
const targetProp: SchemaProperty<number> = /* ... */;

const connection = new ConnectionBuilder(sourceProp, targetProp)
  .withTransform(Transforms.toNumber())
  .withMapping('Convert username to user ID')
  .build();
```
