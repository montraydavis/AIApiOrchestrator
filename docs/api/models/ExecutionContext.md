# ExecutionContext

Represents the context for API execution, including results and variables.

## Interface: ExecutionContext

| Property    | Type                           | Description                                                                         |
| ----------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| `results`   | `Map<string, ExecutionResult>` | A map of endpoint IDs to their corresponding execution results.                     |
| `variables` | `Map<string, any>`             | A map of variable names to their values, used for parameter substitution and state. |

## Usage Example

```typescript
import { ExecutionContext } from './ExecutionContext';
import { ExecutionResult } from './ExecutionResult';

const context: ExecutionContext = {
  results: new Map<string, ExecutionResult>(),
  variables: new Map<string, any>()
};

// Set a variable
context.variables.set('userId', 123);

// Retrieve a variable
const userId = context.variables.get('userId');
```
