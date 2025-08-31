# TransformedProperty<T>

Represents a property that has been transformed using a `TransformFunction`, allowing it to map to other properties with the transformed type.

## Constructor

### `new TransformedProperty<T>(property: SchemaProperty<any>, transformer: TransformFunction<any, T>)`

- **property**: The original schema property.
- **transformer**: The transformation function applied to the property value.

## Methods

### `mapTo<TTarget>(target: SchemaProperty<TTarget>, mapping?: string): ConnectionBuilder<T, TTarget>`

Maps the transformed property to a target property, optionally using a mapping string. The connection remembers the applied transformer.

## Usage Example

```typescript
import { Transforms } from './Transforms';

// Suppose `usernameProp` is a SchemaProperty<string>
const transformed = usernameProp.transform(Transforms.toUpperCase());

// Map to a target property expecting uppercase string
const connection = transformed.mapTo(targetProp, 'Uppercase username for header');
```
