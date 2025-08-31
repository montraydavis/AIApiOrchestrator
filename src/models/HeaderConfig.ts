/**
 * Represents a mapping of HTTP header names to their corresponding values.
 *
 * @property [key: string] - The name of the HTTP header.
 * @value string - The value of the HTTP header.
 */
export interface HeaderConfig {
    /** The name of the HTTP header. */
    [key: string]: string;
}
