# HttpMethod

Represents the standard HTTP methods used in API requests.

```typescript
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
```

- `GET`: Retrieve data from the server.
- `POST`: Submit data to be processed to the server.
- `PUT`: Update existing data on the server.
- `PATCH`: Partially update existing data on the server.
- `DELETE`: Remove data from the server.
- `HEAD`: Retrieve headers for a resource, without the body.
- `OPTIONS`: Describe the communication options for the target resource.

## Usage Example

```typescript
import { HttpMethod } from './HttpMethod';

const method: HttpMethod = 'GET';
```
