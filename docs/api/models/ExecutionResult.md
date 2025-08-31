# ExecutionResult

Represents the result of executing an API endpoint.

## Interface: ExecutionResult

| Property       | Type           | Description                                            |
| -------------- | -------------- | ------------------------------------------------------ |
| `endpointId`   | `string`       | The unique identifier of the executed endpoint.        |
| `success`      | `boolean`      | Indicates whether the execution was successful.        |
| `statusCode`   | `number`       | The HTTP status code returned by the endpoint.         |
| `responseTime` | `number`       | The time taken to receive a response, in milliseconds. |
| `requestData`  | `RequestData`  | The data sent in the request.                          |
| `responseData` | `ResponseData` | The data received in the response.                     |
| `error?`       | `string`       | Error message if the execution failed.                 |
| `timestamp`    | `Date`         | The date and time when the execution occurred.         |

## Usage Example

```typescript
import { ExecutionResult } from './ExecutionResult';

const result: ExecutionResult = {
  endpointId: 'getUser',
  success: true,
  statusCode: 200,
  responseTime: 120,
  requestData: { url: '...', method: 'GET', headers: {}, queryParams: {} },
  responseData: { headers: {}, body: { id: 1, name: 'Alice' }, size: 512 },
  timestamp: new Date()
};
```
