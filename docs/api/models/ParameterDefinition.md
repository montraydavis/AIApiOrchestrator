# ParameterDefinition

Defines a parameter for an API endpoint, including type, validation, and documentation metadata.

## Interface: ParameterDefinition

| Property        | Type                                                             | Description                                                                |
| --------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `name`          | `string`                                                         | The name of the parameter.                                                 |
| `type`          | `ParameterType`                                                  | The data type of the parameter.                                            |
| `required`      | `boolean`                                                        | Whether the parameter is required.                                         |
| `defaultValue?` | `any`                                                            | (Optional) The default value for the parameter.                            |
| `description?`  | `string`                                                         | (Optional) A human-readable description of the parameter.                  |
| `items?`        | `ParameterDefinition`                                            | (Optional) Definition of the item type if the parameter is an array.       |
| `properties?`   | `Record<string, ParameterDefinition>`                            | (Optional) Definitions of nested properties if the parameter is an object. |
| `aiMapped?`     | `boolean`                                                        | (Optional) Indicates if this parameter was generated or mapped by AI.      |
| `examples?`     | `any[]`                                                          | (Optional) Example values for documentation or testing.                    |
| `validation?`   | `{ min?: number; max?: number; pattern?: string; enum?: any[] }` | (Optional) Validation rules for the parameter.                             |

## Validation

- `min`: Minimum value (for numbers).
- `max`: Maximum value (for numbers).
- `pattern`: Regex pattern the value must match (for strings).
- `enum`: List of allowed values.

## Usage Example

```typescript
import { ParameterDefinition } from './ParameterDefinition';

const limitParam: ParameterDefinition = {
  name: 'limit',
  type: 'number',
  required: false,
  defaultValue: 10,
  description: 'Max number of items to return',
  validation: { min: 1, max: 100 },
  examples: [10, 25, 50]
};

const tagsParam: ParameterDefinition = {
  name: 'tags',
  type: 'array',
  required: false,
  items: { name: 'tag', type: 'string', required: true }
};
```
