# ApiExecutionEngine

Main execution engine for managing API endpoint execution, authentication, AI-assisted parameter resolution, and shared execution context.

## Class: ApiExecutionEngine

### Properties

- `private context: ExecutionContext` — Holds results and variables for execution.
- `private authRegistry: AuthHandlerRegistry` — Registry of authentication handlers.
- `private globalAuth: AuthConfig | undefined` — Optional global auth configuration applied when an endpoint has none.
- `aoai: AOAI` — Azure OpenAI wrapper instance for AI-powered operations.

### Constructor

`new ApiExecutionEngine(aoai: AOAI, options: { globalAuth?: AuthConfig } = {})`

- Initializes execution context and registers default auth handlers (`apiKey`, `bearerToken`, `basic`).
- Accepts an optional `globalAuth` to apply across endpoints by default.

## Public Methods

### `executeEndpoint(endpoint: ApiEndpoint, options: ExecutionOptions = {}): Promise<ExecutionResult>`

Executes a single endpoint.

- Validates endpoint configuration and typed connections.
- Resolves parameters/body/headers (including from connections and AI when `naturalLanguageInput` is present).
- Applies authentication (endpoint-specific or global) via `AuthHandlerRegistry`.
- Performs HTTP request with retries and timeout.
- Stores result in context and optionally validates response against expected schema.

### `executeFlow(endpoints: ApiEndpoint[], options: ExecutionOptions = {}): Promise<ExecutionResult[]>`

Executes multiple endpoints in dependency order (based on connections). Stops on first failure unless `continueOnError` is true.

### `clearContext(): void`

Clears stored results and variables in the execution context.

### `getContext(): ExecutionContext`

Returns a shallow copy of the current execution context for inspection/debugging.

## Behavior Highlights

- **Typed connections**: Validates source/target types and allowed transforms before execution.
- **AI-assisted resolution**: When `naturalLanguageInput` exists, uses `AOAI` with Handlebars templates to resolve path/query/body values, then validates them with `SchemaValidation`.
- **Safe logging**: Uses `HttpResponseUtils` to preview connected response data and format logs without flooding.
- **HTTP execution**: Fetch-based implementation with query param building, headers, body handling, and JSON/text parsing.
- **Enhanced AI validation**: Performs comprehensive schema validation against parameter definitions for all AI-generated responses.
- **Connection diagnostics**: Provides detailed analysis and debugging capabilities for endpoint connections.
- **Multi-stage resolution**: Handles path, query, and body parameters separately with individual validation.
- **Error handling**: Includes comprehensive retry logic, timeout management, and graceful error recovery.

## Key Private Methods

### AI Resolution Methods

- `resolvePathParameters(endpoint, resolvedData)` — Resolves path parameters using AI with Handlebars templates and connection context.
- `resolveQueryParameters(endpoint, resolvedData)` — Resolves query parameters using AI with connection context and schema validation.
- `resolveBodyParameters(endpoint, resolvedData)` — Resolves body parameters using AI for POST/PUT/PATCH requests.
- `processAiResolution(endpoint, resolvedData)` — Orchestrates comprehensive AI resolution for all parameter types.
- `cleanAiJsonResponse(response)` — Cleans and extracts JSON from AI responses, handling code blocks and formatting.

### Validation Methods

- `validateParameterSchema(aiResponse, schema, contextType)` — Validates AI-generated parameters against provided schemas.
- `validateBodySchema(aiResponse, bodySchema)` — Validates AI-generated request bodies against body schemas.
- `validateTypedConnections(endpoint)` — Ensures type compatibility and valid transformations for all connections.
- `validateConnectionAvailability(endpoint)` — Checks availability of connections and source endpoints.
- `validateParameterType(value, expectedType)` — Validates parameter values against expected types.
- `validateParameterValue(key, value, paramDef, contextType)` — Validates parameter constraints (length, bounds, etc.).
- `validateResponse(endpoint, result)` — Checks response status codes against expected responses.
- `validateAiResponse(response, contextType)` — Validates structure of AI responses based on context type.

### Connection Management

- `gatherConnectionContext(endpoint)` — Collects context information from all endpoint connections.
- `diagnoseConnectionIssues(endpoint)` — Diagnoses and logs connection issues with detailed analysis.
- `getAvailableResponseFields(responseBody, prefix, maxDepth)` — Recursively collects available field paths from response bodies.
- `extractValueFromResult(result, path)` — Extracts values from execution results using JSON path notation.
- `applyTransformation(value, transform)` — Applies transformations to values based on transformation type.

### Type Compatibility

- `areTypesCompatibleEnhanced(sourceType, targetType)` — Enhanced type compatibility checking with conversion rules.
- `isValidTransformation(transformName, sourceType, targetType)` — Validates transformation compatibility for given types.
- `getValueType(value)` — Returns human-readable type names for error messages.

### HTTP Execution

- `buildRequestConfig(endpoint, resolvedData)` — Builds complete RequestData with URL, headers, query params, and body.
- `executeHttpRequest(config, options)` — Executes HTTP requests with retry logic and timeout handling.
- `performHttpRequest(config, timeout)` — Performs actual HTTP request using fetch with proper error handling.

### Data Resolution

- `resolveEndpointData(endpoint)` — Gathers resolved params/body/headers and merges connection-derived values with transforms.
- `sortEndpointsByDependencies(endpoints)` — Sorts endpoints by dependency order for flow execution.
- `formatConnectionDataForLogging(endpoint)` — Pretty-prints connections with truncated response previews.

### Utility Methods

- `callAiWithContext(prompt, contextType, retries)` — Calls AI model with retry logic and response validation.
- `sleep(ms)` — Utility function for retry delays and timeout handling.

## Authentication Support

The engine automatically registers and supports multiple authentication types:

- **API Key**: Uses `apiKey` and optional `headerName` (defaults to 'X-API-Key')
- **Bearer Token**: Uses `token` in Authorization header
- **Basic Auth**: Uses `username` and `password` with Base64 encoding
- **Custom**: Uses `customHandler` function for advanced authentication flows
- **None**: No authentication applied

Authentication precedence: endpoint-specific auth → global auth → no auth

## AI Parameter Resolution

When an endpoint includes `naturalLanguageInput`, the engine performs multi-stage resolution:

1. **Context Gathering**: Collects data from connected endpoint responses
2. **Template Rendering**: Uses Handlebars templates for path/query/body parameter prompts
3. **AI Processing**: Calls Azure OpenAI with structured prompts
4. **Response Cleaning**: Extracts and cleans JSON from AI responses
5. **Schema Validation**: Validates responses against parameter definitions
6. **Integration**: Merges AI-resolved values with existing endpoint data

## Connection Management

The engine provides comprehensive connection handling:

- **Type Safety**: Validates source/target type compatibility before execution
- **Transformation Support**: Applies transformations (string, number, boolean, array operations)
- **Diagnostics**: Identifies missing source endpoints, failed executions, and missing fields
- **Context Integration**: Provides connection data to AI for parameter resolution
- **Safe Logging**: Truncates large response data for readable logs

## Error Handling

Comprehensive error handling includes:

- **Validation Errors**: Schema validation failures with detailed error messages
- **Connection Errors**: HTTP request failures with retry logic
- **AI Errors**: JSON parsing failures with fallback handling
- **Type Errors**: Type incompatibility with suggested fixes
- **Timeout Handling**: Request timeouts with exponential backoff

## Usage Example

```typescript
import { AOAI } from '../ai/AOAI';
import { ApiExecutionEngine } from '../execution/ApiExecutionEngine';
import { ApiEndpoint } from '../models/ApiEndpoint';

async function run() {
  const aoai = new AOAI();
  const engine = new ApiExecutionEngine(aoai, {
    globalAuth: { type: 'none' }
  });

  const endpoint = new ApiEndpoint({
    id: 'getUser',
    name: 'Get User',
    method: 'GET',
    baseUrl: 'https://api.example.com',
    path: '/users/{id}',
    pathParams: { id: { name: 'id', type: 'string', required: true } },
    headers: {},
    expectedResponse: [{ statusCode: 200 }],
    naturalLanguageInput: 'Get user with ID 123'
  });

  const result = await engine.executeEndpoint(endpoint, { 
    timeout: 15000, 
    validateResponse: true 
  });
  
  console.log(result.success, result.statusCode);
}

run();
```
