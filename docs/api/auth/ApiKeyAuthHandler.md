# ApiKeyAuthHandler

Handles API key authentication by injecting the API key into request headers. Supports configurable header names with a sensible default.

## Class: ApiKeyAuthHandler

**Implements:** `AuthHandler`

**Auth Type:** `apiKey`

## Configuration

### Required AuthConfig Properties

- **`apiKey: string`** - The API key value to include in requests

### Optional AuthConfig Properties

- **`headerName?: string`** - Custom header name (defaults to `'X-API-Key'`)

## Authentication Method

The handler adds the API key to request headers using the specified or default header name:

```
X-API-Key: your-api-key-here
```

Or with custom header name:

```
Authorization: your-api-key-here
Custom-API-Key: your-api-key-here
```

## Method Implementation

### `applyAuth(request: RequestData, config: AuthConfig, ctx: ExecutionContext): Promise<RequestData>`

Applies API key authentication to the outgoing request.

**Behavior:**

1. Checks if `config.apiKey` is provided
2. Initializes `request.headers` if not present
3. Sets the header using `config.headerName` or defaults to `'X-API-Key'`
4. Returns the modified request

**Error Handling:**

- Gracefully handles missing `apiKey` by returning the original request
- Does not throw exceptions for invalid configuration

## Usage Examples

### Basic Usage

```typescript
import { ApiKeyAuthHandler } from '../auth/ApiKeyAuthHandler';

const handler = new ApiKeyAuthHandler();
const request = {
  url: 'https://api.example.com/users',
  method: 'GET',
  headers: {},
  queryParams: {}
};

const config = {
  type: 'apiKey',
  apiKey: 'sk-1234567890abcdef'
};

const authenticatedRequest = await handler.applyAuth(request, config, {});

// Result:
// request.headers['X-API-Key'] = 'sk-1234567890abcdef'
```

### Custom Header Name

```typescript
const config = {
  type: 'apiKey',
  apiKey: 'abc123xyz',
  headerName: 'Authorization'
};

const authenticatedRequest = await handler.applyAuth(request, config, {});

// Result:
// request.headers['Authorization'] = 'abc123xyz'
```

### With ApiExecutionEngine

```typescript
import { ApiExecutionEngine } from '../execution/ApiExecutionEngine';
import { ApiEndpoint } from '../models/ApiEndpoint';

const engine = new ApiExecutionEngine(aoai, {
  globalAuth: {
    type: 'apiKey',
    apiKey: process.env.API_KEY,
    headerName: 'X-Service-Key'
  }
});

const endpoint = new ApiEndpoint({
  id: 'getUser',
  name: 'Get User',
  method: 'GET',
  baseUrl: 'https://api.example.com',
  path: '/users/{id}',
  pathParams: { id: { name: 'id', type: 'string', required: true } }
});

// API key will be automatically added to request headers
const result = await engine.executeEndpoint(endpoint);
```

### Per-Endpoint Configuration

```typescript
const endpoint = new ApiEndpoint({
  id: 'specialEndpoint',
  name: 'Special Endpoint',
  method: 'POST',
  baseUrl: 'https://special-api.example.com',
  path: '/special',
  auth: {
    type: 'apiKey',
    apiKey: 'special-key-12345',
    headerName: 'X-Special-API-Key'
  }
});

const result = await engine.executeEndpoint(endpoint);
```

## Common Header Names

Different APIs use various header names for API keys:

| Service Type | Common Header Names |
|--------------|-------------------|
| **Generic** | `X-API-Key`, `X-Api-Key`, `Api-Key` |
| **Cloud Services** | `X-RapidAPI-Key`, `X-Mashape-Key` |
| **Custom APIs** | `Authorization`, `X-Auth-Token`, `X-Service-Key` |
| **Legacy APIs** | `apikey`, `key`, `token` |

### Configuration Examples

```typescript
// Standard API key
{ type: 'apiKey', apiKey: 'your-key', headerName: 'X-API-Key' }

// RapidAPI
{ type: 'apiKey', apiKey: 'your-key', headerName: 'X-RapidAPI-Key' }

// Custom authorization header
{ type: 'apiKey', apiKey: 'your-key', headerName: 'Authorization' }

// Service-specific header
{ type: 'apiKey', apiKey: 'your-key', headerName: 'X-Service-Token' }
```

## Security Considerations

### API Key Storage

**✅ Secure Practices:**

```typescript
// Use environment variables
const config = {
  type: 'apiKey',
  apiKey: process.env.API_KEY,
  headerName: 'X-API-Key'
};

// Use secure credential stores
const config = {
  type: 'apiKey',
  apiKey: await getSecretFromVault('api-key'),
  headerName: 'X-API-Key'
};
```

**❌ Insecure Practices:**

```typescript
// Never hardcode API keys
const config = {
  type: 'apiKey',
  apiKey: 'sk-1234567890abcdef', // DON'T DO THIS
  headerName: 'X-API-Key'
};
```

### Transport Security

- **Always use HTTPS** in production environments
- **Validate SSL certificates** and consider certificate pinning
- **Monitor for key exposure** in logs and error messages

### Key Management

- **Rotate keys regularly** according to security policy
- **Use separate keys** for different environments (dev/staging/prod)
- **Implement key expiration** where supported by the API provider
- **Monitor key usage** for unusual patterns

## Error Handling

The handler implements graceful error handling:

```typescript
async applyAuth(request: RequestData, config: AuthConfig, ctx: ExecutionContext): Promise<RequestData> {
  // Handle missing API key
  if (!config.apiKey) {
    console.warn('API key not provided, skipping authentication');
    return request; // Return original request without modification
  }
  
  // Handle empty or invalid API key
  if (typeof config.apiKey !== 'string' || config.apiKey.trim() === '') {
    console.warn('Invalid API key provided, skipping authentication');
    return request;
  }
  
  // Apply authentication
  request.headers = request.headers || {};
  request.headers[config.headerName || 'X-API-Key'] = config.apiKey;
  
  return request;
}
```

## Testing

### Unit Tests

```typescript
import { ApiKeyAuthHandler } from '../auth/ApiKeyAuthHandler';

describe('ApiKeyAuthHandler', () => {
  let handler: ApiKeyAuthHandler;
  let request: RequestData;
  let config: AuthConfig;
  let context: ExecutionContext;
  
  beforeEach(() => {
    handler = new ApiKeyAuthHandler();
    request = {
      url: 'https://api.example.com/test',
      method: 'GET', 
      headers: {},
      queryParams: {}
    };
    config = { type: 'apiKey', apiKey: 'test-key-123' };
    context = { results: new Map(), variables: new Map() };
  });
  
  it('should add API key with default header name', async () => {
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['X-API-Key']).toBe('test-key-123');
  });
  
  it('should use custom header name', async () => {
    config.headerName = 'Authorization';
    
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['Authorization']).toBe('test-key-123');
    expect(result.headers['X-API-Key']).toBeUndefined();
  });
  
  it('should handle missing API key gracefully', async () => {
    delete config.apiKey;
    
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['X-API-Key']).toBeUndefined();
    expect(result).toBe(request); // Should return original request
  });
  
  it('should preserve existing headers', async () => {
    request.headers['Content-Type'] = 'application/json';
    
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['Content-Type']).toBe('application/json');
    expect(result.headers['X-API-Key']).toBe('test-key-123');
  });
  
  it('should handle empty API key', async () => {
    config.apiKey = '';
    
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['X-API-Key']).toBeUndefined();
  });
});
```

### Integration Tests

```typescript
describe('ApiKeyAuthHandler Integration', () => {
  it('should work with ApiExecutionEngine', async () => {
    const aoai = new AOAI();
    const engine = new ApiExecutionEngine(aoai, {
      globalAuth: {
        type: 'apiKey',
        apiKey: 'integration-test-key',
        headerName: 'X-Test-Key'
      }
    });
    
    const endpoint = new ApiEndpoint({
      id: 'test',
      name: 'Test Endpoint',
      method: 'GET',
      baseUrl: 'https://httpbin.org',
      path: '/headers'
    });
    
    const result = await engine.executeEndpoint(endpoint);
    
    expect(result.requestData.headers['X-Test-Key']).toBe('integration-test-key');
    expect(result.success).toBe(true);
  });
  
  it('should override global auth with endpoint-specific auth', async () => {
    const aoai = new AOAI();
    const engine = new ApiExecutionEngine(aoai, {
      globalAuth: { type: 'apiKey', apiKey: 'global-key' }
    });
    
    const endpoint = new ApiEndpoint({
      id: 'test',
      name: 'Test Endpoint',
      method: 'GET',
      baseUrl: 'https://httpbin.org',
      path: '/headers',
      auth: {
        type: 'apiKey',
        apiKey: 'endpoint-specific-key',
        headerName: 'X-Endpoint-Key'
      }
    });
    
    const result = await engine.executeEndpoint(endpoint);
    
    expect(result.requestData.headers['X-Endpoint-Key']).toBe('endpoint-specific-key');
    expect(result.requestData.headers['X-API-Key']).toBeUndefined();
  });
});
```

## Best Practices

### Configuration Management

1. **Environment Variables**: Use environment-specific configuration

```typescript
const config = {
  type: 'apiKey',
  apiKey: process.env.NODE_ENV === 'production' 
    ? process.env.PROD_API_KEY 
    : process.env.DEV_API_KEY,
  headerName: 'X-API-Key'
};
```

2. **Configuration Validation**: Validate API keys at startup

```typescript
function validateApiKeyConfig(config: AuthConfig): boolean {
  if (config.type !== 'apiKey') return true;
  
  if (!config.apiKey || typeof config.apiKey !== 'string') {
    throw new Error('API key is required and must be a string');
  }
  
  if (config.apiKey.length < 10) {
    console.warn('API key seems unusually short, please verify');
  }
  
  return true;
}
```

3. **Header Name Consistency**: Use consistent header names across endpoints

```typescript
const API_KEY_HEADER = 'X-Service-API-Key';

const config = {
  type: 'apiKey',
  apiKey: process.env.API_KEY,
  headerName: API_KEY_HEADER
};
```

### Performance Optimization

1. **Key Caching**: Cache API keys to avoid repeated lookups
2. **Header Reuse**: Reuse header objects when possible
3. **Validation**: Validate keys once at startup, not per request

### Monitoring and Logging

1. **Success Tracking**: Monitor authentication success rates
2. **Error Logging**: Log authentication failures (without exposing keys)
3. **Usage Monitoring**: Track API key usage patterns

```typescript
// Example logging (without exposing the actual key)
console.log(`API key authentication applied for endpoint: ${request.url}`);
console.log(`Using header: ${config.headerName || 'X-API-Key'}`);
// Never log: console.log(`API key: ${config.apiKey}`); // DON'T DO THIS
```
