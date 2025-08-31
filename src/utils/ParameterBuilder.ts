import { ParameterDefinition } from "../models/ParameterDefinition";
import { ParameterType } from "../models/ParameterType";

/**
 * Builder class for constructing a {@link ParameterDefinition} with a fluent API.
 */
export class ParameterBuilder {
  private definition: ParameterDefinition;

  /**
   * Creates a new ParameterBuilder instance.
   * @param name - The name of the parameter.
   * @param type - The type of the parameter.
   */
  constructor(name: string, type: ParameterType) {
    this.definition = {
      name,
      type,
      required: false
    };
  }

  /**
   * Sets whether the parameter is required.
   * @param required - Whether the parameter is required (default: true).
   * @returns The ParameterBuilder instance for chaining.
   */
  required(required: boolean = true): ParameterBuilder {
    this.definition.required = required;
    return this;
  }

  /**
   * Sets the description for the parameter.
   * @param description - The description of the parameter.
   * @returns The ParameterBuilder instance for chaining.
   */
  description(description: string): ParameterBuilder {
    this.definition.description = description;
    return this;
  }

  /**
   * Sets the default value for the parameter.
   * @param value - The default value to assign.
   * @returns The ParameterBuilder instance for chaining.
   */
  defaultValue(value: any): ParameterBuilder {
    this.definition.defaultValue = value;
    return this;
  }

  /**
   * Sets example values for the parameter.
   * @param examples - One or more example values for the parameter.
   * @returns The ParameterBuilder instance for chaining.
   */
  examples(...examples: any[]): ParameterBuilder {
    this.definition.examples = examples;
    return this;
  }

  /**
   * Sets the minimum value for the parameter (for numbers or array length).
   * @param min - The minimum value allowed.
   * @returns The ParameterBuilder instance for chaining.
   */
  min(min: number): ParameterBuilder {
    if (!this.definition.validation) this.definition.validation = {};
    this.definition.validation.min = min;
    return this;
  }

  /**
   * Sets the maximum value for the parameter (for numbers or array length).
   * @param max - The maximum value allowed.
   * @returns The ParameterBuilder instance for chaining.
   */
  max(max: number): ParameterBuilder {
    if (!this.definition.validation) this.definition.validation = {};
    this.definition.validation.max = max;
    return this;
  }

  /**
   * Sets a regular expression pattern that the parameter value must match (for strings).
   * @param pattern - The regex pattern as a string.
   * @returns The ParameterBuilder instance for chaining.
   */
  pattern(pattern: string): ParameterBuilder {
    if (!this.definition.validation) this.definition.validation = {};
    this.definition.validation.pattern = pattern;
    return this;
  }

  /**
   * Restricts the parameter value to a set of allowed values (enumeration).
   * @param values - The allowed values for the parameter.
   * @returns The ParameterBuilder instance for chaining.
   */
  enum(...values: any[]): ParameterBuilder {
    if (!this.definition.validation) this.definition.validation = {};
    this.definition.validation.enum = values;
    return this;
  }

  /**
   * Defines the item schema for array type parameters.
   * @param itemDefinition - The definition of the items contained in the array.
   * @returns The ParameterBuilder instance for chaining.
   * @throws Error if the parameter type is not 'array'.
   */
   items(itemDefinition: ParameterDefinition): ParameterBuilder {
    if (this.definition.type !== 'array') {
      throw new Error('Items can only be defined for array type parameters');
    }
    this.definition.items = itemDefinition;
    return this;
  }

  /**
   * Defines the properties for object type parameters.
   * @param properties - A record mapping property names to their parameter definitions.
   * @returns The ParameterBuilder instance for chaining.
   * @throws Error if the parameter type is not 'object'.
   */
  properties(properties: Record<string, ParameterDefinition>): ParameterBuilder {
    if (this.definition.type !== 'object') {
      throw new Error('Properties can only be defined for object type parameters');
    }
    this.definition.properties = properties;
    return this;
  }

  /**
   * Builds and returns the parameter definition object.
   * @returns The constructed ParameterDefinition.
   */
  build(): ParameterDefinition {
    return { ...this.definition };
  }
}
