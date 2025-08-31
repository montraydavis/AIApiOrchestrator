# AuthHandler

Base interface for authentication handlers that apply authentication to outgoing HTTP requests.

## Interface Definition

```typescript
interface AuthHandler {
  applyAuth(
    request: RequestData,
    config: AuthConfig,
    ctx: ExecutionContext
  ): Promise<RequestData>;
}
```

## Method Specification

### `applyAuth(request: RequestData, config: AuthConfig, ctx: ExecutionContext): Promise<RequestData>`

Applies authentication to the outgoing request based on the provided configuration.

#### Parameters

- **`request: RequestData`** - The request object to modify
  - Contains `url`, `method`, `headers`, `queryParams`, and optional `body`
  - Headers object should be modified to include authentication
  
- **`config: AuthConfig`** - The authentication configuration
  - Contains authentication type and type-specific properties
  - Properties vary based on `config.type`
  
- **`ctx: ExecutionContext`** - The execution context
  - Contains results from previous endpoint executions
  - May be used for context-aware authentication

#### Returns

- **`Promise<RequestData>`** - The modified request with authentication applied
  - Must return the same request object with authentication headers added
  - Should not modify other request properties unnecessarily

## Implementation Requirements

### Core Behavior

1. **Non-destructive modification**: Modify only what's necessary for authentication
2. **Graceful handling**: Don't throw exceptions for missing/invalid configuration
3. **Idempotent**: Multiple calls should produce the same result
4. **Async support**: Always return a Promise for consistency

### Error Handling

Implementations should handle errors gracefully:

```typescript
async applyAuth(request: RequestData, config: AuthConfig, ctx: ExecutionContext): Promise<RequestData> {
  // Check for required configuration
  if (!config.requiredField) {
    console.warn('Required authentication field missing, skipping auth');
    return request; // Return unmodified request
  }
  
  try {
    // Apply authentication logic
    request.headers = request.headers || {};
    request.headers['Auth-Header'] = generateAuthValue(config);
    return request;
  } catch (error) {
    console.error('Authentication failed:', error);
    return request; // Return unmodified request on error
  }
}
```

### Header Management

Best practices for header modification:

```typescript
// Initialize headers object if not present
request.headers = request.headers || {};

// Use standard header names when possible
request.headers['Authorization'] = 'Bearer token';

// Use consistent casing
request.headers['X-API-Key'] = config.apiKey; // Not 'x-api-key'

// Don't override existing auth headers unless necessary
if (!request.headers['Authorization']) {
  request.headers['Authorization'] = authValue;
}
```

## Built-in Implementations

The system provides several built-in implementations:

| Handler | Auth Type | Purpose |
|---------|-----------|---------|
| `ApiKeyAuthHandler` | `apiKey` | API key authentication via custom headers |
| `BearerTokenAuthHandler` | `bearerToken` | Bearer token authentication via Authorization header |
| `BasicAuthHandler` | `basic` | HTTP Basic Authentication via Authorization header |

## Custom Implementation Example

### Simple Custom Handler

```typescript
import { AuthHandler } from '../auth/AuthHandler';
import { RequestData } from '../models/RequestData';
import { AuthConfig } from '../models/AuthConfig';
import { ExecutionContext } from '../models/ExecutionContext';

export class CustomTokenAuthHandler implements AuthHandler {
  async applyAuth(
    request: RequestData,
    config: AuthConfig,
    ctx: ExecutionContext
  ): Promise<RequestData> {
    if (!config.token) {
      return request;
    }
    
    request.headers = request.headers || {};
    request.headers['X-Custom-Token'] = config.token;
    request.headers['X-Timestamp'] = new Date().toISOString();
    
    return request;
  }
}
```

### Context-Aware Handler

```typescript
export class ContextualAuthHandler implements AuthHandler {
  async applyAuth(
    request: RequestData,
    config: AuthConfig,
    ctx: ExecutionContext
  ): Promise<RequestData> {
    // Use execution context for dynamic authentication
    const sessionToken = ctx.variables.get('sessionToken');
    if (sessionToken) {
      request.headers = request.headers || {};
      request.headers['Authorization'] = `Session ${sessionToken}`;
    }
    
    return request;
  }
}
```

### Async Credential Retrieval

```typescript
export class AsyncAuthHandler implements AuthHandler {
  private credentialCache = new Map<string, string>();
  
  async applyAuth(
    request: RequestData,
    config: AuthConfig,
    ctx: ExecutionContext
  ): Promise<RequestData> {
    try {
      // Get credentials from external service
      const token = await this.getOrRefreshToken(config.clientId);
      
      request.headers = request.headers || {};
      request.headers['Authorization'] = `Bearer ${token}`;
      
      return request;
    } catch (error) {
      console.error('Failed to retrieve authentication token:', error);
      return request;
    }
  }
  
  private async getOrRefreshToken(clientId: string): Promise<string> {
    // Check cache first
    if (this.credentialCache.has(clientId)) {
      return this.credentialCache.get(clientId)!;
    }
    
    // Fetch from external service
    const token = await this.fetchTokenFromService(clientId);
    this.credentialCache.set(clientId, token);
    
    return token;
  }
  
  private async fetchTokenFromService(clientId: string): Promise<string> {
    // Implementation for external token service
    throw new Error('Not implemented');
  }
}
```

## Testing Guidelines

### Unit Testing

Test handlers in isolation with mock data:

```typescript
describe('CustomAuthHandler', () => {
  let handler: CustomAuthHandler;
  let request: RequestData;
  let config: AuthConfig;
  let context: ExecutionContext;
  
  beforeEach(() => {
    handler = new CustomAuthHandler();
    request = {
      url: 'https://api.example.com/test',
      method: 'GET',
      headers: {},
      queryParams: {}
    };
    config = { type: 'custom', token: 'test-token' };
    context = { results: new Map(), variables: new Map() };
  });
  
  it('should add custom auth header', async () => {
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['X-Custom-Token']).toBe('test-token');
  });
  
  it('should handle missing token gracefully', async () => {
    config.token = undefined;
    
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['X-Custom-Token']).toBeUndefined();
    expect(result).toBe(request); // Should return original request
  });
});
```

### Integration Testing

Test handlers with the registry and execution engine:

```typescript
describe('AuthHandler Integration', () => {
  let registry: AuthHandlerRegistry;
  let engine: ApiExecutionEngine;
  
  beforeEach(() => {
    registry = new AuthHandlerRegistry();
    registry.register('custom', new CustomAuthHandler());
    
    const aoai = new AOAI();
    engine = new ApiExecutionEngine(aoai);
    engine.authRegistry = registry;
  });
  
  it('should apply authentication during endpoint execution', async () => {
    const endpoint = new ApiEndpoint({
      id: 'test',
      name: 'Test',
      method: 'GET',
      baseUrl: 'https://api.example.com',
      path: '/test',
      auth: { type: 'custom', token: 'integration-token' }
    });
    
    const result = await engine.executeEndpoint(endpoint);
    
    expect(result.requestData.headers['X-Custom-Token']).toBe('integration-token');
  });
});
```

## Best Practices

1. **Keep it simple**: Authentication logic should be focused and straightforward
2. **Error resilience**: Always handle configuration and network errors gracefully  
3. **Performance**: Cache expensive operations like token generation
4. **Security**: Never log sensitive authentication data
5. **Consistency**: Follow established patterns from built-in handlers
6. **Documentation**: Document any special configuration requirements
7. **Testing**: Provide comprehensive unit and integration tests

## Common Pitfalls

- **Modifying request URL or method**: Only modify headers unless absolutely necessary
- **Throwing exceptions**: Return the original request instead of throwing
- **Synchronous operations**: Always return a Promise even for sync operations
- **Header case sensitivity**: Use consistent header name casing
- **Overwriting headers**: Check for existing headers before setting new ones
