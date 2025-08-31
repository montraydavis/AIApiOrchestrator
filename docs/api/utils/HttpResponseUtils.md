# HttpResponseUtils

Utility class for processing HTTP response data. Provides static methods to:

- Truncate arrays and objects for preview/logging
- Truncate long strings and deeply nested structures
- Analyze and summarize the structure and size of response data
- Format data for safe console logging
- Recommend when to truncate large responses

All methods are static and do not require instantiation.

## Public Methods

### `truncateArrays(input: any, maxArrayLength: number = 1, maxDepth: number = 10, currentDepth: number = 0): any`

Truncates arrays in response data to a maximum length for preview purposes and recursively processes nested objects and arrays while preserving structure.

- `input`: Single object or array to process
- `maxArrayLength` (default `1`): Maximum length for arrays
- `maxDepth` (default `10`): Maximum recursion depth
- `currentDepth` (internal): Current recursion depth

Returns a truncated copy of the input. If an array is truncated, the returned value includes metadata keys: `_truncated`, `_originalLength`, `_showing`.

**Special Handling:**

- Preserves Date objects without modification
- Handles primitive types (string, number, boolean, bigint, symbol) directly
- Processes different object types including classes and generic objects
- Prevents infinite recursion with depth limiting
- Adds descriptive labels for objects that can't be processed

### `createPreview(input: any, options?: { maxArrayLength?: number; maxStringLength?: number; maxDepth?: number; includeMetadata?: boolean; }): any`

Creates a preview version of response data suitable for logging. Combines array truncation with size limiting.

- `input`: Response data to preview
- `options.maxArrayLength` (default `1`)
- `options.maxStringLength` (default `100`)
- `options.maxDepth` (default `10`)
- `options.includeMetadata` (default `true`)

Returns either the processed data or, if `includeMetadata` is true, an object `{ data, _metadata }` where `_metadata` contains `original`, `processed`, and `truncated` flags/statistics.

**Metadata Information:**

- Original data statistics (type, size, depth, counts)
- Processed data statistics
- Truncation indicators and size comparisons

### `formatForLogging(input: any, maxArrayLength: number = 1): string`

Formats response data for console logging using `createPreview`, and appends a summary block if truncation occurred.

- `input`: Data to format
- `maxArrayLength` (default `1`): Maximum array length for preview

Returns a formatted string representation with optional summary statistics.

**Summary Includes:**

- Original data type and structure
- Array and object counts
- Maximum depth reached  
- Approximate size in bytes

### `shouldTruncate(input: any, thresholds?: { maxArrayLength?: number; maxObjectKeys?: number; maxStringLength?: number; maxDepth?: number; }): boolean`

Heuristic that checks if a response is large and should be truncated based on size thresholds.

- `input`: Response data
- `thresholds.maxArrayLength` (default `10`)
- `thresholds.maxObjectKeys` (default `20`)
- `thresholds.maxStringLength` (default `1000`)
- `thresholds.maxDepth` (default `5`)

Returns `true` if truncation is recommended based on any threshold being exceeded.

## Private Methods

### `truncateStrings(input: any, maxLength: number, maxDepth: number, currentDepth: number = 0): any`

Recursively truncates long strings in data structures while preserving the overall structure.

- Adds suffix like `... [+N chars]` for truncated strings
- Handles nested objects and arrays recursively
- Respects depth limits to prevent stack overflow

### `getDataInfo(input: any): DataInfo`

Gathers comprehensive statistics about data structure including:

- `type`: Human-readable type string (e.g., "array[3]", "object{2}")
- `totalItems`: Total number of items in arrays (recursive count)
- `totalArrays`: Total number of arrays encountered
- `totalObjects`: Total number of objects encountered  
- `totalSize`: Approximate size in bytes (rough estimate)
- `depth`: Maximum depth of the data structure

### `analyzeData(input: any, info: DataInfo, depth: number): void`

Recursively walks data structure to populate statistics in the info object.

- Updates maximum depth encountered
- Counts arrays, objects, and items
- Accumulates size estimates
- Handles circular references and complex structures

### `getDataSize(input: any): number`

Provides rough size estimates for different data types:

- Strings: `length * 2` (UTF-16 estimate)
- Numbers: `8` bytes
- Booleans: `4` bytes
- Arrays: `length * 4` (overhead estimate)
- Objects: `Object.keys(input).length * 4` (overhead estimate)

### `getDataType(input: any): string`

Returns human-readable type descriptions:

- `"array[N]"` for arrays with length N
- `"object{N}"` for objects with N keys
- Standard typeof results for primitives
- Special handling for null and undefined

### `isPrimitive(value: any): boolean`

Determines if value is a primitive type including:

- `null` and `undefined`
- `string`, `number`, `boolean`
- `bigint` and `symbol`

Used to optimize processing by avoiding recursion on primitive values.

## Error Handling

The utility includes robust error handling for:

- **Malformed Objects**: Returns descriptive labels for objects that can't be processed
- **Circular References**: Prevented by depth limiting
- **Memory Issues**: Size limits and truncation prevent excessive memory usage
- **Type Errors**: Graceful handling of unexpected data types

## Performance Considerations

- **Lazy Processing**: Only processes data up to specified limits
- **Memory Efficient**: Creates new objects only when necessary
- **Depth Limited**: Prevents stack overflow on deeply nested structures
- **Size Aware**: Provides early exit conditions for large datasets

## Usage Examples

### Preview and log a large response

```typescript
import { HttpResponseUtils } from '../utils/HttpResponseUtils';

const preview = HttpResponseUtils.createPreview(hugeResponse, {
  maxArrayLength: 2,
  maxStringLength: 200,
  maxDepth: 6,
  includeMetadata: true
});

console.log(preview);
```

### Safe console formatting

```typescript
import { HttpResponseUtils } from '../utils/HttpResponseUtils';

const formatted = HttpResponseUtils.formatForLogging(hugeResponse, 2);
console.log(formatted);
```

### Decide whether to truncate

```typescript
import { HttpResponseUtils } from '../utils/HttpResponseUtils';

if (HttpResponseUtils.shouldTruncate(response, {
  maxArrayLength: 50,
  maxObjectKeys: 100,
  maxStringLength: 5000,
  maxDepth: 8
})) {
  // Truncate before logging
  const preview = HttpResponseUtils.createPreview(response);
  console.log(preview);
} else {
  console.log(response);
}
```
