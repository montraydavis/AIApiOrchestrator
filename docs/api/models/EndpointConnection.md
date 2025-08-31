# EndpointConnection

Represents a connection between two API endpoints, mapping data from a source endpoint's response to a target endpoint's parameter. Includes type safety, transformation, and natural language mapping.

## Interface: EndpointConnection

| Property                 | Type                                   | Description                                                                   |
| ------------------------ | -------------------------------------- | ----------------------------------------------------------------------------- |
| `id`                     | `string`                               | Unique identifier for the connection.                                         |
| `sourceNodeId`           | `string`                               | The ID of the source endpoint node.                                           |
| `targetNodeId`           | `string`                               | The ID of the target endpoint node.                                           |
| `sourceField`            | `string`                               | JSON path in source response (e.g., "data.user.id").                          |
| `targetField`            | `string`                               | Parameter name in target endpoint.                                            |
| `targetLocation`         | `'query' | 'body' | 'header' | 'path'` | The location of the target parameter.                                         |
| `naturalLanguageMapping` | `string`                               | Human-readable description of the mapping.                                    |
| `aiResolvedPath?`        | `string`                               | (Optional) AI-generated JSON path for the source field.                       |
| `transform?`             | `string`                               | (Optional) Name of the transformation function to apply to the source value.  |
| `sourceType?`            | `ParameterType`                        | (Optional) Type of the source parameter for type safety.                      |
| `targetType?`            | `ParameterType`                        | (Optional) Type of the target parameter for type safety.                      |
| `validated?`             | `boolean`                              | (Optional) Whether this connection has been validated for type compatibility. |
| `createdAt?`             | `Date`                                 | (Optional) Timestamp when the connection was created.                         |

## Usage Example

```typescript
import { EndpointConnection } from './EndpointConnection';

const connection: EndpointConnection = {
  id: 'conn-1',
  sourceNodeId: 'endpointA',
  targetNodeId: 'endpointB',
  sourceField: 'data.user.id',
  targetField: 'userId',
  targetLocation: 'query',
  naturalLanguageMapping: 'Use the user ID from previous call',
  transform: 'toString',
  sourceType: 'number',
  targetType: 'string',
  validated: true,
  createdAt: new Date()
};
```
