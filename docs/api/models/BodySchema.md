# BodySchema

Describes the schema for the request body of an API endpoint.

## Interface: BodySchema

| Property   | Type                                  | Description                                                                                                            |
| ---------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `type`     | `'json' | 'form' | 'text' | 'binary'` | The type of body content.                                                                                              |
| `schema?`  | `Record<string, ParameterDefinition>` | (Optional) The structure of the body if type is 'json' or 'form', as a map of property names to parameter definitions. |
| `content?` | `any`                                 | (Optional) Static content to use as the body. Can be any type, such as a string, object, or Buffer.                    |

## Usage Example

```typescript
import { BodySchema } from './BodySchema';
import { ParameterDefinition } from './ParameterDefinition';

const userBodySchema: BodySchema = {
  type: 'json',
  schema: {
    username: { name: 'username', type: 'string', required: true },
    age: { name: 'age', type: 'number', required: false }
  }
};

const staticTextBody: BodySchema = {
  type: 'text',
  content: 'Hello, world!'
};
```
