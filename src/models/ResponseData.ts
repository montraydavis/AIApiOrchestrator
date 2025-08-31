/**
 * Represents the data returned from an HTTP response.
 *
 * @property headers - A mapping of HTTP header names to their values.
 * @property body - The response body content.
 * @property size - The size of the response in bytes.
 */
export interface ResponseData {
    /** A mapping of HTTP header names to their values. */
    headers: Record<string, string>;
    /** The response body content. */
    body: any;
    /** The size of the response in bytes. */
    size: number;
}