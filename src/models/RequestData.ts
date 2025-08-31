import { HttpMethod } from "./HttpMethod";

/**
 * Represents the data required to make an HTTP request.
 *
 * @property url - The endpoint URL for the request.
 * @property method - The HTTP method to use (e.g., GET, POST).
 * @property headers - A mapping of HTTP header names to their values.
 * @property queryParams - A mapping of query parameter names to their values.
 * @property body - (Optional) The request body, if applicable.
 */
export interface RequestData {
    /** The endpoint URL for the request. */
    url: string;
    /** The HTTP method to use (e.g., GET, POST). */
    method: HttpMethod;
    /** A mapping of HTTP header names to their values. */
    headers: Record<string, string>;
    /** A mapping of query parameter names to their values. */
    queryParams: Record<string, any>;
    /** The request body, if applicable. */
    body?: any;
}
