# RequestData

Represents the data required to make an HTTP request.

## Interface: RequestData

| Property      | Type                     | Description                                         |
| ------------- | ------------------------ | --------------------------------------------------- |
| `url`         | `string`                 | The endpoint URL for the request.                   |
| `method`      | `HttpMethod`             | The HTTP method to use (e.g., GET, POST).           |
| `headers`     | `Record<string, string>` | A mapping of HTTP header names to their values.     |
| `queryParams` | `Record<string, any>`    | A mapping of query parameter names to their values. |
| `body?`       | `any`                    | (Optional) The request body, if applicable.         |

## Usage Example

```typescript
import { RequestData } from './RequestData';

const request: RequestData = {
  url: 'https://api.example.com/users',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  queryParams: { active: true },
  body: { name: 'Alice' }
};
```
