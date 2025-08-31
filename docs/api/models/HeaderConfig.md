# HeaderConfig

Represents a mapping of HTTP header names to their corresponding values.

## Interface: HeaderConfig

A string index signature mapping header names to values.

```typescript
export interface HeaderConfig {
  [key: string]: string;
}
```

## Usage Example

```typescript
import { HeaderConfig } from './HeaderConfig';

const headers: HeaderConfig = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <token>'
};
```
