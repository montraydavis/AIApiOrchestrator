# SchemaProperty and Related Types

Describes properties in an API schema, including their type, location, and validation logic.

## Interface: ValidationResult

| Property   | Type       | Description                                       |
| ---------- | ---------- | ------------------------------------------------- |
| `isValid`  | `boolean`  | Indicates if the value is valid.                  |
| `errors`   | `string[]` | List of error messages if validation fails.       |
| `warnings` | `string[]` | List of warning messages for non-critical issues. |

## Interface: SchemaProperty<T = any>

| Property   | Type                                                | Description                                |
| ---------- | --------------------------------------------------- | ------------------------------------------ |
| `name`     | `string`                                            | The name of the property.                  |
| `type`     | `ParameterType`                                     | The data type of the property.             |
| `required` | `boolean`                                           | Whether the property is required.          |
| `location` | `'query' | 'path' | 'body' | 'header' | 'response'` | The location of the property in the API.   |
| `schema`   | `ParameterDefinition`                               | The parameter definition for the property. |
| `endpoint` | `ApiEndpoint`                                       | The API endpoint this property belongs to. |

### Methods

- `mapTo<TTarget>(target: SchemaProperty<TTarget>, mapping?: string): ConnectionBuilder<T, TTarget>` — Maps this property to a target property, optionally using a mapping string.
- `transform<TTransformed>(transformer: TransformFunction<T, TTransformed>): TransformedProperty<TTransformed>` — Transforms the property value using a transformer function.
- `validate(value: T): ValidationResult` — Validates a value against this property.

## Specializations

### PathProperty<T>

- Extends `SchemaProperty<T>` with `location: 'path'`.

### QueryProperty<T>

- Extends `SchemaProperty<T>` with `location: 'query'`.

### BodyProperty<T>

- Extends `SchemaProperty<T>` with `location: 'body'` and `jsonPath: string`.

### ResponseProperty<T>

- Extends `SchemaProperty<T>` with `location: 'response'`, `jsonPath: string`, and `validateAgainstResponse(response: any): ValidationResult`.

## Type: TransformFunction<TInput, TOutput>

Represents a transformation function for schema property values.

| Property    | Type                         | Description                                     |
| ----------- | ---------------------------- | ----------------------------------------------- |
| `name`      | `string`                     | The name of the transformation.                 |
| `transform` | `(input: TInput) => TOutput` | The function that performs the transformation.  |
| `validate?` | `(input: TInput) => boolean` | (Optional) Validate the input before transform. |

## Usage Example

```typescript
import { SchemaProperty } from './SchemaProperty';

function validateUsername(prop: SchemaProperty<string>) {
  return prop.validate('alice');
}
```
