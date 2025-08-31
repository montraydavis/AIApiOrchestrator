# AuthHandlerRegistry

Registry for managing authentication handlers by type. Allows registration and retrieval of AuthHandler instances for different AuthTypes.

## Class: AuthHandlerRegistry

### Properties

- `private handlers: Map<AuthType, AuthHandler>` — Internal map of authentication handlers keyed by AuthType.

### Methods

#### `register(type: AuthType, handler: AuthHandler): void`

Registers an authentication handler for a specific AuthType.

- **type**: The authentication type to register the handler for
- **handler**: The AuthHandler instance to associate with the type

#### `getHandler(type: AuthType): AuthHandler | undefined`

Retrieves the authentication handler for a given AuthType.

- **type**: The authentication type to retrieve the handler for
- **Returns**: The AuthHandler instance if registered, otherwise undefined

## Usage Patterns

### Basic Registration

```typescript
import { AuthHandlerRegistry } from '../auth/AuthHandlerRegistry';
import { ApiKeyAuthHandler } from '../auth/ApiKeyAuthHandler';
import { BearerTokenAuthHandler } from '../auth/BearerTokenAuthHandler';

const registry = new AuthHandlerRegistry();

// Register built-in handlers
registry.register('apiKey', new ApiKeyAuthHandler());
registry.register('bearerToken', new BearerTokenAuthHandler());
registry.register('basic', new BasicAuthHandler());
```

### Handler Retrieval and Usage

```typescript
// Get handler for specific auth type
const handler = registry.getHandler('apiKey');

if (handler) {
  // Apply authentication using the handler
  const authenticatedRequest = await handler.applyAuth(request, config, context);
} else {
  console.warn('No handler registered for auth type: apiKey');
}
```

### Custom Handler Registration

```typescript
import { CustomAuthHandler } from './CustomAuthHandler';

// Register custom handler
registry.register('customAuth', new CustomAuthHandler());

// Use registered handler
const customHandler = registry.getHandler('customAuth');
```

## Integration with ApiExecutionEngine

The registry is automatically initialized and populated in ApiExecutionEngine:

```typescript
export class ApiExecutionEngine {
  private authRegistry: AuthHandlerRegistry;
  
  constructor(aoai: AOAI, options: { globalAuth?: AuthConfig } = {}) {
    // Initialize registry
    this.authRegistry = new AuthHandlerRegistry();
    
    // Register default handlers
    this.authRegistry.register('apiKey', new ApiKeyAuthHandler());
    this.authRegistry.register('bearerToken', new BearerTokenAuthHandler());  
    this.authRegistry.register('basic', new BasicAuthHandler());
  }
  
  // Handler usage during endpoint execution
  private async applyAuthentication(request: RequestData, authConfig: AuthConfig): Promise<RequestData> {
    const handler = this.authRegistry.getHandler(authConfig.type);
    
    if (handler) {
      return await handler.applyAuth(request, authConfig, this.context);
    }
    
    // Handle custom auth type
    if (authConfig.type === 'custom' && authConfig.customHandler) {
      return await authConfig.customHandler(this.context);
    }
    
    return request; // No authentication applied
  }
}
```

## Registry Management

### Checking Handler Availability

```typescript
function isAuthTypeSupported(registry: AuthHandlerRegistry, authType: AuthType): boolean {
  return registry.getHandler(authType) !== undefined;
}

// Usage
if (isAuthTypeSupported(registry, 'oauth2')) {
  console.log('OAuth2 authentication is supported');
} else {
  console.log('OAuth2 handler not registered');
}
```

### Dynamic Handler Registration

```typescript
class AuthManager {
  constructor(private registry: AuthHandlerRegistry) {}
  
  enableOAuth2Support() {
    if (!this.registry.getHandler('oauth2')) {
      this.registry.register('oauth2', new OAuth2Handler());
      console.log('OAuth2 support enabled');
    }
  }
  
  enableMTLSSupport() {
    this.registry.register('mtls', new MTLSHandler());
    console.log('mTLS support enabled');
  }
}
```

### Handler Override

```typescript
// Replace existing handler with enhanced version
registry.register('apiKey', new EnhancedApiKeyHandler());

// Or conditionally register based on environment
if (process.env.NODE_ENV === 'development') {
  registry.register('apiKey', new DebugApiKeyHandler());
} else {
  registry.register('apiKey', new ApiKeyAuthHandler());
}
```

## Supported Auth Types

The registry supports all AuthType values defined in the system:

```typescript
type AuthType = 'apiKey' | 'bearerToken' | 'basic' | 'oauth2' | 'custom' | 'none';
```

### Default Registrations

When used with ApiExecutionEngine, these handlers are registered by default:

| AuthType | Handler Class | Purpose |
|----------|---------------|---------|
| `'apiKey'` | `ApiKeyAuthHandler` | API key authentication via custom headers |
| `'bearerToken'` | `BearerTokenAuthHandler` | Bearer token via Authorization header |
| `'basic'` | `BasicAuthHandler` | HTTP Basic Authentication |

### Special Auth Types

- **`'custom'`** - Not registered in registry; handled via `AuthConfig.customHandler` function
- **`'oauth2'`** - Type defined but no default handler provided
- **`'none'`** - No handler needed; authentication is skipped

## Error Handling

### Missing Handler Handling

```typescript
function safeGetHandler(registry: AuthHandlerRegistry, authType: AuthType): AuthHandler | null {
  try {
    const handler = registry.getHandler(authType);
    return handler || null;
  } catch (error) {
    console.error(`Error retrieving handler for ${authType}:`, error);
    return null;
  }
}
```

### Validation Before Registration

```typescript
function registerWithValidation(
  registry: AuthHandlerRegistry, 
  type: AuthType, 
  handler: AuthHandler
): boolean {
  if (!handler || typeof handler.applyAuth !== 'function') {
    console.error(`Invalid handler for type ${type}: must implement applyAuth method`);
    return false;
  }
  
  try {
    registry.register(type, handler);
    return true;
  } catch (error) {
    console.error(`Failed to register handler for ${type}:`, error);
    return false;
  }
}
```

## Testing

### Unit Testing

```typescript
describe('AuthHandlerRegistry', () => {
  let registry: AuthHandlerRegistry;
  let mockHandler: AuthHandler;
  
  beforeEach(() => {
    registry = new AuthHandlerRegistry();
    mockHandler = {
      applyAuth: jest.fn().mockResolvedValue({})
    };
  });
  
  describe('register', () => {
    it('should register handler for auth type', () => {
      registry.register('apiKey', mockHandler);
      
      const retrieved = registry.getHandler('apiKey');
      expect(retrieved).toBe(mockHandler);
    });
    
    it('should allow overriding existing handlers', () => {
      const firstHandler = { applyAuth: jest.fn() };
      const secondHandler = { applyAuth: jest.fn() };
      
      registry.register('apiKey', firstHandler);
      registry.register('apiKey', secondHandler);
      
      expect(registry.getHandler('apiKey')).toBe(secondHandler);
    });
  });
  
  describe('getHandler', () => {
    it('should return undefined for unregistered type', () => {
      const handler = registry.getHandler('oauth2');
      expect(handler).toBeUndefined();
    });
    
    it('should return registered handler', () => {
      registry.register('bearerToken', mockHandler);
      
      const handler = registry.getHandler('bearerToken');
      expect(handler).toBe(mockHandler);
    });
  });
});
```

### Integration Testing

```typescript
describe('AuthHandlerRegistry Integration', () => {
  it('should work with ApiExecutionEngine', async () => {
    const customHandler = new CustomAuthHandler();
    const aoai = new AOAI();
    const engine = new ApiExecutionEngine(aoai);
    
    // Register custom handler
    engine.authRegistry.register('custom', customHandler);
    
    const endpoint = new ApiEndpoint({
      id: 'test',
      name: 'Test',
      method: 'GET',
      baseUrl: 'https://api.example.com',
      path: '/test',
      auth: { type: 'custom', customData: 'test' }
    });
    
    const result = await engine.executeEndpoint(endpoint);
    
    // Verify custom authentication was applied
    expect(result.requestData.headers['X-Custom-Auth']).toBeDefined();
  });
});
```

## Best Practices

### Registry Initialization

1. **Early registration**: Register all handlers during application startup
2. **Environment-based registration**: Register different handlers based on environment
3. **Validation**: Validate handlers before registration
4. **Documentation**: Document all registered handler types

### Handler Management

1. **Single responsibility**: Each handler should handle exactly one auth type
2. **Immutability**: Don't modify handlers after registration
3. **Testing**: Test registry operations with mock handlers
4. **Error handling**: Gracefully handle missing or invalid handlers

### Performance Considerations

1. **Handler reuse**: Handlers are registered once and reused for all requests
2. **Lightweight handlers**: Keep handler instances lightweight and stateless
3. **Lazy initialization**: Consider lazy handler initialization for expensive setups
4. **Memory management**: Handlers stay in memory for the application lifetime

## Advanced Patterns

### Handler Factory Pattern

```typescript
class AuthHandlerFactory {
  static createRegistry(): AuthHandlerRegistry {
    const registry = new AuthHandlerRegistry();
    
    // Register production handlers
    registry.register('apiKey', new ApiKeyAuthHandler());
    registry.register('bearerToken', new BearerTokenAuthHandler());
    registry.register('basic', new BasicAuthHandler());
    
    // Conditionally register additional handlers
    if (process.env.OAUTH_ENABLED === 'true') {
      registry.register('oauth2', new OAuth2Handler());
    }
    
    return registry;
  }
}
```

### Plugin Architecture

```typescript
interface AuthPlugin {
  getHandlerType(): AuthType;
  createHandler(): AuthHandler;
}

class AuthPluginManager {
  constructor(private registry: AuthHandlerRegistry) {}
  
  loadPlugin(plugin: AuthPlugin): void {
    const handler = plugin.createHandler();
    this.registry.register(plugin.getHandlerType(), handler);
  }
}
```
