# BearerTokenAuthHandler

Handles Bearer Token authentication by injecting the token into the Authorization header of outgoing requests.

## Class: BearerTokenAuthHandler

**Implements:** `AuthHandler`

**Auth Type:** `bearerToken`

## Configuration

### Required AuthConfig Properties

- **`token: string`** - The bearer token value to include in requests

### Optional AuthConfig Properties

None - Bearer token authentication only requires the token value.

## Authentication Method

The handler adds the bearer token to the Authorization header using the standard Bearer scheme:

```
Authorization: Bearer your-token-here
```

## Method Implementation

### `applyAuth(request: RequestData, config: AuthConfig, ctx: ExecutionContext): Promise<RequestData>`

Applies Bearer Token authentication to the outgoing request.

**Behavior:**

1. Checks if `config.token` is provided
2. Initializes `request.headers` if not present
3. Sets the `Authorization` header with `Bearer {token}` format
4. Returns the modified request

**Error Handling:**

- Gracefully handles missing `token` by returning the original request
- Does not throw exceptions for invalid configuration

## Usage Examples

### Basic Usage

```typescript
import { BearerTokenAuthHandler } from '../auth/BearerTokenAuthHandler';

const handler = new BearerTokenAuthHandler();
const request = {
  url: 'https://api.example.com/users',
  method: 'GET',
  headers: {},
  queryParams: {}
};

const config = {
  type: 'bearerToken',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};

const authenticatedRequest = await handler.applyAuth(request, config, {});

// Result:
// request.headers['Authorization'] = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### With ApiExecutionEngine (Global Auth)

```typescript
import { ApiExecutionEngine } from '../execution/ApiExecutionEngine';
import { ApiEndpoint } from '../models/ApiEndpoint';

const engine = new ApiExecutionEngine(aoai, {
  globalAuth: {
    type: 'bearerToken',
    token: process.env.ACCESS_TOKEN
  }
});

const endpoint = new ApiEndpoint({
  id: 'getProfile',
  name: 'Get User Profile',
  method: 'GET',
  baseUrl: 'https://api.example.com',
  path: '/profile'
});

// Bearer token will be automatically added to Authorization header
const result = await engine.executeEndpoint(endpoint);
```

### Per-Endpoint Configuration

```typescript
const endpoint = new ApiEndpoint({
  id: 'adminEndpoint',
  name: 'Admin Endpoint',
  method: 'POST',
  baseUrl: 'https://admin-api.example.com',
  path: '/admin/users',
  auth: {
    type: 'bearerToken',
    token: 'admin-specific-token-12345'
  }
});

const result = await engine.executeEndpoint(endpoint);
```

## Token Types

Bearer tokens are commonly used for various authentication schemes:

### JSON Web Tokens (JWT)

```typescript
const config = {
  type: 'bearerToken',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
};
```

### OAuth 2.0 Access Tokens

```typescript
const config = {
  type: 'bearerToken',
  token: 'ya29.A0ARrdaM-1234567890abcdefghijklmnop...'
};
```

### Personal Access Tokens

```typescript
const config = {
  type: 'bearerToken',
  token: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz'
};
```

### API-Specific Bearer Tokens

```typescript
const config = {
  type: 'bearerToken',
  token: 'sk-proj-1234567890abcdefghijklmnopqrstuvwxyz...'
};
```

## Security Considerations

### Token Storage

**✅ Secure Practices:**

```typescript
// Use environment variables
const config = {
  type: 'bearerToken',
  token: process.env.ACCESS_TOKEN
};

// Use secure credential stores
const config = {
  type: 'bearerToken', 
  token: await getSecretFromVault('access-token')
};

// Load from secure configuration
const config = {
  type: 'bearerToken',
  token: await loadTokenFromSecureConfig()
};
```

**❌ Insecure Practices:**

```typescript
// Never hardcode tokens
const config = {
  type: 'bearerToken',
  token: 'eyJhbGciOiJIUzI1NiIs...', // DON'T DO THIS
};

// Don't store in plain text files
const config = {
  type: 'bearerToken',
  token: fs.readFileSync('token.txt', 'utf8') // INSECURE
};
```

### Token Management

#### Token Expiration

```typescript
interface TokenManager {
  getValidToken(): Promise<string>;
  refreshTokenIfNeeded(): Promise<string>;
  isTokenExpired(token: string): boolean;
}

class JWTTokenManager implements TokenManager {
  async getValidToken(): Promise<string> {
    const currentToken = process.env.ACCESS_TOKEN;
    
    if (this.isTokenExpired(currentToken)) {
      return await this.refreshTokenIfNeeded();
    }
    
    return currentToken;
  }
  
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true; // Treat invalid tokens as expired
    }
  }
  
  async refreshTokenIfNeeded(): Promise<string> {
    // Implementation for token refresh
    throw new Error('Token refresh not implemented');
  }
}
```

#### Dynamic Token Resolution

```typescript
class DynamicBearerTokenHandler extends BearerTokenAuthHandler {
  constructor(private tokenManager: TokenManager) {
    super();
  }
  
  async applyAuth(request: RequestData, config: AuthConfig, ctx: ExecutionContext): Promise<RequestData> {
    // Get fresh token dynamically
    const freshToken = await this.tokenManager.getValidToken();
    
    // Create config with fresh token
    const freshConfig = { ...config, token: freshToken };
    
    // Apply authentication with fresh token
    return super.applyAuth(request, freshConfig, ctx);
  }
}
```

### Transport Security

- **HTTPS Only**: Never send bearer tokens over HTTP
- **Certificate Validation**: Validate SSL certificates
- **Header Security**: Protect Authorization headers from logging/exposure

### Token Validation

```typescript
function validateBearerToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Check minimum length
  if (token.length < 10) {
    return false;
  }
  
  // Check for suspicious patterns
  if (token.includes(' ') || token.includes('\n')) {
    return false;
  }
  
  return true;
}
```

## Error Handling

The handler implements comprehensive error handling:

```typescript
async applyAuth(request: RequestData, config: AuthConfig, ctx: ExecutionContext): Promise<RequestData> {
  // Handle missing token
  if (!config.token) {
    console.warn('Bearer token not provided, skipping authentication');
    return request;
  }
  
  // Handle invalid token format
  if (typeof config.token !== 'string' || config.token.trim() === '') {
    console.warn('Invalid bearer token format, skipping authentication');
    return request;
  }
  
  // Apply authentication
  request.headers = request.headers || {};
  request.headers['Authorization'] = `Bearer ${config.token}`;
  
  return request;
}
```

## Testing

### Unit Tests

```typescript
import { BearerTokenAuthHandler } from '../auth/BearerTokenAuthHandler';

describe('BearerTokenAuthHandler', () => {
  let handler: BearerTokenAuthHandler;
  let request: RequestData;
  let config: AuthConfig;
  let context: ExecutionContext;
  
  beforeEach(() => {
    handler = new BearerTokenAuthHandler();
    request = {
      url: 'https://api.example.com/test',
      method: 'GET',
      headers: {},
      queryParams: {}
    };
    config = { 
      type: 'bearerToken', 
      token: 'test-token-12345' 
    };
    context = { results: new Map(), variables: new Map() };
  });
  
  it('should add Authorization header with Bearer prefix', async () => {
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['Authorization']).toBe('Bearer test-token-12345');
  });
  
  it('should handle JWT tokens', async () => {
    config.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['Authorization']).toBe(`Bearer ${config.token}`);
  });
  
  it('should handle missing token gracefully', async () => {
    delete config.token;
    
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['Authorization']).toBeUndefined();
    expect(result).toBe(request);
  });
  
  it('should preserve existing headers', async () => {
    request.headers['Content-Type'] = 'application/json';
    
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['Content-Type']).toBe('application/json');
    expect(result.headers['Authorization']).toBe('Bearer test-token-12345');
  });
  
  it('should override existing Authorization header', async () => {
    request.headers['Authorization'] = 'Basic old-auth';
    
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['Authorization']).toBe('Bearer test-token-12345');
  });
});
```

### Integration Tests

```typescript
describe('BearerTokenAuthHandler Integration', () => {
  it('should work with OAuth 2.0 flow', async () => {
    // Mock OAuth token retrieval
    const mockToken = 'ya29.A0ARrdaM-mock-oauth-token';
    
    const aoai = new AOAI();
    const engine = new ApiExecutionEngine(aoai, {
      globalAuth: {
        type: 'bearerToken',
        token: mockToken
      }
    });
    
    const endpoint = new ApiEndpoint({
      id: 'oauthTest',
      name: 'OAuth Protected Resource',
      method: 'GET',
      baseUrl: 'https://www.googleapis.com',
      path: '/oauth2/v2/userinfo'
    });
    
    const result = await engine.executeEndpoint(endpoint);
    
    expect(result.requestData.headers['Authorization']).toBe(`Bearer ${mockToken}`);
  });
  
  it('should handle token refresh scenario', async () => {
    let currentToken = 'expired-token';
    
    const dynamicHandler = {
      async applyAuth(request, config, ctx) {
        // Simulate token refresh
        if (currentToken === 'expired-token') {
          currentToken = 'refreshed-token-new';
        }
        
        request.headers = request.headers || {};
        request.headers['Authorization'] = `Bearer ${currentToken}`;
        return request;
      }
    };
    
    const registry = new AuthHandlerRegistry();
    registry.register('bearerToken', dynamicHandler);
    
    // Test with custom registry
    const aoai = new AOAI();
    const engine = new ApiExecutionEngine(aoai);
    engine.authRegistry = registry;
    
    const endpoint = new ApiEndpoint({
      id: 'refreshTest',
      name: 'Token Refresh Test',
      method: 'GET',
      baseUrl: 'https://api.example.com',
      path: '/protected',
      auth: { type: 'bearerToken', token: 'expired-token' }
    });
    
    const result = await engine.executeEndpoint(endpoint);
    
    expect(result.requestData.headers['Authorization']).toBe('Bearer refreshed-token-new');
  });
});
```

## Best Practices

### Token Management

1. **Environment-Specific Tokens**: Use different tokens for different environments

```typescript
const getTokenForEnvironment = () => {
  switch (process.env.NODE_ENV) {
    case 'production': return process.env.PROD_ACCESS_TOKEN;
    case 'staging': return process.env.STAGING_ACCESS_TOKEN;
    default: return process.env.DEV_ACCESS_TOKEN;
  }
};

const config = {
  type: 'bearerToken',
  token: getTokenForEnvironment()
};
```

2. **Token Rotation**: Implement automatic token rotation

```typescript
class TokenRotationManager {
  private tokenCache = new Map<string, { token: string, expires: Date }>();
  
  async getToken(key: string): Promise<string> {
    const cached = this.tokenCache.get(key);
    
    if (cached && cached.expires > new Date()) {
      return cached.token;
    }
    
    const newToken = await this.refreshToken(key);
    this.cacheToken(key, newToken);
    
    return newToken;
  }
  
  private async refreshToken(key: string): Promise<string> {
    // Implementation for token refresh
    throw new Error('Not implemented');
  }
  
  private cacheToken(key: string, token: string): void {
    const expires = new Date(Date.now() + 3600000); // 1 hour
    this.tokenCache.set(key, { token, expires });
  }
}
```

### Security

1. **Token Validation**: Validate tokens before use
2. **Scope Management**: Use tokens with minimal required scopes
3. **Monitoring**: Monitor token usage and detect anomalies
4. **Revocation**: Have processes for revoking compromised tokens

### Performance

1. **Token Caching**: Cache tokens to avoid repeated retrieval
2. **Lazy Loading**: Load tokens only when needed
3. **Connection Reuse**: Reuse HTTP connections where possible

### Logging and Monitoring

```typescript
// Good: Log authentication events without exposing tokens
console.log('Bearer token authentication applied for endpoint:', request.url);
console.log('Token length:', config.token?.length || 0);

// Bad: Never log actual tokens
// console.log('Using token:', config.token); // DON'T DO THIS
```
