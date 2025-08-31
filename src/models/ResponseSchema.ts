import { ParameterDefinition } from "./ParameterDefinition";
import { HeaderConfig } from "./HeaderConfig";

/**
 * Describes the structure of an HTTP response for an API endpoint.
 *
 * @property statusCode - The HTTP status code returned by the endpoint.
 * @property headers - (Optional) The headers returned in the response.
 * @property body - (Optional) The structure of the response body, defined as a mapping of property names to their definitions.
 * @property schema - (Optional) A JSON schema object for validating the response body.
 */
export interface ResponseSchema {
    /** The HTTP status code returned by the endpoint. */
    statusCode: number;
    /** The headers returned in the response. */
    headers?: HeaderConfig;
    /** The structure of the response body, as a mapping of property names to their definitions. */
    body?: Record<string, ParameterDefinition>;
    /** A JSON schema object for validating the response body. */
    schema?: any; // JSON schema for validation
}
