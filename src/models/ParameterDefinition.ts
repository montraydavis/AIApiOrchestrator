import { ParameterType } from "./ParameterType";

/**
 * Defines a parameter for an API endpoint, including type, validation, and documentation metadata.
 *
 * @property name - The name of the parameter.
 * @property type - The data type of the parameter.
 * @property required - Whether the parameter is required.
 * @property defaultValue - (Optional) The default value for the parameter.
 * @property description - (Optional) A human-readable description of the parameter.
 * @property items - (Optional) Definition of the item type if the parameter is an array.
 * @property properties - (Optional) Definitions of nested properties if the parameter is an object.
 * @property aiMapped - (Optional) Indicates if this parameter was generated or mapped by AI.
 * @property examples - (Optional) Example values for documentation or testing.
 * @property validation - (Optional) Validation rules for the parameter.
 *   @property validation.min - (Optional) Minimum value (for numbers).
 *   @property validation.max - (Optional) Maximum value (for numbers).
 *   @property validation.pattern - (Optional) Regex pattern the value must match (for strings).
 *   @property validation.enum - (Optional) List of allowed values.
 */
export interface ParameterDefinition {
  /** The name of the parameter. */
  name: string;
  /** The data type of the parameter. */
  type: ParameterType;
  /** Whether the parameter is required. */
  required: boolean;
  /** The default value for the parameter. */
  defaultValue?: any;
  /** A human-readable description of the parameter. */
  description?: string;
  /** Definition of the item type if the parameter is an array. */
  items?: ParameterDefinition;
  /** Definitions of nested properties if the parameter is an object. */
  properties?: Record<string, ParameterDefinition>;
  /** Indicates if this parameter was generated or mapped by AI. */
  aiMapped?: boolean;
  /** Example values for documentation or testing. */
  examples?: any[];
  /**
   * Validation rules for the parameter.
   * @property min - Minimum value (for numbers).
   * @property max - Maximum value (for numbers).
   * @property pattern - Regex pattern the value must match (for strings).
   * @property enum - List of allowed values.
   */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}
