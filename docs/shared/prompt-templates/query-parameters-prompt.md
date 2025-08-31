# query-parameters-prompt.hbs

Template to instruct the model to extract query parameter values as JSON, guided by a schema and optional connected endpoint data.

## Purpose

- Produce a JSON object of query parameter values using natural language input and prior responses.

## Inputs (Template Variables)

- `queryParamsSchema`: JSON schema of expected query parameters.
- `connectionContextSummary`: Summary of connected endpoint data.
- `hasConnections`: Boolean flag; controls whether details are displayed.
- `connectionData[]`: Array of prior response snippets with fields:
  - `sourceEndpoint`, `mapping`, `responseData`
- `naturalLanguageInput`: The user's NL request.

## Sections

- Role/Task and critical instruction to output ONLY JSON.
- Query parameter schema block.
- Connection context and optional available response data.
- User input block.
- Instructions covering exact names, type conversions (including arrays), referencing connections, and omitting unknowns.
- Valid response format hint.

## Output Contract

- Must return ONLY a JSON object with keys exactly matching the schema.
- Convert values to correct types (string, number, boolean, array).
- Omit parameters that cannot be determined.
