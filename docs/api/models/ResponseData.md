# ResponseData

Represents the data returned from an HTTP response.

## Interface: ResponseData

| Property  | Type                     | Description                                     |
| --------- | ------------------------ | ----------------------------------------------- |
| `headers` | `Record<string, string>` | A mapping of HTTP header names to their values. |
| `body`    | `any`                    | The response body content.                      |
| `size`    | `number`                 | The size of the response in bytes.              |

## Usage Example

```typescript
import { ResponseData } from './ResponseData';

const response: ResponseData = {
  headers: { 'Content-Type': 'application/json' },
  body: { id: 1, name: 'Alice' },
  size: 512
};
```
