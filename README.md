# API AI Execution [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/montraydavis/AIApiOrchestrator)

AI-assisted API execution engine for defining endpoints, resolving parameters from natural language and prior responses, handling authentication, and executing requests with safe logging utilities.

## Features

- Define rich API endpoints with typed parameters, body schemas, and expected responses
- AI-assisted resolution of path/query/body values from natural language and connected endpoint data
- Typed connections between endpoints with transform and validation
- Pluggable authentication (API key, Bearer token, Basic, custom)
- Safe HTTP response preview/logging utilities
- Structured TypeScript models and utilities with generated docs

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript to dist/
npm run build
```

The build copies prompt templates into `dist/prompt-templates` via the `postbuild` script.

## Configuration

The Azure OpenAI wrapper (`AOAI`) requires environment variables:

- `AOAI_API_KEY`: Azure OpenAI API key (required)
- `AOAI_ENDPOINT`: Azure OpenAI endpoint URL (required)
- `AOAI_DEPLOYMENT`: Deployment name (default: `gpt-4.1`)
- `AOAI_API_VERSION`: API version (default: `2024-10-21`)

Example (macOS/Linux):

```bash
export AOAI_API_KEY="<your-key>"
export AOAI_ENDPOINT="https://<your-resource>.openai.azure.com/"
```

## Quickstart

TypeScript (ts-node):

```ts
import { AOAI } from "./src/ai/AOAI";
import { ApiExecutionEngine } from "./src/execution/ApiExecutionEngine";
import { ApiEndpoint } from "./src/models/ApiEndpoint";

async function main() {
  const aoai = new AOAI();
  const engine = new ApiExecutionEngine(aoai, { globalAuth: { type: 'none' } });

  const endpoint = new ApiEndpoint({
    id: 'getUser',
    name: 'Get User',
    method: 'GET',
    baseUrl: 'https://api.example.com',
    path: '/users/{id}',
    pathParams: { id: { name: 'id', type: 'string', required: true } },
    headers: {},
    expectedResponse: [{ statusCode: 200 }],
    // Optional: natural language to trigger AI resolution
    naturalLanguageInput: 'Fetch user with id 123'
  });

  const result = await engine.executeEndpoint(endpoint, {
    timeout: 15000,
    validateResponse: true
  });

  console.log(result.success, result.statusCode);
}

main();
```

Node (from built dist):

```js
const { AOAI } = require('./dist/ai/AOAI');
const { ApiExecutionEngine } = require('./dist/execution/ApiExecutionEngine');
const { ApiEndpoint } = require('./dist/models/ApiEndpoint');

(async () => {
  const aoai = new AOAI();
  const engine = new ApiExecutionEngine(aoai, { globalAuth: { type: 'none' } });

  const endpoint = new ApiEndpoint({
    id: 'hello', name: 'Hello', method: 'GET',
    baseUrl: 'https://example.com', path: '/', headers: {}, expectedResponse: [{ statusCode: 200 }]
  });

  const result = await engine.executeEndpoint(endpoint);
  console.log(result.statusCode);
})();
```

## Authentication

Register and use built-in handlers automatically via `AuthHandlerRegistry`:

- `apiKey`: Provide `apiKey` and `headerName`
- `bearerToken`: Provide `token`
- `basic`: Provide `username` and `password`
- `custom`: Provide `customHandler(ctx) => Promise<RequestData>`

Per-endpoint auth is set on `ApiEndpoint.auth`. If omitted, `ApiExecutionEngine` falls back to `globalAuth`.

## AI Parameter Resolution

When an endpoint includes `naturalLanguageInput`, the engine:

1. Gathers connection context (previews of prior responses)
2. Renders Handlebars prompt templates (path/query/body)
3. Calls `AOAI.chat` and cleans/parses JSON
4. Validates against schemas via `SchemaValidation`

Prompt templates live in `src/prompt-templates` and are copied to `dist/` on build.

## Logging Utilities

Use `HttpResponseUtils` to preview large responses safely:

```ts
import { HttpResponseUtils } from './src/utils/HttpResponseUtils';

const formatted = HttpResponseUtils.formatForLogging(responseBody, 2);
console.log(formatted);
```

## Documentation

Generated API docs live under `docs/`:

- Execution: `docs/api/execution/ApiExecutionEngine.md`
- AI: `docs/api/ai/AOAI.md`
- Utils: `docs/api/utils/HttpResponseUtils.md`, `docs/api/utils/SchemaValidation.md`, `docs/api/utils/ParameterBuilder.md`
- Models: see `docs/api/models/*`
- Prompt templates: `docs/shared/prompt-templates/*`

Browse the repository for the latest docs and code: [GitHub repo](https://github.com/montraydavis/api-api-execution).

## Build

```bash
npm run build
# Outputs to dist/ and copies prompt templates
```

## Scripts

- `build`: Compile TypeScript to `dist/`
- `postbuild`: Copy prompt templates to `dist/prompt-templates`

## License

MIT. See the repository license on GitHub: [LICENSE](https://github.com/montraydavis/api-api-execution).
