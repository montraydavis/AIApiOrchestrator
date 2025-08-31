# NaturalLanguageMapping

Represents a mapping from a natural language input to resolved API parameters and body content.

## Interface: NaturalLanguageMapping

| Property          | Type                  | Description                                                         |
| ----------------- | --------------------- | ------------------------------------------------------------------- |
| `input`           | `string`              | Natural language description provided by the user.                  |
| `resolvedParams?` | `Record<string, any>` | (Optional) The query parameters resolved by AI from the input.      |
| `resolvedBody?`   | `any`                 | (Optional) The body content resolved by AI from the input.          |
| `lastUpdated`     | `Date`                | The date and time when this mapping was last updated.               |
| `confidence?`     | `number`              | (Optional) The AI's confidence score for this mapping (range: 0-1). |

## Usage Example

```typescript
import { NaturalLanguageMapping } from './NaturalLanguageMapping';

const mapping: NaturalLanguageMapping = {
  input: 'Create a new user named Alice',
  resolvedParams: { notify: true },
  resolvedBody: { name: 'Alice' },
  lastUpdated: new Date(),
  confidence: 0.92
};
```
