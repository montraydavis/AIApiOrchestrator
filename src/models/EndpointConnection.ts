import { ParameterType } from "./ParameterType";

/**
 * Represents a connection between two API endpoints, mapping data from a source endpoint's response
 * to a target endpoint's parameter. Includes type safety, transformation, and natural language mapping.
 *
 * @property id - Unique identifier for the connection.
 * @property sourceNodeId - The ID of the source endpoint node.
 * @property targetNodeId - The ID of the target endpoint node.
 * @property sourceField - JSON path in the source response (e.g., "data.user.id").
 * @property targetField - Parameter name in the target endpoint.
 * @property targetLocation - The location of the target parameter ('query', 'body', 'header', or 'path').
 * @property naturalLanguageMapping - Human-readable description of the mapping (e.g., "Use the user ID from previous call").
 * @property aiResolvedPath - (Optional) AI-generated JSON path for the source field.
 * @property transform - (Optional) Name of the transformation function to apply to the source value.
 * @property sourceType - (Optional) Type of the source parameter for type safety.
 * @property targetType - (Optional) Type of the target parameter for type safety.
 * @property validated - (Optional) Whether this connection has been validated for type compatibility.
 * @property createdAt - (Optional) Timestamp when the connection was created.
 */
export interface EndpointConnection {
    /** Unique identifier for the connection. */
    id: string;
    /** The ID of the source endpoint node. */
    sourceNodeId: string;
    /** The ID of the target endpoint node. */
    targetNodeId: string;
    /** JSON path in source response (e.g., "data.user.id"). */
    sourceField: string;
    /** Parameter name in target endpoint. */
    targetField: string;
    /** The location of the target parameter ('query', 'body', 'header', or 'path'). */
    targetLocation: 'query' | 'body' | 'header' | 'path';
    /** Human-readable description of the mapping (e.g., "Use the user ID from previous call"). */
    naturalLanguageMapping: string;
    /** (Optional) AI-generated JSON path for the source field. */
    aiResolvedPath?: string;
    /** (Optional) Name of the transformation function to apply to the source value. */
    transform?: string;
    /** (Optional) Type of the source parameter for type safety. */
    sourceType?: ParameterType;
    /** (Optional) Type of the target parameter for type safety. */
    targetType?: ParameterType;
    /** (Optional) Whether this connection has been validated for type compatibility. */
    validated?: boolean;
    /** (Optional) Timestamp when the connection was created. */
    createdAt?: Date;
}
