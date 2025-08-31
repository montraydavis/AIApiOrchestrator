# ParameterType

Represents the supported data types for API parameters.

```typescript
export type ParameterType = 'string' | 'number' | 'boolean' | 'object' | 'array';
```

- `string`: A string value.
- `number`: A numeric value.
- `boolean`: A boolean value (true or false).
- `object`: An object value (key-value pairs).
- `array`: An array of values.

## Usage Example

```typescript
import { ParameterType } from './ParameterType';

const t: ParameterType = 'string';
```
