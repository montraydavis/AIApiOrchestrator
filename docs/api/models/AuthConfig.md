# AuthConfig

Configuration for authentication to be used with an API endpoint.

## Types

### `AuthType`

A string union type representing supported authentication types:

- `'apiKey'`
- `'bearerToken'`
- `'basic'`
- `'oauth2'`
- `'custom'`
- `'none'`

## Interface: AuthConfig

| Property         | Type                                              | Description                                                                             |
| ---------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `type`           | `AuthType`                                        | The type of authentication to use.                                                      |
| `token?`         | `string`                                          | (Optional) The bearer token or OAuth2 token, used for 'bearerToken' or 'oauth2' types.  |
| `username?`      | `string`                                          | (Optional) The username for basic authentication.                                       |
| `password?`      | `string`                                          | (Optional) The password for basic authentication.                                       |
| `apiKey?`        | `string`                                          | (Optional) The API key value, used for 'apiKey' type.                                   |
| `headerName?`    | `string`                                          | (Optional) The name of the header to use for API key or custom authentication.          |
| `customHandler?` | `(ctx: ExecutionContext) => Promise<RequestData>` | (Optional) A custom handler function for advanced or non-standard authentication flows. |

## Usage Example

```typescript
import { AuthConfig, AuthType } from './AuthConfig';

const apiKeyAuth: AuthConfig = {
  type: 'apiKey',
  apiKey: 'my-secret-key',
  headerName: 'X-API-Key'
};

const bearerAuth: AuthConfig = {
  type: 'bearerToken',
  token: 'eyJhbGciOi...'
};

const basicAuth: AuthConfig = {
  type: 'basic',
  username: 'user',
  password: 'pass'
};
```
