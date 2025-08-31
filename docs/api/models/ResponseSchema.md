# ResponseSchema

Describes the structure of an HTTP response for an API endpoint.

## Interface: ResponseSchema

| Property     | Type                                  | Description                                                              |
| ------------ | ------------------------------------- | ------------------------------------------------------------------------ |
| `statusCode` | `number`                              | The HTTP status code returned by the endpoint.                           |
| `headers?`   | `HeaderConfig`                        | (Optional) The headers returned in the response.                         |
| `body?`      | `Record<string, ParameterDefinition>` | (Optional) Mapping of response body property names to their definitions. |
| `schema?`    | `any`                                 | (Optional) A JSON schema object for validating the response body.        |

## Usage Example

```typescript
import { ResponseSchema } from './ResponseSchema';

const successResponse: ResponseSchema = {
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: {
    id: { name: 'id', type: 'number', required: true },
    name: { name: 'name', type: 'string', required: true }
  }
};
```
