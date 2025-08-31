import { SchemaProperty, TransformFunction } from "./SchemaProperty";
import { EndpointConnection } from "./EndpointConnection";
import { ParameterType } from "./ParameterType";

/**
 * Builder class for defining a connection between two schema properties,
 * including optional mapping and transformation logic.
 *
 * @typeParam TSource - The type of the source schema property.
 * @typeParam TTarget - The type of the target schema property.
 */
export class ConnectionBuilder<TSource, TTarget> {
  /**
   * The source schema property for the connection.
   */
  private source: SchemaProperty<TSource>;

  /**
   * The target schema property for the connection.
   */
  private target: SchemaProperty<TTarget>;

  /**
   * An optional natural language mapping or description for the connection.
   */
  private mapping?: string;

  /**
   * An optional transformation function to apply to the source value before assigning to the target.
   */
  private transformation?: TransformFunction<TSource, TTarget>;

  /**
   * Creates a new ConnectionBuilder instance to define a connection between two schema properties.
   * @param source - The source schema property.
   * @param target - The target schema property.
   * @param mapping - (Optional) A natural language mapping or description for the connection.
   */
  constructor(
    source: SchemaProperty<TSource>,
    target: SchemaProperty<TTarget>,
    mapping?: string
  ) {
    this.source = source;
    this.target = target;
    this.mapping = mapping ?? '';
    this.validateCompatibility();
  }

  /**
   * Specifies a transformation function to apply to the source value before assigning to the target.
   * @param transform - The transformation function.
   * @returns The ConnectionBuilder instance for chaining.
   */
  withTransform(transform: TransformFunction<TSource, TTarget>): ConnectionBuilder<TSource, TTarget> {
    this.transformation = transform;
    return this;
  }

  /**
   * Sets a natural language mapping or description for the connection.
   * @param mapping - The mapping string.
   * @returns The ConnectionBuilder instance for chaining.
   */
  withMapping(mapping: string): ConnectionBuilder<TSource, TTarget> {
    this.mapping = mapping;
    return this;
  }

  /**
   * Builds and returns the EndpointConnection object representing this connection.
   * @returns The constructed EndpointConnection.
   */
  build(): EndpointConnection {
    return {
      id: this.generateConnectionId(),
      sourceNodeId: this.source.endpoint.id,
      targetNodeId: this.target.endpoint.id,
      sourceField: this.getSourceField(),
      targetField: this.target.name,
      targetLocation: this.target.location as 'query' | 'body' | 'header' | 'path',
      naturalLanguageMapping: this.mapping ?? this.generateDefaultMapping(),
      transform: this.transformation?.name ?? '',
      // Add type information for runtime validation
      sourceType: this.source.type,
      targetType: this.target.type
    };
  }

  /**
   * Validates the compatibility of the source and target schema properties.
   * Throws an error if types are incompatible or if path parameter requirements are not met.
   * Logs a warning if connecting an optional source to a required target without a transformation.
   * @private
   */
  private validateCompatibility(): void {
    // Type compatibility checks
    if (!this.areTypesCompatible(this.source.type, this.target.type)) {
      throw new Error(`Incompatible types: ${this.source.type} -> ${this.target.type}`);
    }

    // Required field validation
    if (this.target.required && !this.source.required && !this.transformation) {
      console.warn(`Connecting optional source to required target: ${this.source.name} -> ${this.target.name}`);
    }

    // Location validation
    if (this.target.location === 'path' && this.source.type !== 'string' && this.source.type !== 'number') {
      throw new Error(`Path parameters must be string or number type, got: ${this.source.type}`);
    }
  }

  /**
   * Determines if the source and target parameter types are compatible for connection.
   * Allows for certain type conversions (e.g., string to number, string to boolean).
   * @param sourceType - The type of the source parameter.
   * @param targetType - The type of the target parameter.
   * @returns True if the types are compatible, false otherwise.
   * @private
   */
  private areTypesCompatible(sourceType: ParameterType, targetType: ParameterType): boolean {
    // Exact match
    if (sourceType === targetType) return true;

    // String can accept any type (will be converted)
    if (targetType === 'string') return true;

    // Number can accept string if it's convertible
    if (targetType === 'number' && sourceType === 'string') return true;

    // Boolean can accept string for 'true'/'false' values
    if (targetType === 'boolean' && sourceType === 'string') return true;

    return false;
  }

  /**
   * Generates a unique connection ID based on the source and target endpoint IDs and the current timestamp.
   * @returns The generated connection ID string.
   * @private
   */
  private generateConnectionId(): string {
    return `${this.source.endpoint.id}_${this.target.endpoint.id}_${Date.now()}`;
  }

  /**
   * Gets the source field name for the connection.
   * If the source has a jsonPath property, it is used; otherwise, the source name is returned.
   * @returns The source field name or JSON path.
   * @private
   */
  private getSourceField(): string {
    if ('jsonPath' in this.source && typeof (this.source as any).jsonPath === 'string') {
      return (this.source as any).jsonPath;
    }
    return this.source.name;
  }

  /**
   * Generates a default natural language mapping string for the connection.
   * @returns The generated mapping string.
   * @private
   */
  private generateDefaultMapping(): string {
    return `Use ${this.source.name} from ${this.source.endpoint.name} as ${this.target.name}`;
  }
}
