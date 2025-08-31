# ExecutionOptions

Options to control the execution of an API request or workflow.

## Interface: ExecutionOptions

| Property            | Type      | Description                                                                          |
| ------------------- | --------- | ------------------------------------------------------------------------------------ |
| `timeout?`          | `number`  | (Optional) Maximum time in milliseconds to wait for the execution before timing out. |
| `retries?`          | `number`  | (Optional) Number of times to retry the execution on failure.                        |
| `validateResponse?` | `boolean` | (Optional) Whether to validate the response against the expected schema.             |
| `continueOnError?`  | `boolean` | (Optional) Whether to continue execution if an error occurs.                         |

## Usage Example

```typescript
import { ExecutionOptions } from './ExecutionOptions';

const options: ExecutionOptions = {
  timeout: 30000,
  retries: 2,
  validateResponse: true,
  continueOnError: false
};
```
