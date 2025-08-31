# ParameterBuilder

A builder class for constructing `ParameterDefinition` objects with a fluent API. This class allows you to define parameters for APIs, including their types, validation rules, and metadata, using a chainable interface.

## Constructor

### `new ParameterBuilder(name: string, type: ParameterType)`

Creates a new ParameterBuilder instance with the specified name and type.

- **name**: The name of the parameter
- **type**: The type of the parameter (e.g., 'string', 'number', 'boolean', 'array', 'object')

**Initial State:**

- `required`: false (parameters are optional by default)
- All other properties: undefined until explicitly set

**Validation:**

- Constructor validates that name is provided
- Type must be a valid ParameterType

## Fluent API Methods

### `required(required: boolean = true): ParameterBuilder`

Sets whether the parameter is required.

- **required** (default: `true`): Whether the parameter is required

**Usage:**

```typescript
.required()        // Makes parameter required
.required(true)    // Makes parameter required  
.required(false)   // Makes parameter optional
```

### `description(description: string): ParameterBuilder`

Sets a human-readable description for the parameter.

- **description**: A descriptive text explaining the parameter's purpose

**Best Practices:**

- Use clear, concise descriptions
- Explain the parameter's purpose and expected format
- Include examples in description when helpful

### `defaultValue(value: any): ParameterBuilder`

Sets a default value for the parameter.

- **value**: The default value to use when parameter is not provided

**Type Safety:**

- Default value should match the parameter type
- Used when parameter is not provided in requests
- Affects required validation (parameters with defaults are effectively optional)

### `examples(...examples: any[]): ParameterBuilder`

Sets one or more example values for the parameter.

- **examples**: Variable number of example values

**Usage:**

```typescript
.examples('admin', 'user', 'guest')
.examples(10, 25, 50, 100)
```

**Purpose:**

- Documentation and API specification generation
- Testing and validation examples
- Developer guidance

### `min(min: number): ParameterBuilder`

Sets the minimum value (for numbers) or minimum length (for arrays and strings).

- **min**: The minimum value or length

**Applies To:**

- Numbers: minimum numeric value
- Arrays: minimum array length  
- Strings: minimum string length (when used with validation)

### `max(max: number): ParameterBuilder`

Sets the maximum value (for numbers) or maximum length (for arrays and strings).

- **max**: The maximum value or length

**Applies To:**

- Numbers: maximum numeric value
- Arrays: maximum array length
- Strings: maximum string length (when used with validation)

### `pattern(pattern: string): ParameterBuilder`

Sets a regular expression pattern that string values must match.

- **pattern**: A regex pattern as a string

**Usage:**

```typescript
.pattern('^[a-zA-Z0-9_]+$')           // Alphanumeric and underscore
.pattern('^\\d{3}-\\d{2}-\\d{4}$')    // SSN format
.pattern('^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$') // Email format
```

**Important:**

- Only applies to string parameters
- Pattern is used as RegExp constructor argument
- Escape backslashes in pattern strings

### `enum(...values: any[]): ParameterBuilder`

Restricts the parameter value to a set of allowed values (enumeration).

- **values**: The allowed values for the parameter

**Usage:**

```typescript
.enum('active', 'inactive', 'pending')
.enum(1, 2, 3, 5, 10)
.enum(true, false)
```

**Validation:**

- Parameter value must exactly match one of the enum values
- Works with any parameter type
- Case-sensitive for strings

### `items(itemDefinition: ParameterDefinition): ParameterBuilder`

Defines the schema for items in an array parameter.

- **itemDefinition**: The definition of the items contained in the array

**Restrictions:**

- Can only be used with 'array' type parameters
- Throws error if parameter type is not 'array'

**Usage:**

```typescript
const stringArrayParam = new ParameterBuilder('tags', 'array')
  .items({ name: 'tag', type: 'string', required: true })
  .build();
```

**Nested Validation:**

- Each array item is validated against the item definition
- Supports complex nested structures
- Enables type-safe array parameter validation

### `properties(properties: Record<string, ParameterDefinition>): ParameterBuilder`

Defines the properties for object type parameters.

- **properties**: A record mapping property names to their parameter definitions

**Restrictions:**

- Can only be used with 'object' type parameters
- Throws error if parameter type is not 'object'

**Usage:**

```typescript
const userObjectParam = new ParameterBuilder('user', 'object')
  .properties({
    name: { name: 'name', type: 'string', required: true },
    age: { name: 'age', type: 'number', required: false }
  })
  .build();
```

**Nested Validation:**

- Each object property is validated according to its definition
- Supports deeply nested object structures
- Enables comprehensive schema validation

### `build(): ParameterDefinition`

Builds and returns the parameter definition object.

**Returns:** A complete `ParameterDefinition` object with all configured properties.

**Final Validation:**

- Ensures all required configuration is present
- Returns a deep copy to prevent modification
- Ready for use in API schema validation

## Error Conditions

### Constructor Errors

- **Missing name**: Throws error if name is not provided
- **Invalid type**: Throws error if type is not a valid ParameterType

### Configuration Errors

- **items() on non-array**: Throws error when called on parameters that are not 'array' type
- **properties() on non-object**: Throws error when called on parameters that are not 'object' type

### Validation Errors

- **Pattern on non-string**: Pattern validation only applies to string parameters
- **Min/max type mismatch**: Numeric constraints should match parameter type usage

## Advanced Usage Examples

### Complex Object Parameter

```typescript
const complexParam = new ParameterBuilder('settings', 'object')
  .required()
  .description('Application settings configuration')
  .properties({
    theme: {
      name: 'theme',
      type: 'string',
      required: false,
      validation: { enum: ['light', 'dark', 'auto'] }
    },
    notifications: {
      name: 'notifications',
      type: 'object',
      required: true,
      properties: {
        email: { name: 'email', type: 'boolean', required: true },
        push: { name: 'push', type: 'boolean', required: true }
      }
    }
  })
  .build();
```

### Array with Complex Items

```typescript
const arrayParam = new ParameterBuilder('users', 'array')
  .required()
  .description('List of user objects')
  .min(1)
  .max(100)
  .items({
    name: 'user',
    type: 'object',
    required: true,
    properties: {
      id: { name: 'id', type: 'number', required: true },
      name: { name: 'name', type: 'string', required: true },
      email: { 
        name: 'email', 
        type: 'string', 
        required: true,
        validation: { pattern: '^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$' }
      }
    }
  })
  .build();
```

### String with Multiple Constraints

```typescript
const usernameParam = new ParameterBuilder('username', 'string')
  .required()
  .description('Unique username for the account')
  .min(3)
  .max(20)
  .pattern('^[a-zA-Z0-9_]+$')
  .examples('john_doe', 'user123', 'admin_user')
  .build();
```

## Integration with SchemaValidation

ParameterBuilder objects are designed to work seamlessly with the SchemaValidation utility:

```typescript
import { SchemaValidation } from '../utils/SchemaValidation';
import { ParameterBuilder } from '../utils/ParameterBuilder';

// Create parameter definition
const paramDef = new ParameterBuilder('age', 'number')
  .required()
  .min(0)
  .max(120)
  .description('User age in years')
  .build();

// Validate values against the definition
const result = SchemaValidation.validateParameter(25, paramDef);
console.log(result.isValid); // true

// Or use the factory method
const paramDef2 = SchemaValidation.createParameter('username', 'string')
  .required()
  .pattern('^[a-zA-Z0-9_]+$')
  .build();
```
