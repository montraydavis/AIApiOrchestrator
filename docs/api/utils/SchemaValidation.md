# SchemaValidation

A utility class for validating values against parameter definitions and schemas. Provides static methods for validating individual parameters, objects, and arrays, enforcing constraints such as type, required, min/max, pattern, and enum.

## Static Methods

### `validateParameter(value: any, definition: ParameterDefinition): ValidationResult`

Validates a single value against a parameter definition. Checks required, type, and additional constraints (min, max, pattern, enum). Handles nested validation for objects and arrays. Returns a `ValidationResult` with `isValid`, `errors`, and `warnings`.

**Validation Checks:**

- **Required**: Validates presence for required parameters
- **Type**: Ensures value matches expected ParameterType
- **Constraints**: Validates min/max bounds, patterns, enum values
- **Nested**: Recursively validates object properties and array items

**Error Handling:**

- Returns detailed error messages with parameter names and expected vs actual values
- Distinguishes between validation errors and warnings
- Provides context for nested validation failures

### `validateParameters(values: Record<string, any>, definitions: Record<string, ParameterDefinition>): ValidationResult`

Validates multiple parameters at once. Checks each parameter and also warns about unexpected parameters. Returns a `ValidationResult` with `isValid`, `errors`, and `warnings`.

**Features:**

- Validates all defined parameters individually
- Identifies unexpected parameters not in schema
- Aggregates errors and warnings from all validations
- Provides comprehensive validation for entire parameter sets

### `createParameter(name: string, type: ParameterType): ParameterBuilder`

Factory method to create a new `ParameterBuilder` for the given name and type.

## Private Methods

### `isEmpty(value: any): boolean`

Determines if a value is considered empty for validation purposes.

**Empty Values:**

- `null`
- `undefined`
- `''` (empty string)

Used to handle required field validation and skip unnecessary validation for optional empty fields.

### `validateType(value: any, expectedType: ParameterType): boolean`

Validates the type of a value against the expected parameter type.

**Supported Types:**

- `'string'`: typeof value === 'string'
- `'number'`: typeof value === 'number' && !isNaN(value) && isFinite(value)
- `'boolean'`: typeof value === 'boolean'
- `'array'`: Array.isArray(value)
- `'object'`: typeof value === 'object' && value !== null && !Array.isArray(value)

**Type Safety:**

- Validates numbers are finite and not NaN
- Distinguishes between objects and arrays
- Excludes null from object validation

### `validateConstraints(value: any, definition: ParameterDefinition, errors: string[], warnings: string[]): void`

Validates additional constraints on a value according to its parameter definition.

**Constraint Types:**

**Numeric Constraints:**

- `min`: Minimum value for numbers
- `max`: Maximum value for numbers

**String Constraints:**

- `pattern`: Regular expression validation

**Value Constraints:**

- `enum`: Restricted set of allowed values

**Error Messages:**

- Provides specific error messages for each constraint type
- Includes actual values and limits in error descriptions
- Contextualizes errors with parameter names

### `validateObject(value: any, properties: Record<string, ParameterDefinition>, errors: string[], warnings: string[]): void`

Validates an object value against its property definitions.

**Process:**

1. Validates the value is actually an object
2. Recursively validates each defined property
3. Aggregates validation results from nested properties
4. Maintains error context through nested validation

**Error Handling:**

- Reports type errors if value is not an object
- Propagates nested validation errors with context
- Handles missing or unexpected properties

### `validateArray(value: any, itemDefinition: ParameterDefinition, errors: string[], warnings: string[]): void`

Validates an array value against its item definition.

**Process:**

1. Validates the value is actually an array
2. Validates each item against the item definition
3. Provides indexed error messages for failed items
4. Aggregates all item validation results

**Error Context:**

- Uses array index in error messages: `parameterName[index]`
- Reports array type errors clearly
- Handles empty arrays appropriately

## Validation Result Structure

```typescript
interface ValidationResult {
  isValid: boolean;        // Overall validation success
  errors: string[];        // Validation error messages
  warnings: string[];      // Non-critical validation warnings
}
```

## Error Message Patterns

**Parameter Errors:**

- `"Required parameter 'name' is missing or empty"`
- `"Parameter 'age' expected type 'number' but got 'string'"`
- `"Parameter 'count' value 150 is above maximum 100"`

**Constraint Errors:**

- `"Parameter 'email' value does not match required pattern"`
- `"Parameter 'status' value 'invalid' is not in allowed values: active, inactive"`

**Nested Errors:**

- `"Expected object type for nested validation"`
- `"Expected array type for array validation"`

**Contextual Errors:**

- `"items[0]: Required parameter 'id' is missing or empty"`

## Validation Features

### Type Safety

- Strict type validation with edge case handling
- Finite number validation (excludes NaN, Infinity)
- Object vs array distinction
- Null safety in object validation

### Constraint Validation

- Numeric bounds checking (min/max)
- Pattern matching with RegExp
- Enum value validation
- Extensible constraint system

### Nested Validation

- Recursive object property validation
- Array item validation with indexing
- Error context preservation
- Comprehensive validation result aggregation

### Error Handling

- Detailed error messaging with context
- Warning vs error classification
- Parameter name inclusion in all messages
- Validation failure early exit for required fields

## Usage Example

```typescript
import { SchemaValidation } from '../utils/SchemaValidation';
import { ParameterType } from '../models/ParameterType';

const paramDef = SchemaValidation.createParameter('username', 'string')
  .required()
  .min(3)
  .max(20)
  .pattern('^[a-zA-Z0-9_]+$')
  .build();

const result = SchemaValidation.validateParameter('user_123', paramDef);
console.log(result.isValid); // true or false
console.log(result.errors);  // array of error messages
console.log(result.warnings); // array of warning messages

// Multiple parameter validation
const userSchema = {
  username: paramDef,
  age: SchemaValidation.createParameter('age', 'number')
    .required()
    .min(0)
    .max(120)
    .build()
};

const userData = { username: 'john_doe', age: 25 };
const multiResult = SchemaValidation.validateParameters(userData, userSchema);
```
