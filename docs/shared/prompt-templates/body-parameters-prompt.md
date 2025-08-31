# body-parameters-prompt.hbs

Template to instruct the model to produce a JSON request body based on user input, a body schema, and available connection data.

## Purpose

- Build a valid request body JSON that matches a provided schema.
- Incorporate values from natural language and prior endpoint responses.

## Inputs (Template Variables)

- `httpMethod`: HTTP method (e.g., POST, PUT). Used to provide context.
- `bodySchema`: JSON of the expected body structure (fields and types).
- `connectionContextSummary`: A human-readable summary of available connected endpoint data.
- `hasConnections`: Boolean flag indicating whether `connectionData` exists.
- `connectionData[]`: Array of available response snippets from prior endpoints.
  - `sourceEndpoint`: ID/name of the source endpoint.
  - `mapping`: Natural language mapping description.
  - `responseData`: Stringified preview JSON of the source response data.
- `naturalLanguageInput`: The user's input describing intent.

## Structure

- Role and task description
- Critical instruction to output ONLY JSON
- HTTP method and Body Schema blocks
- Connection context (summary and optional details list)
- User input block
- Step-by-step instructions to respect schema and types
- Context section repeating available response data when present

## Output Contract

- The model MUST return ONLY a JSON object (no markdown, no prose).
- Field names must exactly match the provided schema.
- Required fields must be filled; optional fields omitted if not provided.

## Usage Notes

- Always pass an accurate `bodySchema` with expected types.
- Use `connectionData` to surface relevant prior responses (truncated for brevity).
- Validate the resulting JSON against your schema before sending the request.
