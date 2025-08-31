# Transforms

Predefined transformation helpers that return `TransformFunction`s for common conversions and mappings.

## Available Transforms

### `toString<T>(): TransformFunction<T, string>`

- **name**: `string`
- Converts the input to a string using `String(input)`.

### `toNumber(): TransformFunction<string, number>`

- **name**: `number`
- Converts a string to a number using `Number(input)`.
- Validates that the input is a numeric string.

### `addBearerPrefix(): TransformFunction<string, string>`

- **name**: `bearer-prefix`
- Prefixes the token with `Bearer`.
- Validates that the token is a non-empty string.

### `wrapInArray<T>(): TransformFunction<T, T[]>`

- **name**: `array-wrap`
- Wraps the input value in an array.

### `extractFirst<T>(): TransformFunction<T[], T | undefined>`

- **name**: `array-first`
- Returns the first element of the input array.
- Validates that the input is a non-empty array.

### `toUpperCase(): TransformFunction<string, string>`

- **name**: `upper`
- Converts the input string to uppercase.

### `toLowerCase(): TransformFunction<string, string>`

- **name**: `lower`
- Converts the input string to lowercase.

## Usage Example

```typescript
import { Transforms } from './Transforms';

const upper = Transforms.toUpperCase();
console.log(upper.transform('alice')); // 'ALICE'
```
