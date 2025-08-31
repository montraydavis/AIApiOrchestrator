# Authentication

Pluggable authentication system for API requests with support for multiple authentication methods and custom handlers.

## Overview

The authentication module provides a flexible, extensible system for handling various authentication methods in API requests. It uses an interface-based design with a registry pattern to manage different authentication handlers.

## Architecture

The authentication system consists of three main components:

### Core Components

1. **`AuthHandler`** - Interface defining the authentication contract
2. **`AuthHandlerRegistry`** - Registry for managing authentication handlers by type
3. **Handler Implementations** - Concrete implementations for specific auth methods

### Design Pattern

```
AuthConfig → AuthHandlerRegistry → AuthHandler → Modified RequestData
```

The system follows a clean separation of concerns:

- **Configuration** (`AuthConfig`) specifies what authentication to use
- **Registry** (`AuthHandlerRegistry`) manages and retrieves handlers
- **Handlers** (`AuthHandler` implementations) apply authentication to requests

## Supported Authentication Types

| Type | Handler | Description | Configuration |
|------|---------|-------------|---------------|
| `apiKey` | `ApiKeyAuthHandler` | API key in custom header | `apiKey`, `headerName` |
| `bearerToken` | `BearerTokenAuthHandler` | Bearer token in Authorization header | `token` |
| `basic` | `BasicAuthHandler` | HTTP Basic Authentication | `username`, `password` |
| `custom` | User-defined | Custom authentication logic | `customHandler` function |
| `oauth2` | *Not implemented* | OAuth 2.0 authentication | `token` |
| `none` | Built-in | No authentication | None |

## Usage Patterns

### Basic Usage with ApiExecutionEngine

```typescript
import { ApiExecutionEngine } from '../execution/ApiExecutionEngine';
import { AOAI } from '../ai/AOAI';

// Global authentication
const engine = new ApiExecutionEngine(aoai, {
  globalAuth: {
    type: 'bearerToken',
    token: 'your-token-here'
  }
});

// Per-endpoint authentication
const endpoint = new ApiEndpoint({
  // ... endpoint config
  auth: {
    type: 'apiKey',
    apiKey: 'your-api-key',
    headerName: 'X-API-Key'
  }
});
```

### Direct Handler Usage

```typescript
import { ApiKeyAuthHandler } from '../auth/ApiKeyAuthHandler';
import { AuthHandlerRegistry } from '../auth/AuthHandlerRegistry';

// Create registry and register handlers
const registry = new AuthHandlerRegistry();
registry.register('apiKey', new ApiKeyAuthHandler());

// Get and use handler
const handler = registry.getHandler('apiKey');
const authenticatedRequest = await handler.applyAuth(request, config, context);
```

## Authentication Precedence

The system applies authentication in the following order:

1. **Endpoint-specific auth** (`endpoint.auth`) - Takes highest priority
2. **Global auth** (`globalAuth`) - Applied when endpoint has no auth
3. **No authentication** - When neither is configured

## Handler Registration

The `ApiExecutionEngine` automatically registers these handlers:

```typescript
// Automatically registered in ApiExecutionEngine constructor
this.authRegistry.register('apiKey', new ApiKeyAuthHandler());
this.authRegistry.register('bearerToken', new BearerTokenAuthHandler());
this.authRegistry.register('basic', new BasicAuthHandler());
```

## Extension Guide

### Creating Custom Handlers

Implement the `AuthHandler` interface:

```typescript
import { AuthHandler } from '../auth/AuthHandler';

export class CustomAuthHandler implements AuthHandler {
  async applyAuth(
    request: RequestData,
    config: AuthConfig,
    ctx: ExecutionContext
  ): Promise<RequestData> {
    // Apply your custom authentication logic
    request.headers = request.headers || {};
    request.headers['Custom-Auth'] = 'your-auth-value';
    return request;
  }
}
```

### Using Custom Handler Functions

For simple custom authentication:

```typescript
const endpoint = new ApiEndpoint({
  // ... endpoint config
  auth: {
    type: 'custom',
    customHandler: async (ctx) => {
      // Custom authentication logic
      const request = /* get request from context */;
      request.headers['Custom-Header'] = 'custom-value';
      return request;
    }
  }
});
```

### Registering New Handlers

```typescript
// Register custom handler
engine.authRegistry.register('myCustomAuth', new CustomAuthHandler());

// Use in endpoint configuration
const endpoint = new ApiEndpoint({
  auth: { type: 'myCustomAuth' as AuthType }
});
```

## Security Considerations

### Credential Storage

- **Never hardcode credentials** in source code
- Use environment variables or secure credential stores
- Rotate credentials regularly

### Transport Security

- Always use HTTPS in production
- Validate SSL certificates
- Consider certificate pinning for high-security applications

### Token Management

- Implement token refresh mechanisms for long-lived applications
- Use short-lived tokens when possible
- Securely store and transmit refresh tokens

### Header Security

- Validate and sanitize authentication headers
- Be aware of header injection vulnerabilities
- Use secure defaults for custom headers

## Error Handling

Authentication handlers should:

- Gracefully handle missing or invalid credentials
- Not throw exceptions for configuration issues
- Return the original request if authentication cannot be applied
- Log authentication failures appropriately

```typescript
// Example error handling pattern
async applyAuth(request: RequestData, config: AuthConfig, ctx: ExecutionContext): Promise<RequestData> {
  if (!config.apiKey) {
    console.warn('API key not provided, skipping authentication');
    return request; // Return unmodified request
  }
  
  // Apply authentication
  request.headers = request.headers || {};
  request.headers[config.headerName || 'X-API-Key'] = config.apiKey;
  return request;
}
```

## Testing Authentication

### Unit Testing Handlers

```typescript
import { ApiKeyAuthHandler } from '../auth/ApiKeyAuthHandler';

describe('ApiKeyAuthHandler', () => {
  it('should add API key header', async () => {
    const handler = new ApiKeyAuthHandler();
    const request = { headers: {}, /* ... */ };
    const config = { type: 'apiKey', apiKey: 'test-key' };
    
    const result = await handler.applyAuth(request, config, {});
    
    expect(result.headers['X-API-Key']).toBe('test-key');
  });
});
```

### Integration Testing

Test authentication in the context of full API execution:

```typescript
const engine = new ApiExecutionEngine(aoai, {
  globalAuth: { type: 'bearerToken', token: 'test-token' }
});

// Test that requests include proper authentication
const result = await engine.executeEndpoint(endpoint);
expect(result.requestData.headers['Authorization']).toBe('Bearer test-token');
```

## Performance Considerations

- Authentication handlers are called for every request
- Keep handler logic lightweight and fast
- Cache expensive operations (e.g., token generation) when possible
- Consider async patterns for handlers that need to fetch credentials

## Common Patterns

### Environment-Based Configuration

```typescript
const auth: AuthConfig = {
  type: 'bearerToken',
  token: process.env.API_TOKEN
};
```

### Conditional Authentication

```typescript
const auth: AuthConfig = process.env.NODE_ENV === 'production'
  ? { type: 'bearerToken', token: process.env.PROD_TOKEN }
  : { type: 'none' };
```

### Multi-Header Authentication

```typescript
export class MultiHeaderAuthHandler implements AuthHandler {
  async applyAuth(request: RequestData, config: AuthConfig, ctx: ExecutionContext): Promise<RequestData> {
    request.headers = request.headers || {};
    request.headers['X-API-Key'] = config.apiKey;
    request.headers['X-Client-ID'] = config.clientId;
    return request;
  }
}
```
