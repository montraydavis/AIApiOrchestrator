/**
 * HttpResponseUtils
 * 
 * Utility class for processing HTTP response data.
 * 
 * Provides static methods to:
 * - Truncate arrays and objects for preview/logging purposes.
 * - Truncate long strings and deeply nested structures.
 * - Analyze and summarize the structure and size of response data.
 * 
 * Typical use cases include:
 * - Safely logging or displaying large or sensitive HTTP response payloads.
 * - Generating previews of data for debugging or UI display.
 * - Preventing excessive memory usage or log flooding by limiting depth and size.
 * 
 * All methods are static and do not require instantiation.
 */
export class HttpResponseUtils {

  /**
   * Truncates arrays in response data to maximum length of 1 for preview purposes
   * Recursively processes nested objects and arrays while preserving structure
   *
   * @param input - Single object or array to process
   * @param maxArrayLength - Maximum length for arrays (default: 1)
   * @param maxDepth - Maximum recursion depth to prevent stack overflow (default: 10)
   * @param currentDepth - Current recursion depth (internal use)
   * @returns Truncated copy of input data
   */
  public static truncateArrays(
    input: any,
    maxArrayLength: number = 1,
    maxDepth: number = 10,
    currentDepth: number = 0
  ): any {

    // Prevent infinite recursion
    if (currentDepth >= maxDepth) {
      return '[Max depth reached]';
    }

    // Handle null/undefined
    if (input === null || input === undefined) {
      return input;
    }

    // Handle primitive types (string, number, boolean)
    if (this.isPrimitive(input)) {
      return input;
    }

    // Handle Date objects
    if (input instanceof Date) {
      return input;
    }

    // Handle arrays (check root to determine if it's a list)
    if (Array.isArray(input)) {
      const truncatedArray = input.slice(0, maxArrayLength);
      const processedArray = truncatedArray.map(item => this.truncateArrays(item, maxArrayLength, maxDepth, currentDepth + 1)
      );

      // Add metadata if array was truncated
      if (input.length > maxArrayLength) {
        return {
          ...processedArray,
          _truncated: true,
          _originalLength: input.length,
          _showing: maxArrayLength
        };
      }

      return processedArray;
    }

    // Handle objects
    if (typeof input === 'object' && input.constructor === Object) {
      const processedObject: any = {};

      for (const [key, value] of Object.entries(input)) {
        processedObject[key] = this.truncateArrays(
          value,
          maxArrayLength,
          maxDepth,
          currentDepth + 1
        );
      }

      return processedObject;
    }

    // Handle other object types (classes, etc.)
    if (typeof input === 'object') {
      try {
        // Try to process as generic object
        const processedObject: any = {};

        for (const key in input) {
          if (input.hasOwnProperty(key)) {
            processedObject[key] = this.truncateArrays(
              input[key],
              maxArrayLength,
              maxDepth,
              currentDepth + 1
            );
          }
        }

        return processedObject;
      } catch (error) {
        // Return string representation if processing fails
        return `[Object: ${input.constructor?.name || 'Unknown'}]`;
      }
    }

    // Fallback for any other types
    return input;
  }

  /**
   * Creates a preview version of response data suitable for logging
   * Combines array truncation with size limiting
   *
   * @param input - Response data to preview
   * @param options - Preview options
   * @returns Preview object with metadata
   */
  public static createPreview(
    input: any,
    options: {
      maxArrayLength?: number;
      maxStringLength?: number;
      maxDepth?: number;
      includeMetadata?: boolean;
    } = {}
  ): any {
    const {
      maxArrayLength = 1, maxStringLength = 100, maxDepth = 10, includeMetadata = true
    } = options;

    // Get original size info before processing
    const originalInfo = this.getDataInfo(input);

    // Truncate arrays first
    let processed = this.truncateArrays(input, maxArrayLength, maxDepth);

    // Truncate long strings
    processed = this.truncateStrings(processed, maxStringLength, maxDepth);

    // Add metadata if requested
    if (includeMetadata) {
      const processedInfo = this.getDataInfo(processed);

      return {
        data: processed,
        _metadata: {
          original: originalInfo,
          processed: processedInfo,
          truncated: originalInfo.totalSize > processedInfo.totalSize
        }
      };
    }

    return processed;
  }

  /**
   * Truncate long strings in the data structure
   *
   * @param input - Data to process
   * @param maxLength - Maximum string length
   * @param maxDepth - Maximum recursion depth
   * @param currentDepth - Current depth
   * @returns Data with truncated strings
   */
  private static truncateStrings(
    input: any,
    maxLength: number,
    maxDepth: number,
    currentDepth: number = 0
  ): any {

    if (currentDepth >= maxDepth) {
      return '[Max depth reached]';
    }

    if (typeof input === 'string') {
      if (input.length > maxLength) {
        return input.substring(0, maxLength) + `... [+${input.length - maxLength} chars]`;
      }
      return input;
    }

    if (this.isPrimitive(input) || input === null || input === undefined) {
      return input;
    }

    if (Array.isArray(input)) {
      return input.map(item => this.truncateStrings(item, maxLength, maxDepth, currentDepth + 1)
      );
    }

    if (typeof input === 'object') {
      const processed: any = {};

      for (const [key, value] of Object.entries(input)) {
        processed[key] = this.truncateStrings(
          value,
          maxLength,
          maxDepth,
          currentDepth + 1
        );
      }

      return processed;
    }

    return input;
  }

  /**
   * Retrieves information and statistics about the structure of the provided data.
   *
   * @param input - The data to analyze (can be any type).
   * @returns An object containing statistics about the data, including:
   *   - type: Human-readable type string (e.g., "array[3]", "object{2}", "string")
   *   - totalItems: Total number of items in arrays (recursively)
   *   - totalArrays: Total number of arrays encountered (recursively)
   *   - totalObjects: Total number of objects encountered (recursively)
   *   - totalSize: Approximate size in bytes (rough estimate)
   *   - depth: Maximum depth of the data structure
   */
  private static getDataInfo(input: any): {
    type: string;
    totalItems: number;
    totalArrays: number;
    totalObjects: number;
    totalSize: number;
    depth: number;
  } {
    const info = {
      type: this.getDataType(input),
      totalItems: 0,
      totalArrays: 0,
      totalObjects: 0,
      totalSize: 0,
      depth: 0
    };

    this.analyzeData(input, info, 0);

    return info;
  }

  /**
   * Recursively analyzes the structure of the provided data, updating the info object with statistics.
   *
   * @param input - The data to analyze.
   * @param info - The statistics object to update.
   * @param depth - The current recursion depth.
   */
  private static analyzeData(input: any, info: any, depth: number): void {
    info.depth = Math.max(info.depth, depth);
    info.totalSize += this.getDataSize(input);

    if (Array.isArray(input)) {
      info.totalArrays++;
      info.totalItems += input.length;

      input.forEach(item => this.analyzeData(item, info, depth + 1)
      );
    } else if (typeof input === 'object' && input !== null) {
      info.totalObjects++;

      Object.values(input).forEach(value => this.analyzeData(value, info, depth + 1)
      );
    }
  }

  /**
   * Estimates the approximate size in bytes of the provided data.
   *
   * @param input - The data whose size is to be estimated.
   * @returns The estimated size in bytes.
   */
  private static getDataSize(input: any): number {
    if (input === null || input === undefined) return 0;
    if (typeof input === 'string') return input.length * 2; // Rough UTF-16 estimate
    if (typeof input === 'number') return 8;
    if (typeof input === 'boolean') return 4;
    if (Array.isArray(input)) return input.length * 4; // Rough array overhead
    if (typeof input === 'object') return Object.keys(input).length * 4; // Rough object overhead
    return 0;
  }

  /**
   * Returns a human-readable string describing the type and size of the input data.
   *
   * @param input - The data whose type is to be determined.
   * @returns A string describing the type (e.g., "array[3]", "object{2}", "string").
   */
  private static getDataType(input: any): string {
    if (input === null) return 'null';
    if (input === undefined) return 'undefined';
    if (Array.isArray(input)) return `array[${input.length}]`;
    if (typeof input === 'object') return `object{${Object.keys(input).length}}`;
    return typeof input;
  }

  /**
   * Determines if the provided value is a primitive type (string, number, boolean, bigint, symbol, null, or undefined).
   *
   * @param value - The value to check.
   * @returns True if the value is a primitive, false otherwise.
   */
  private static isPrimitive(value: any): boolean {
    return value === null ||
      value === undefined ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint' ||
      typeof value === 'symbol';
  }

  /**
   * Format response data for console logging
   *
   * @param input - Data to format
   * @param maxArrayLength - Maximum array length for preview
   * @returns Formatted string representation
   */
  public static formatForLogging(
    input: any,
    maxArrayLength: number = 1
  ): string {
    const preview = this.createPreview(input, {
      maxArrayLength,
      maxStringLength: 50,
      includeMetadata: true
    });

    const { data, _metadata } = preview;

    let output = JSON.stringify(data, null, 2);

    if (_metadata?.truncated) {
      output += `\n\n📊 Preview Summary:`;
      output += `\n- Original: ${_metadata.original.type}`;
      output += `\n- Arrays: ${_metadata.original.totalArrays}`;
      output += `\n- Objects: ${_metadata.original.totalObjects}`;
      output += `\n- Depth: ${_metadata.original.depth}`;
      output += `\n- Size: ~${_metadata.original.totalSize} bytes`;
    }

    return output;
  }

  /**
   * Utility method to check if response is large and should be truncated
   *
   * @param input - Response data
   * @param thresholds - Size thresholds
   * @returns Boolean indicating if truncation is recommended
   */
  public static shouldTruncate(
    input: any,
    thresholds: {
      maxArrayLength?: number;
      maxObjectKeys?: number;
      maxStringLength?: number;
      maxDepth?: number;
    } = {}
  ): boolean {
    const {
      maxArrayLength = 10, maxObjectKeys = 20, maxStringLength = 1000, maxDepth = 5
    } = thresholds;

    const info = this.getDataInfo(input);

    return info.totalItems > maxArrayLength ||
      info.totalObjects > maxObjectKeys ||
      info.depth > maxDepth ||
      JSON.stringify(input).length > maxStringLength;
  }
}
