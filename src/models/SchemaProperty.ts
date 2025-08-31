import { ParameterDefinition } from "./ParameterDefinition";
import { ParameterType } from "./ParameterType";
import { ApiEndpoint } from "./ApiEndpoint";
import { ConnectionBuilder } from "./ConnectionBuilder";
import { TransformedProperty } from "./TransformedProperty";

/**
 * Represents the result of validating a value against a schema property.
 * @property isValid - Indicates if the value is valid.
 * @property errors - List of error messages if validation fails.
 * @property warnings - List of warning messages for non-critical issues.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Describes a property in an API schema, including its type, location, and validation logic.
 * @template T - The type of the property value.
 * @property name - The name of the property.
 * @property type - The data type of the property.
 * @property required - Whether the property is required.
 * @property location - The location of the property in the API (query, path, body, header, or response).
 * @property schema - The parameter definition for the property.
 * @property endpoint - The API endpoint this property belongs to.
 * @method mapTo - Maps this property to another property, optionally using a mapping string.
 * @method transform - Transforms the property value using a transformer function.
 * @method validate - Validates a value against this property.
 */
export interface SchemaProperty<T = any> {
  name: string;
  type: ParameterType;
  required: boolean;
  location: 'query' | 'path' | 'body' | 'header' | 'response';
  schema: ParameterDefinition;
  endpoint: ApiEndpoint;
  
  /**
   * Maps this property to a target property, optionally using a mapping string.
   * @param target - The target schema property to map to.
   * @param mapping - (Optional) A string describing the mapping.
   * @returns A ConnectionBuilder for further configuration.
   */
  mapTo<TTarget>(target: SchemaProperty<TTarget>, mapping?: string): ConnectionBuilder<T, TTarget>;

  /**
   * Transforms the property value using a transformer function.
   * @param transformer - The transformation function to apply.
   * @returns A TransformedProperty representing the transformed value.
   */
  transform<TTransformed>(transformer: TransformFunction<T, TTransformed>): TransformedProperty<TTransformed>;

  /**
   * Validates a value against this property.
   * @param value - The value to validate.
   * @returns The result of the validation.
   */
  validate(value: T): ValidationResult;
}

/**
 * Represents a schema property located in the path of an API endpoint.
 * @template T - The type of the property value.
 * @property location - Always 'path'.
 */
export interface PathProperty<T> extends SchemaProperty<T> {
  location: 'path';
}

/**
 * Represents a schema property located in the query string of an API endpoint.
 * @template T - The type of the property value.
 * @property location - Always 'query'.
 */
export interface QueryProperty<T> extends SchemaProperty<T> {
  location: 'query';
}

/**
 * Represents a schema property located in the body of an API endpoint.
 * @template T - The type of the property value.
 * @property location - Always 'body'.
 * @property jsonPath - The JSON path to the property within the body.
 */
export interface BodyProperty<T> extends SchemaProperty<T> {
  location: 'body';
  jsonPath: string; // For nested body properties
}

/**
 * Represents a schema property located in the response of an API endpoint.
 * @template T - The type of the property value.
 * @property location - Always 'response'.
 * @property jsonPath - The JSON path to the property within the response.
 * @method validateAgainstResponse - Validates the property against an actual response.
 */
export interface ResponseProperty<T> extends SchemaProperty<T> {
  location: 'response';
  jsonPath: string;
  
  /**
   * Validates the property against an actual response value.
   * @param response - The response value to validate.
   * @returns The result of the validation.
   */
  validateAgainstResponse(response: any): ValidationResult;
}

/**
 * Describes a transformation function for schema property values.
 * @template TInput - The input type.
 * @template TOutput - The output type after transformation.
 * @property name - The name of the transformation.
 * @property transform - The function that performs the transformation.
 * @property validate - (Optional) A function to validate the input before transformation.
 */
export type TransformFunction<TInput, TOutput> = {
  name: string;
  transform: (input: TInput) => TOutput;
  validate?: (input: TInput) => boolean;
};
