import { ParameterDefinition } from "../models/ParameterDefinition";
import { ParameterType } from "../models/ParameterType";
import { ValidationResult } from "../models/SchemaProperty";
import { ParameterBuilder } from "./ParameterBuilder";

/**
 * Utility class for validating values against parameter definitions and schemas.
 * Provides static methods for validating individual parameters, objects, and arrays,
 * as well as enforcing constraints such as type, required, min/max, pattern, and enum.
 */
export class SchemaValidation {
  /**
   * Validates a value against a parameter definition.
   *
   * @param value - The value to validate.
   * @param definition - The parameter definition to validate against.
   * @returns {ValidationResult} The result of the validation, including errors and warnings.
   */
  static validateParameter(value: any, definition: ParameterDefinition): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required validation
    if (definition.required && this.isEmpty(value)) {
      errors.push(`Required parameter '${definition.name}' is missing or empty`);
      return { isValid: false, errors, warnings };
    }

    // Skip further validation if value is empty and not required
    if (this.isEmpty(value) && !definition.required) {
      return { isValid: true, errors, warnings };
    }

    // Type validation
    if (!this.validateType(value, definition.type)) {
      errors.push(`Parameter '${definition.name}' expected type '${definition.type}' but got '${typeof value}'`);
    }

    // Additional validations
    this.validateConstraints(value, definition, errors, warnings);

    // Nested validation for objects and arrays
    if (definition.type === 'object' && definition.properties) {
      this.validateObject(value, definition.properties, errors, warnings);
    } else if (definition.type === 'array' && definition.items) {
      this.validateArray(value, definition.items, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates multiple parameters at once.
   *
   * @param values - An object mapping parameter names to their values.
   * @param definitions - An object mapping parameter names to their definitions.
   * @returns {ValidationResult} The result of the validation, including errors and warnings.
   */
  static validateParameters(
    values: Record<string, any>, 
    definitions: Record<string, ParameterDefinition>
  ): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Validate each defined parameter
    for (const [name, definition] of Object.entries(definitions)) {
      const result = this.validateParameter(values[name], definition);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    // Check for unexpected parameters
    for (const name of Object.keys(values)) {
      if (!definitions[name]) {
        allWarnings.push(`Unexpected parameter '${name}' provided`);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Checks if a value is considered empty (null, undefined, or empty string).
   *
   * @param value - The value to check.
   * @returns {boolean} True if the value is empty, false otherwise.
   */
  private static isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '';
  }

  /**
   * Validates the type of a value against the expected parameter type.
   *
   * @param value - The value to check.
   * @param expectedType - The expected parameter type.
   * @returns {boolean} True if the value matches the expected type, false otherwise.
   */
  private static validateType(value: any, expectedType: ParameterType): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Validates additional constraints (min, max, pattern, enum) on a value according to its parameter definition.
   *
   * @param value - The value to validate.
   * @param definition - The parameter definition containing validation rules.
   * @param errors - The array to which error messages will be appended.
   * @param warnings - The array to which warning messages will be appended.
   */
  private static validateConstraints(
    value: any, 
    definition: ParameterDefinition, 
    errors: string[], 
    warnings: string[]
  ): void {
    if (!definition.validation) return;

    const { validation } = definition;

    // Numeric constraints
    if (typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        errors.push(`Parameter '${definition.name}' value ${value} is below minimum ${validation.min}`);
      }
      if (validation.max !== undefined && value > validation.max) {
        errors.push(`Parameter '${definition.name}' value ${value} is above maximum ${validation.max}`);
      }
    }

    // String constraints
    if (typeof value === 'string') {
      if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
        errors.push(`Parameter '${definition.name}' value does not match required pattern`);
      }
    }

    // Enum validation
    if (validation.enum && !validation.enum.includes(value)) {
      errors.push(`Parameter '${definition.name}' value '${value}' is not in allowed values: ${validation.enum.join(', ')}`);
    }
  }

  /**
   * Validates an object value against its property definitions.
   *
   * @param value - The object value to validate.
   * @param properties - A record mapping property names to their parameter definitions.
   * @param errors - The array to which error messages will be appended.
   * @param warnings - The array to which warning messages will be appended.
   */
  private static validateObject(
    value: any, 
    properties: Record<string, ParameterDefinition>, 
    errors: string[], 
    warnings: string[]
  ): void {
    if (typeof value !== 'object' || value === null) {
      errors.push('Expected object type for nested validation');
      return;
    }

    for (const [propName, propDef] of Object.entries(properties)) {
      const result = this.validateParameter(value[propName], propDef);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }
  }

  /**
   * Validates an array value against its item definition.
   *
   * @param value - The array value to validate.
   * @param itemDefinition - The parameter definition for each item in the array.
   * @param errors - The array to which error messages will be appended.
   * @param warnings - The array to which warning messages will be appended.
   */
  private static validateArray(
    value: any, 
    itemDefinition: ParameterDefinition, 
    errors: string[], 
    warnings: string[]
  ): void {
    if (!Array.isArray(value)) {
      errors.push('Expected array type for array validation');
      return;
    }

    for (let i = 0; i < value.length; i++) {
      const result = this.validateParameter(value[i], {
        ...itemDefinition,
        name: `${itemDefinition.name}[${i}]`
      });
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }
  }

  /**
   * Creates a parameter definition builder.
   *
   * @param name - The name of the parameter.
   * @param type - The type of the parameter.
   * @returns {ParameterBuilder} A new ParameterBuilder instance.
   */
  static createParameter(name: string, type: ParameterType): ParameterBuilder {
    return new ParameterBuilder(name, type);
  }
}