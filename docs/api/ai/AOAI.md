# AOAI

Wrapper class for Azure OpenAI API configuration and client. Provides a simplified interface for chat completions using streaming responses.

## Environment Variables

- `AOAI_API_KEY`: Azure OpenAI API key. **Required**.
- `AOAI_ENDPOINT`: Azure OpenAI endpoint URL. **Required**.
- `AOAI_DEPLOYMENT` (optional): Deployment name (default: `gpt-4.1`).
- `AOAI_API_VERSION` (optional): API version (default: `2024-10-21`).

## Class: AOAI

### Properties

- `AOAI_API_KEY: string | undefined = process.env['AOAI_API_KEY']` — The API key loaded from environment variable.
- `AOAI_ENDPOINT: string | undefined = process.env['AOAI_ENDPOINT']` — The endpoint URL loaded from environment variable.
- `AOAI_DEPLOYMENT: string | undefined = "gpt-4.1"` — The deployment name with default value.
- `AOAI_API_VERSION: string | undefined = "2024-10-21"` — The API version with default value.
- `client: AzureOpenAI` — The initialized Azure OpenAI client instance.

### Constructor

`new AOAI()`

- Validates that `AOAI_API_KEY` and `AOAI_ENDPOINT` environment variables are set.
- Throws an error if either required environment variable is missing.
- Initializes the AzureOpenAI client with deployment, apiKey, endpoint, and apiVersion.

**Error Handling:**

- Throws `Error('AOAI_API_KEY and AOAI_ENDPOINT must be set')` if required environment variables are missing.

### Methods

#### `chat(input: string, model: string = "gpt-4.1"): Promise<string>`

Sends a chat message to the Azure OpenAI model and returns the response as a concatenated string.

**Parameters:**

- `input`: The user input to send to the model.
- `model` (optional): The deployment name to use (defaults to `"gpt-4.1"`).

**Returns:**

- `Promise<string>`: The model response text concatenated from streaming chunks.

**Implementation Details:**

- Uses streaming chat completions (`stream: true`)
- Sets `max_tokens: 128` (hardcoded limit)
- Iterates through streaming events to build response
- Concatenates `choice.delta?.content` from each chunk
- Returns complete response once stream ends

**Error Handling:**

- May throw errors from the underlying Azure OpenAI client
- Network failures, authentication errors, and rate limits can cause rejections

## Implementation Details

### Streaming Architecture

The `chat` method uses Azure OpenAI's streaming API:

```typescript
const events = await this.client.chat.completions.create({
  stream: true,
  messages: [{ role: "user", content: input }],
  max_tokens: 128,
  model: model
});

let response = '';
for await (const event of events) {
  for (const choice of event.choices) {
    response += choice.delta?.content ?? '';
  }
}
```

### Token Limitations

- **Fixed Token Limit**: `max_tokens: 128` is hardcoded
- **Response Truncation**: Responses longer than 128 tokens will be cut off
- **No Configuration**: Token limit cannot be adjusted at runtime

### Response Processing

1. **Streaming Chunks**: Receives incremental response chunks from Azure OpenAI
2. **Content Extraction**: Extracts `delta.content` from each choice in each chunk
3. **String Concatenation**: Builds final response by concatenating all content chunks
4. **Null Handling**: Uses nullish coalescing (`??`) to handle undefined content

## Usage Examples

### Basic Usage

```typescript
import { AOAI } from '../ai/AOAI';

// Ensure environment variables are set first
if (!process.env.AOAI_API_KEY || !process.env.AOAI_ENDPOINT) {
  throw new Error('Azure OpenAI credentials not configured');
}

async function basicExample() {
  const aoai = new AOAI();
  const reply = await aoai.chat('Write a haiku about APIs.');
  console.log(reply);
}

basicExample().catch(console.error);
```

### Error Handling

```typescript
import { AOAI } from '../ai/AOAI';

async function robustExample() {
  try {
    const aoai = new AOAI();
    const reply = await aoai.chat('Explain TypeScript interfaces.');
    console.log('AI Response:', reply);
  } catch (error) {
    if (error.message.includes('AOAI_API_KEY and AOAI_ENDPOINT must be set')) {
      console.error('Configuration Error: Missing required environment variables');
    } else {
      console.error('AI Request Failed:', error.message);
    }
  }
}
```

### Different Models

```typescript
async function modelExample() {
  const aoai = new AOAI();
  
  // Use default model (gpt-4.1)
  const defaultResponse = await aoai.chat('Hello!');
  
  // Use specific model deployment
  const specificResponse = await aoai.chat('Hello!', 'gpt-3.5-turbo');
  
  console.log('Default:', defaultResponse);
  console.log('Specific:', specificResponse);
}
```

### Configuration Validation

```typescript
function validateConfiguration(): boolean {
  const required = ['AOAI_API_KEY', 'AOAI_ENDPOINT'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return false;
  }
  
  // Validate endpoint format
  const endpoint = process.env.AOAI_ENDPOINT;
  if (!endpoint.startsWith('https://') || !endpoint.includes('.openai.azure.com')) {
    console.error('Invalid AOAI_ENDPOINT format. Expected: https://[resource].openai.azure.com/');
    return false;
  }
  
  return true;
}

async function validatedUsage() {
  if (!validateConfiguration()) {
    process.exit(1);
  }
  
  const aoai = new AOAI();
  const response = await aoai.chat('Hello, AI!');
  console.log(response);
}
```

### Integration with ApiExecutionEngine

```typescript
import { AOAI } from '../ai/AOAI';
import { ApiExecutionEngine } from '../execution/ApiExecutionEngine';

async function integrationExample() {
  // AOAI is typically used within ApiExecutionEngine
  const aoai = new AOAI();
  const engine = new ApiExecutionEngine(aoai, {
    globalAuth: { type: 'none' }
  });
  
  // The engine uses aoai.chat() internally for AI parameter resolution
  // when endpoints have naturalLanguageInput
  
  const endpoint = new ApiEndpoint({
    id: 'example',
    name: 'Example Endpoint',
    method: 'GET',
    baseUrl: 'https://api.example.com',
    path: '/data',
    naturalLanguageInput: 'Get the latest data'
  });
  
  // This will trigger AI parameter resolution using aoai.chat()
  const result = await engine.executeEndpoint(endpoint);
}
```

## Testing Patterns

### Mocking AOAI

```typescript
// Mock for unit testing
const mockAOAI = {
  chat: jest.fn().mockResolvedValue('Mocked AI response')
};

// Test ApiExecutionEngine with mocked AOAI
const engine = new ApiExecutionEngine(mockAOAI as any);

// Verify AI was called with expected parameters
expect(mockAOAI.chat).toHaveBeenCalledWith(expectedPrompt, 'gpt-4.1');
```

### Test Environment Setup

```typescript
// Setup for testing environment
beforeAll(() => {
  process.env.AOAI_API_KEY = 'test-key';
  process.env.AOAI_ENDPOINT = 'https://test-resource.openai.azure.com/';
  process.env.AOAI_DEPLOYMENT = 'test-deployment';
});

afterAll(() => {
  delete process.env.AOAI_API_KEY;
  delete process.env.AOAI_ENDPOINT;
  delete process.env.AOAI_DEPLOYMENT;
});
```

### Integration Testing

```typescript
describe('AOAI Integration', () => {
  it('should handle real API calls', async () => {
    // Skip if not configured for integration tests
    if (!process.env.AOAI_API_KEY) {
      console.warn('Skipping integration test - AOAI not configured');
      return;
    }
    
    const aoai = new AOAI();
    const response = await aoai.chat('Say "test successful"');
    
    expect(response).toContain('test successful');
    expect(response.length).toBeGreaterThan(0);
    expect(response.length).toBeLessThanOrEqual(500); // Rough token limit check
  }, 10000); // 10s timeout for AI calls
});
```

## Configuration Best Practices

### Environment Setup

#### Development

```bash
export AOAI_API_KEY="your-dev-api-key"
export AOAI_ENDPOINT="https://your-dev-resource.openai.azure.com/"
export AOAI_DEPLOYMENT="gpt-4-dev"
export AOAI_API_VERSION="2024-10-21"
```

#### Production

```bash
# Use secure credential management
export AOAI_API_KEY="$(vault kv get -field=api_key secret/azure-openai)"
export AOAI_ENDPOINT="https://prod-openai-resource.openai.azure.com/"
export AOAI_DEPLOYMENT="gpt-4-prod"
```

#### Docker

```dockerfile
ENV AOAI_ENDPOINT=https://your-resource.openai.azure.com/
ENV AOAI_DEPLOYMENT=gpt-4.1
ENV AOAI_API_VERSION=2024-10-21
# API key should be passed at runtime, not baked into image
```

### Security Considerations

1. **API Key Protection**
   - Never hardcode API keys in source code
   - Use environment variables or secure credential stores
   - Rotate keys regularly

2. **Endpoint Validation**
   - Validate endpoint URLs to prevent injection
   - Use HTTPS endpoints only
   - Verify Azure OpenAI domain

3. **Error Handling**
   - Don't expose API keys in error messages
   - Log errors without sensitive information
   - Handle rate limiting gracefully

### Performance Optimization

1. **Connection Reuse**
   - AOAI instances reuse the underlying HTTP client
   - Create one AOAI instance per application, not per request

2. **Token Management**
   - Be aware of the 128 token limit
   - Consider response length when crafting prompts
   - Monitor token usage for cost optimization

3. **Error Recovery**
   - Implement retry logic for transient failures
   - Handle rate limiting with exponential backoff
   - Cache responses when appropriate

## Known Limitations

1. **Fixed Token Limit**: `max_tokens: 128` cannot be configured
2. **Single Message Format**: Only supports single user messages, not conversation history
3. **No Streaming Control**: Streaming is always enabled, no option for non-streaming
4. **Limited Configuration**: Deployment and API version are set at construction time
5. **No Response Metadata**: Only returns the text content, not tokens used, model info, etc.

## Troubleshooting

### Common Errors

**"AOAI_API_KEY and AOAI_ENDPOINT must be set"**

- Verify environment variables are set correctly
- Check for typos in environment variable names
- Ensure variables are available in the runtime environment

**Authentication Errors**

- Verify API key is valid and not expired
- Check that the key has access to the specified deployment
- Ensure endpoint URL matches the resource in Azure

**Rate Limiting**

- Implement retry logic with exponential backoff
- Monitor usage against Azure OpenAI quotas
- Consider using different deployments for different use cases

### Debugging

```typescript
// Enable debug logging
process.env.DEBUG = 'azure:*';

// Log configuration (without exposing secrets)
console.log('AOAI Configuration:');
console.log('- Endpoint:', process.env.AOAI_ENDPOINT);
console.log('- Deployment:', process.env.AOAI_DEPLOYMENT || 'gpt-4.1');
console.log('- API Version:', process.env.AOAI_API_VERSION || '2024-10-21');
console.log('- API Key Length:', process.env.AOAI_API_KEY?.length || 0);
```

## Migration Guide

### From OpenAI to Azure OpenAI

If migrating from OpenAI's API:

1. **Environment Variables**: Update from `OPENAI_API_KEY` to `AOAI_API_KEY`
2. **Endpoint Format**: Use Azure-specific endpoint format
3. **Deployment Names**: Use your Azure deployment names instead of model names
4. **Authentication**: Azure OpenAI uses API keys differently than OpenAI

### Upgrading API Versions

When upgrading `AOAI_API_VERSION`:

1. **Test Compatibility**: Verify your deployment supports the new API version
2. **Review Changes**: Check Azure OpenAI API changelog for breaking changes
3. **Gradual Rollout**: Test with development environments first
4. **Monitoring**: Watch for errors after upgrading
