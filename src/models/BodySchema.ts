import { ParameterDefinition } from "./ParameterDefinition";

/**
 * Describes the schema for the request body of an API endpoint.
 *
 * @property type - The type of body content. Can be 'json', 'form', 'text', or 'binary'.
 * @property schema - (Optional) The structure of the body if type is 'json' or 'form', as a map of property names to parameter definitions.
 * @property content - (Optional) Static content to use as the body. Can be any type, such as a string, object, or Buffer.
 */
export interface BodySchema {
    type: 'json' | 'form' | 'text' | 'binary';
    schema?: Record<string, ParameterDefinition>;
    content?: any; // Static content
}
