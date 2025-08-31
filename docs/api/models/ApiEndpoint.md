# ApiEndpoint

Represents an API endpoint definition, including HTTP method, URL, parameters, authentication, expected responses, AI mapping, and other configuration options.

## Constructor

### `new ApiEndpoint(config: Partial<ApiEndpoint> & { id: string; name: string; method: HttpMethod; baseUrl: string; path: string; })`

- **config**: Partial configuration object for the endpoint. Must include `id`, `name`, `method`, `baseUrl`, and `path`.

## Properties

- `id: string` — Unique identifier for the endpoint.
- `name: string` — Human-readable name for the endpoint.
- `description?: string` — Optional description of the endpoint.
- `method: HttpMethod` — HTTP method (GET, POST, etc.) for the endpoint.
- `baseUrl: string` — Base URL for the API (e.g., <https://api.example.com>).
- `path: string` — Path for the endpoint (e.g., /users/{id}).
- `queryParams: Record<string, ParameterDefinition>` — Query parameters accepted by the endpoint.
- `pathParams: Record<string, ParameterDefinition>` — Path parameters accepted by the endpoint.
- `headers: HeaderConfig` — HTTP headers to be sent with the request.
- `body?: BodySchema` — Body schema definition for the endpoint (if applicable).
- `auth?: AuthConfig` — Per-endpoint authentication configuration.
- `expectedResponse: ResponseSchema[]` — List of expected response schemas for the endpoint.
- `naturalLanguageInput?: string` — Optional natural language input describing the endpoint's purpose or usage.
- `aiMapping?: NaturalLanguageMapping` — Optional AI mapping for natural language to parameter resolution.
- `connections: EndpointConnection[]` — List of connections to other endpoints (for data flow or chaining).
- `timeout: number` — Timeout for the endpoint request in milliseconds.
- `retries: number` — Number of retries for the endpoint request.
- `createdAt: Date` — Timestamp when the endpoint was created.
- `updatedAt: Date` — Timestamp when the endpoint was last updated.

## Methods

### `getFullUrl(pathValues?: Record<string, any>): string`

Returns the full URL for the endpoint, with path parameters resolved.

### `hasAiMapping(): boolean`

Checks if the endpoint has AI mapping configured.

### `getResolvedParams(): Record<string, any>`

Gets the merged parameters for the endpoint, combining static default values and AI-resolved parameters.

### `getResolvedBody(): any`

Gets the merged body content for the endpoint, combining static body content and AI-resolved body content.

### `validate(): string[]`

Validates the endpoint configuration, checking for required fields and parameters. Returns an array of error messages, or an empty array if the configuration is valid.

### `updateAiMapping(mapping: Partial<NaturalLanguageMapping>): void`

Updates the AI mapping for the endpoint and sets the updatedAt timestamp.

### `addConnection(connection: Omit<EndpointConnection, 'id'>): EndpointConnection`

Adds a connection to another endpoint.

### `removeConnection(connectionId: string): boolean`

Removes a connection from this endpoint by its ID.

### `getPathProperty<T = any>(name: string): PathProperty<T>`

Gets a strongly-typed path parameter property for this endpoint.

### `getQueryProperty<T = any>(name: string): QueryProperty<T>`

Gets a strongly-typed query parameter property for this endpoint.

### `getBodyProperty<T = any>(jsonPath: string): BodyProperty<T>`

Gets a strongly-typed body property for this endpoint using a JSON path.

### `getResponseProperty<T = any>(jsonPath: string): ResponseProperty<T>`

Gets a strongly-typed response property for this endpoint using a JSON path.

### `getIdProperty(): ResponseProperty<number | string>`

Convenience method to get the "id" property from the response.

### `getTokenProperty(): ResponseProperty<string>`

Convenience method to get the "token" property from the response.

### `addTypedConnection<TSource, TTarget>(sourceProperty: SchemaProperty<TSource>, targetProperty: SchemaProperty<TTarget>, mapping?: string): EndpointConnection`

Adds a typed connection between two schema properties (source and target) for this endpoint.

### `addConnections(connectionBuilders: ConnectionBuilder<any, any>[]): EndpointConnection[]`

Adds multiple connections to this endpoint using an array of ConnectionBuilder instances.

## Usage Example

```typescript
import { ApiEndpoint } from './ApiEndpoint';
import { HttpMethod } from './HttpMethod';

const endpoint = new ApiEndpoint({
  id: 'getUser',
  name: 'Get User',
  method: 'GET',
  baseUrl: 'https://api.example.com',
  path: '/users/{id}',
  queryParams: {},
  pathParams: { id: { name: 'id', type: 'string', required: true } },
  headers: {},
  expectedResponse: []
});

const url = endpoint.getFullUrl({ id: 123 });
console.log(url); // https://api.example.com/users/123
```
