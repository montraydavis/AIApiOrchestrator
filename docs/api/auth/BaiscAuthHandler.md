# BasicAuthHandler

Handles HTTP Basic Authentication by injecting the appropriate Authorization header into outgoing requests with Base64-encoded credentials.

## Class: BasicAuthHandler

**Implements:** `AuthHandler`

**Auth Type:** `basic`

## Configuration

### Required AuthConfig Properties

- **`username: string`** - The username for authentication
- **`password: string`** - The password for authentication

### Optional AuthConfig Properties

None - Basic authentication requires both username and password.

## Authentication Method

The handler encodes the username and password using Base64 and adds them to the Authorization header:

```
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

Where `dXNlcm5hbWU6cGFzc3dvcmQ=` is the Base64 encoding of `username:password`.

## Method Implementation

### `applyAuth(request: RequestData, config: AuthConfig, ctx: ExecutionContext): Promise<RequestData>`

Applies HTTP Basic Authentication to the outgoing request.

**Behavior:**
1. Checks if both `config.username` and `config.password` are provided
2. Encodes credentials using `Buffer.from(username:password).toString('base64')`
3. Initializes `request.headers` if not present
4. Sets the `Authorization` header with `Basic {encoded_credentials}` format
5. Returns the modified request

**Error Handling:**
- Gracefully handles missing username or password by returning the original request
- Does not throw exceptions for invalid configuration

## Usage Examples

### Basic Usage

```typescript
import { BasicAuthHandler } from '../auth/BasicAuthHandler';

const handler = new BasicAuthHandler();
const request = {
  url: 'https://api.example.com/users',
  method: 'GET',
  headers: {},
  queryParams: {}
};

const config = {
  type: 'basic',
  username: 'john_doe',
  password: 'secure_password_123'
};

const authenticatedRequest = await handler.applyAuth(request, config, {});

// Result:
// request.headers['Authorization'] = 'Basic am9obl9kb2U6c2VjdXJlX3Bhc3N3b3JkXzEyMw=='
```

### With ApiExecutionEngine (Global Auth)

```typescript
import { ApiExecutionEngine } from '../execution/ApiExecutionEngine';
import { ApiEndpoint } from '../models/ApiEndpoint';

const engine = new ApiExecutionEngine(aoai, {
  globalAuth: {
    type: 'basic',
    username: process.env.API_USERNAME,
    password: process.env.API_PASSWORD
  }
});

const endpoint = new ApiEndpoint({
  id: 'getSecureData',
  name: 'Get Secure Data',
  method: 'GET',
  baseUrl: 'https://secure-api.example.com',
  path: '/secure/data'
});

// Basic auth will be automatically added to Authorization header
const result = await engine.executeEndpoint(endpoint);
```

### Per-Endpoint Configuration

```typescript
const endpoint = new ApiEndpoint({
  id: 'legacyEndpoint',
  name: 'Legacy System Endpoint',
  method: 'POST',
  baseUrl: 'https://legacy-system.example.com',
  path: '/api/users',
  auth: {
    type: 'basic',
    username: 'legacy_user',
    password: 'legacy_password'
  }
});

const result = await engine.executeEndpoint(endpoint);
```

### Environment-Based Configuration

```typescript
const config = {
  type: 'basic',
  username: process.env.BASIC_AUTH_USERNAME,
  password: process.env.BASIC_AUTH_PASSWORD
};

// Verify configuration
if (!config.username || !config.password) {
  throw new Error('Basic auth credentials not configured');
}
```

## Common Use Cases

### Legacy API Integration

```typescript
// Many older APIs still use Basic Authentication
const legacyApiConfig = {
  type: 'basic',
  username: 'api_client',
  password: 'client_secret_key'
};
```

### Internal Service Authentication

```typescript
// Internal microservices communication
const serviceConfig = {
  type: 'basic',
  username: process.env.SERVICE_USERNAME,
  password: process.env.SERVICE_PASSWORD
};
```

### Development and Testing

```typescript
// Simple authentication for development environments
const devConfig = {
  type: 'basic',
  username: 'dev_user',
  password: 'dev_password'
};
```

### Admin Panel Access

```typescript
// Administrative endpoints
const adminConfig = {
  type: 'basic',
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD
};
```

## Security Considerations

### Credential Storage

**✅ Secure Practices:**
```typescript
// Use environment variables
const config = {
  type: 'basic',
  username: process.env.API_USERNAME,
  password: process.env.API_PASSWORD
};

// Use secure credential stores
const config = {
  type: 'basic',
  username: await getSecretFromVault('api-username'),
  password: await getSecretFromVault('api-password')
};

// Use configuration management
const config = {
  type: 'basic',
  username: await loadFromSecureConfig('auth.username'),
  password: await loadFromSecureConfig('auth.password')
};
```

**❌ Insecure Practices:**
```typescript
// Never hardcode credentials
const config = {
  type: 'basic',
  username: 'admin',           // DON'T DO THIS
  password: 'password123'      // DON'T DO THIS
};

// Don't store in version control
const config = {
  type: 'basic',
  username: 'user',
  password: fs.readFileSync('password.txt', 'utf8') // INSECURE
};
```

### Transport Security

**Critical Requirements:**
- **HTTPS Only**: Basic auth credentials are only Base64 encoded, not encrypted
- **Certificate Validation**: Always validate SSL certificates
- **No HTTP**: Never send Basic auth over unencrypted connections

```typescript
// Good: HTTPS endpoints only
const secureConfig = {
  type: 'basic',
  username: process.env.USERNAME,
  password: process.env.PASSWORD
};

// Bad: HTTP endpoints expose credentials
// const insecureEndpoint = 'http://api.example.com'; // DON'T DO THIS
```

### Credential Management

#### Password Complexity

```typescript
function validateCredentials(username: string, password: string): boolean {
  if (!username || username.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }
  
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  // Check for common weak passwords
  const weakPasswords = ['password', '123456', 'admin', 'test'];
  if (weakPasswords.includes(password.toLowerCase())) {
    throw new Error('Password is too weak');
  }
  
  return true;
}
```

#### Credential Rotation

```typescript
class CredentialRotationManager {
  private credentialCache = new Map<string, { username: string, password: string, expires: Date }>();
  
  async getCredentials(service: string): Promise<{ username: string, password: string }> {
    const cached = this.credentialCache.get(service);
    
    if (cached && cached.expires > new Date()) {
      return { username: cached.username, password: cached.password };
    }
    
    const newCredentials = await this.rotateCredentials(service);
    this.cacheCredentials(service, newCredentials);
    
    return newCredentials;
  }
  
  private async rotateCredentials(service: string): Promise<{ username: string, password: string }> {
    // Implementation for credential rotation
    throw new Error('Not implemented');
  }
  
  private cacheCredentials(service: string, credentials: { username: string, password: string }): void {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    this.credentialCache.set(service, { ...credentials, expires });
  }
}
```

### Base64 Encoding Security

**Important Notes:**
- Base64 is **encoding**, not **encryption**
- Credentials are easily decoded: `atob('dXNlcjpwYXNz')` → `'user:pass'`
- Always use HTTPS to encrypt the entire request

```typescript
// Example of how easily Basic auth can be decoded
function decodeBasicAuth(authHeader: string): { username: string, password: string } | null {
  if (!authHeader.startsWith('Basic ')) {
    return null;
  }
  
  const encoded = authHeader.substring(6);
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const [username, password] = decoded.split(':');
  
  return { username, password };
}

// This is why HTTPS is critical for Basic auth
```

## Error Handling

The handler implements comprehensive error handling:

```typescript
async applyAuth(request: RequestData, config: AuthConfig, ctx: ExecutionContext): Promise<RequestData> {
  // Handle missing username
  if (!config.username) {
    console.warn('Basic auth username not provided, skipping authentication');
    return request;
  }
  
  // Handle missing password
  if (!config.password) {
    console.warn('Basic auth password not provided, skipping authentication');
    return request;
  }
  
  // Handle invalid credential types
  if (typeof config.username !== 'string' || typeof config.password !== 'string') {
    console.warn('Basic auth credentials must be strings, skipping authentication');
    return request;
  }
  
  try {
    // Encode credentials
    const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    
    // Apply authentication
    request.headers = request.headers || {};
    request.headers['Authorization'] = `Basic ${credentials}`;
    
    return request;
  } catch (error) {
    console.error('Failed to encode basic auth credentials:', error);
    return request;
  }
}
```

## Testing

### Unit Tests

```typescript
import { BasicAuthHandler } from '../auth/BasicAuthHandler';

describe('BasicAuthHandler', () => {
  let handler: BasicAuthHandler;
  let request: RequestData;
  let config: AuthConfig;
  let context: ExecutionContext;
  
  beforeEach(() => {
    handler = new BasicAuthHandler();
    request = {
      url: 'https://api.example.com/test',
      method: 'GET',
      headers: {},
      queryParams: {}
    };
    config = { 
      type: 'basic', 
      username: 'testuser',
      password: 'testpass'
    };
    context = { results: new Map(), variables: new Map() };
  });
  
  it('should add Authorization header with Basic prefix', async () => {
    const result = await handler.applyAuth(request, config, context);
    
    const expectedEncoding = Buffer.from('testuser:testpass').toString('base64');
    expect(result.headers['Authorization']).toBe(`Basic ${expectedEncoding}`);
  });
  
  it('should encode credentials correctly', async () => {
    config.username = 'john_doe';
    config.password = 'secure_password_123';
    
    const result = await handler.applyAuth(request, config, context);
    
    // Verify encoding is correct
    const authHeader = result.headers['Authorization'];
    const encodedPart = authHeader.replace('Basic ', '');
    const decoded = Buffer.from(encodedPart, 'base64').toString('utf8');
    
    expect(decoded).toBe('john_doe:secure_password_123');
  });
  
  it('should handle missing username gracefully', async () => {
    delete config.username;
    
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['Authorization']).toBeUndefined();
    expect(result).toBe(request);
  });
  
  it('should handle missing password gracefully', async () => {
    delete config.password;
    
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['Authorization']).toBeUndefined();
    expect(result).toBe(request);
  });
  
  it('should preserve existing headers', async () => {
    request.headers['Content-Type'] = 'application/json';
    
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['Content-Type']).toBe('application/json');
    expect(result.headers['Authorization']).toContain('Basic');
  });
  
  it('should handle special characters in credentials', async () => {
    config.username = 'user@domain.com';
    config.password = 'p@ssw0rd!#;
    
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['Authorization']).toContain('Basic');
    
    // Verify decoding works correctly
    const authHeader = result.headers['Authorization'];
    const encodedPart = authHeader.replace('Basic ', '');
    const decoded = Buffer.from(encodedPart, 'base64').toString('utf8');
    
    expect(decoded).toBe('user@domain.com:p@ssw0rd!#);
  });
  
  it('should override existing Authorization header', async () => {
    request.headers['Authorization'] = 'Bearer old-token';
    
    const result = await handler.applyAuth(request, config, context);
    
    expect(result.headers['Authorization']).toContain('Basic');
    expect(result.headers['Authorization']).not.toContain('Bearer');
  });
});
```

### Integration Tests

```typescript
describe('BasicAuthHandler Integration', () => {
  it('should work with legacy API', async () => {
    const aoai = new AOAI();
    const engine = new ApiExecutionEngine(aoai, {
      globalAuth: {
        type: 'basic',
        username: 'legacy_user',
        password: 'legacy_password'
      }
    });
    
    const endpoint = new ApiEndpoint({
      id: 'legacyTest',
      name: 'Legacy API Test',
      method: 'GET',
      baseUrl: 'https://httpbin.org',
      path: '/basic-auth/legacy_user/legacy_password'
    });
    
    const result = await engine.executeEndpoint(endpoint);
    
    expect(result.requestData.headers['Authorization']).toContain('Basic');
    expect(result.success).toBe(true);
  });
  
  it('should handle authentication failure gracefully', async () => {
    const aoai = new AOAI();
    const engine = new ApiExecutionEngine(aoai);
    
    const endpoint = new ApiEndpoint({
      id: 'authFailTest',
      name: 'Auth Failure Test',
      method: 'GET',
      baseUrl: 'https://httpbin.org',
      path: '/basic-auth/correct_user/correct_password',
      auth: {
        type: 'basic',
        username: 'wrong_user',
        password: 'wrong_password'
      }
    });
    
    const result = await engine.executeEndpoint(endpoint);
    
    expect(result.requestData.headers['Authorization']).toContain('Basic');
    expect(result.statusCode).toBe(401); // Unauthorized
  });
});
```

### Security Tests

```typescript
describe('BasicAuthHandler Security', () => {
  it('should properly encode various character sets', () => {
    const testCases = [
      { username: 'user', password: 'pass', expected: 'dXNlcjpwYXNz' },
      { username: 'admin@example.com', password: 'p@ssw0rd!', expected: Buffer.from('admin@example.com:p@ssw0rd!').toString('base64') },
      { username: 'user with spaces', password: 'password with spaces', expected: Buffer.from('user with spaces:password with spaces').toString('base64') }
    ];
    
    testCases.forEach(testCase => {
      const encoded = Buffer.from(`${testCase.username}:${testCase.password}`).toString('base64');
      expect(encoded).toBe(testCase.expected);
    });
  });
  
  it('should handle Unicode characters correctly', async () => {
    const handler = new BasicAuthHandler();
    const request = { url: 'https://api.example.com', method: 'GET', headers: {}, queryParams: {} };
    const config = {
      type: 'basic',
      username: 'üser',
      password: 'pässwörd'
    };
    
    const result = await handler.applyAuth(request, config, {});
    
    // Verify Unicode handling
    const authHeader = result.headers['Authorization'];
    const encodedPart = authHeader.replace('Basic ', '');
    const decoded = Buffer.from(encodedPart, 'base64').toString('utf8');
    
    expect(decoded).toBe('üser:pässwörd');
  });
});
```

## Best Practices

### Configuration Management

1. **Environment-Specific Credentials**: Use different credentials per environment
```typescript
const getBasicAuthConfig = () => {
  const env = process.env.NODE_ENV;
  
  return {
    type: 'basic',
    username: process.env[`BASIC_AUTH_USERNAME_${env.toUpperCase()}`],
    password: process.env[`BASIC_AUTH_PASSWORD_${env.toUpperCase()}`]
  };
};
```

2. **Credential Validation**: Validate credentials at startup
```typescript
function validateBasicAuthConfig(config: AuthConfig): void {
  if (config.type !== 'basic') return;
  
  if (!config.username || !config.password) {
    throw new Error('Basic auth requires both username and password');
  }
  
  if (config.username.includes(':')) {
    throw new Error('Username cannot contain colon character');
  }
  
  validateCredentials(config.username, config.password);
}
```

3. **Secure Defaults**: Use secure configuration patterns
```typescript
const createSecureBasicAuth = (service: string) => ({
  type: 'basic',
  username: process.env[`${service.toUpperCase()}_USERNAME`] || 
           (() => { throw new Error(`${service} username not configured`); })(),
  password: process.env[`${service.toUpperCase()}_PASSWORD`] || 
           (() => { throw new Error(`${service} password not configured`); })()
});
```

### Security Hardening

1. **Credential Rotation**: Implement regular credential rotation
2. **Access Monitoring**: Monitor authentication attempts and failures
3. **Principle of Least Privilege**: Use accounts with minimal required permissions
4. **Account Lockout**: Implement account lockout policies for failed attempts

### Performance Optimization

1. **Credential Caching**: Cache encoded credentials to avoid repeated encoding
```typescript
class CachedBasicAuthHandler extends BasicAuthHandler {
  private encodingCache = new Map<string, string>();
  
  private getEncodedCredentials(username: string, password: string): string {
    const key = `${username}:${password}`;
    
    if (!this.encodingCache.has(key)) {
      const encoded = Buffer.from(key).toString('base64');
      this.encodingCache.set(key, encoded);
    }
    
    return this.encodingCache.get(key)!;
  }
  
  async applyAuth(request: RequestData, config: AuthConfig, ctx: ExecutionContext): Promise<RequestData> {
    if (!config.username || !config.password) {
      return request;
    }
    
    const encoded = this.getEncodedCredentials(config.username, config.password);
    
    request.headers = request.headers || {};
    request.headers['Authorization'] = `Basic ${encoded}`;
    
    return request;
  }
}
```

### Monitoring and Logging

```typescript
// Good: Log authentication events without exposing credentials
console.log('Basic authentication applied for endpoint:', request.url);
console.log('Username:', config.username);

// Bad: Never log passwords or encoded credentials
// console.log('Password:', config.password); // DON'T DO THIS
// console.log('Encoded:', encodedCredentials); // DON'T DO THIS
```

## Migration from Basic Auth

When migrating away from Basic Authentication:

1. **Choose Modern Alternative**: Consider Bearer tokens, OAuth 2.0, or API keys
2. **Gradual Migration**: Support both old and new auth methods during transition
3. **Deprecation Timeline**: Provide clear timeline for Basic auth deprecation
4. **Security Upgrade**: Ensure new method provides better security

```typescript
// Example migration strategy
const getAuthConfig = (): AuthConfig => {
  if (process.env.USE_MODERN_AUTH === 'true') {
    return {
      type: 'bearerToken',
      token: process.env.ACCESS_TOKEN
    };
  }
  
  // Fallback to Basic auth during migration
  return {
    type: 'basic',
    username: process.env.BASIC_USERNAME,
    password: process.env.BASIC_PASSWORD
  };
};
```
