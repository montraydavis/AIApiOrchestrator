import { HttpMethod } from "./HttpMethod";
import { BodySchema } from "./BodySchema";
import { ParameterDefinition } from "./ParameterDefinition";
import { EndpointConnection } from "./EndpointConnection";
import { NaturalLanguageMapping } from "./NaturalLanguageMapping";
import { ResponseSchema } from "./ResponseSchema";
import { HeaderConfig } from "./HeaderConfig";
import { AuthConfig } from "./AuthConfig";
import { PathProperty, QueryProperty, BodyProperty, ResponseProperty, SchemaProperty } from "./SchemaProperty";
import { ConnectionBuilder } from "./ConnectionBuilder";
import { TransformedProperty } from "./TransformedProperty";
import { ParameterType } from "./ParameterType";

/**
 * Represents an API endpoint definition, including HTTP method, URL, parameters, authentication, 
 * expected responses, AI mapping, and other configuration options.
 */
export class ApiEndpoint {
    /**
     * Unique identifier for the endpoint.
     */
    public id: string;

    /**
     * Human-readable name for the endpoint.
     */
    public name: string;

    /**
     * Optional description of the endpoint.
     */
    public description: string | undefined;

    /**
     * HTTP method (GET, POST, etc.) for the endpoint.
     */
    public method: HttpMethod;

    /**
     * Base URL for the API (e.g., https://api.example.com).
     */
    public baseUrl: string;

    /**
     * Path for the endpoint (e.g., /users/{id}).
     */
    public path: string;

    /**
     * Query parameters accepted by the endpoint.
     */
    public queryParams: Record<string, ParameterDefinition>;

    /**
     * Path parameters accepted by the endpoint.
     */
    public pathParams: Record<string, ParameterDefinition>;

    /**
     * HTTP headers to be sent with the request.
     */
    public headers: HeaderConfig;

    /**
     * Body schema definition for the endpoint (if applicable).
     */
    public body: BodySchema | undefined;

    /**
     * Per-endpoint authentication configuration.
     */
    public auth: AuthConfig | undefined;

    /**
     * List of expected response schemas for the endpoint.
     */
    public expectedResponse: ResponseSchema[];

    /**
     * Optional natural language input describing the endpoint's purpose or usage.
     */
    public naturalLanguageInput: string | undefined;

    /**
     * Optional AI mapping for natural language to parameter resolution.
     */
    public aiMapping: NaturalLanguageMapping | undefined;

    /**
     * List of connections to other endpoints (for data flow or chaining).
     */
    public connections: EndpointConnection[];

    /**
     * Timeout for the endpoint request in milliseconds.
     */
    public timeout: number;

    /**
     * Number of retries for the endpoint request.
     */
    public retries: number;

    /**
     * Timestamp when the endpoint was created.
     */
    public createdAt: Date;

    /**
     * Timestamp when the endpoint was last updated.
     */
    public updatedAt: Date;

    /**
     * Constructs a new ApiEndpoint instance.
     * 
     * @param config - Partial configuration object for the endpoint. Must include id, name, method, baseUrl, and path.
     */
    constructor(config: Partial<ApiEndpoint> & { id: string; name: string; method: HttpMethod; baseUrl: string; path: string; }) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description;
        this.method = config.method;
        this.baseUrl = config.baseUrl;
        this.path = config.path;
        this.queryParams = config.queryParams || {};
        this.pathParams = config.pathParams || {};
        this.headers = config.headers || {};
        this.body = config.body;
        this.auth = config.auth;
        this.expectedResponse = config.expectedResponse || [];
        this.naturalLanguageInput = config.naturalLanguageInput;
        this.aiMapping = config.aiMapping;
        this.connections = config.connections || [];
        this.timeout = config.timeout || 30000;
        this.retries = config.retries || 0;
        this.createdAt = config.createdAt || new Date();
        this.updatedAt = config.updatedAt || new Date();
    }

    /**
     * Returns the full URL for the endpoint, with path parameters resolved.
     *
     * @param pathValues - An optional object mapping path parameter names to their values.
     * @returns The full URL with path parameters replaced by their encoded values.
     */
    public getFullUrl(pathValues?: Record<string, any>): string {
        let resolvedPath = this.path;

        if (pathValues) {
            Object.entries(pathValues).forEach(([key, value]) => {
                resolvedPath = resolvedPath.replace(`{${key}}`, encodeURIComponent(value));
            });
        }

        return `${this.baseUrl}${resolvedPath}`;
    }

    /**
     * Checks if the endpoint has AI mapping configured.
     *
     * @returns True if both naturalLanguageInput and aiMapping are set, false otherwise.
     */
    public hasAiMapping(): boolean {
        return !!this.naturalLanguageInput && !!this.aiMapping;
    }

    /**
     * Gets the merged parameters for the endpoint, combining static default values and AI-resolved parameters.
     *
     * @returns An object containing all resolved parameters.
     */
    public getResolvedParams(): Record<string, any> {
        const staticParams: Record<string, any> = {};

        // Extract default values from parameter definitions
        Object.entries(this.queryParams).forEach(([key, param]) => {
            if (param.defaultValue !== undefined) {
                staticParams[key] = param.defaultValue;
            }
        });

        // Merge with AI-resolved parameters
        return {
            ...staticParams,
            ...(this.aiMapping?.resolvedParams || {})
        };
    }

    /**
     * Gets the merged body content for the endpoint, combining static body content and AI-resolved body content.
     *
     * @returns The resolved body content, or null if no body is defined.
     */
    public getResolvedBody(): any {
        if (!this.body) return null;

        return {
            ...(this.body.content || {}),
            ...(this.aiMapping?.resolvedBody || {})
        };
    }

    /**
     * Validates the endpoint configuration, checking for required fields and parameters.
     *
     * @returns An array of error messages, or an empty array if the configuration is valid.
     */
    public validate(): string[] {
        const errors: string[] = [];

        if (!this.baseUrl) {
            errors.push('Base URL is required');
        }

        if (!this.path) {
            errors.push('Path is required');
        }

        // Validate required parameters have values or AI mapping
        Object.entries(this.queryParams).forEach(([key, param]) => {
            if (param.required && !param.defaultValue && !this.aiMapping?.resolvedParams?.[key]) {
                errors.push(`Required query parameter '${key}' has no default value or AI mapping`);
            }
        });

        // Object.entries(this.pathParams).forEach(([key, param]) => {
        //     if (param.required && !param.defaultValue) {
        //         errors.push(`Required path parameter '${key}' has no default value`);
        //     }
        // });

        return errors;
    }

    /**
     * Updates the AI mapping for the endpoint and sets the updatedAt timestamp.
     *
     * @param mapping - A partial NaturalLanguageMapping object to merge with the existing mapping.
     */
    public updateAiMapping(mapping: Partial<NaturalLanguageMapping>): void {
        this.aiMapping = {
            ...this.aiMapping,
            ...mapping,
            lastUpdated: new Date()
        } as NaturalLanguageMapping;
        this.updatedAt = new Date();
    }

    /**
     * Adds a connection to another endpoint.
     *
     * @param connection - The connection object to add (without an id).
     * @returns The newly created EndpointConnection with a generated id.
     */
    public addConnection(connection: Omit<EndpointConnection, 'id'>): EndpointConnection {
        const newConnection: EndpointConnection = {
            ...connection,
            id: `${this.id}_${connection.targetNodeId}_${Date.now()}`
        };

        this.connections.push(newConnection);
        this.updatedAt = new Date();

        return newConnection;
    }

    /**
     * Removes a connection from this endpoint by its ID.
     *
     * @param connectionId - The ID of the connection to remove.
     * @returns True if a connection was removed, false otherwise.
     */
    public removeConnection(connectionId: string): boolean {
        const initialLength = this.connections.length;
        this.connections = this.connections.filter(conn => conn.id !== connectionId);

        if (this.connections.length < initialLength) {
            this.updatedAt = new Date();
            return true;
        }

        return false;
    }

    /**
     * Gets a strongly-typed path parameter property for this endpoint.
     *
     * @typeParam T - The expected type of the path parameter.
     * @param name - The name of the path parameter.
     * @returns A PathProperty object for the specified parameter.
     * @throws Error if the path parameter is not found.
     */
    getPathProperty<T = any>(name: string): PathProperty<T> {
        const param = this.pathParams[name];
        if (!param) {
            throw new Error(`Path parameter '${name}' not found in endpoint ${this.id}`);
        }

        return {
            name,
            type: param.type,
            required: param.required,
            location: 'path',
            schema: param,
            endpoint: this,
            mapTo: <TTarget>(target: SchemaProperty<TTarget>, mapping?: string) =>
                new ConnectionBuilder(this.createSchemaProperty(name, param, 'path'), target, mapping),
            transform: (transformer) => new TransformedProperty(this.createSchemaProperty(name, param, 'path'), transformer),
            validate: (value) => this.validateProperty(param, value)
        } as PathProperty<T>;
    }

    /**
     * Gets a strongly-typed query parameter property for this endpoint.
     *
     * @typeParam T - The expected type of the query parameter.
     * @param name - The name of the query parameter.
     * @returns A QueryProperty object for the specified parameter.
     * @throws Error if the query parameter is not found.
     */
    getQueryProperty<T = any>(name: string): QueryProperty<T> {
        const param = this.queryParams[name];
        if (!param) {
            throw new Error(`Query parameter '${name}' not found in endpoint ${this.id}`);
        }

        return {
            name,
            type: param.type,
            required: param.required,
            location: 'query',
            schema: param,
            endpoint: this,
            mapTo: <TTarget>(target: SchemaProperty<TTarget>, mapping?: string) =>
                new ConnectionBuilder(this.createSchemaProperty(name, param, 'query'), target, mapping),
            transform: (transformer) => new TransformedProperty(this.createSchemaProperty(name, param, 'query'), transformer),
            validate: (value) => this.validateProperty(param, value)
        } as QueryProperty<T>;
    }

    /**
     * Gets a strongly-typed body property for this endpoint using a JSON path.
     *
     * @typeParam T - The expected type of the body property.
     * @param jsonPath - The JSON path to the property within the body schema (e.g., "user.name").
     * @returns A BodyProperty object for the specified property.
     * @throws Error if the body schema is not defined or the property is not found.
     */
    getBodyProperty<T = any>(jsonPath: string): BodyProperty<T> {
        if (!this.body?.schema) {
            throw new Error(`No body schema defined for endpoint ${this.id}`);
        }

        const param = this.resolveBodySchemaPath(jsonPath);
        if (!param) {
            throw new Error(`Body property '${jsonPath}' not found in schema for endpoint ${this.id}`);
        }

        return {
            name: jsonPath,
            type: param.type,
            required: param.required,
            location: 'body',
            jsonPath,
            schema: param,
            endpoint: this,
            mapTo: <TTarget>(target: SchemaProperty<TTarget>, mapping?: string) =>
                new ConnectionBuilder(this.createBodySchemaProperty(jsonPath, param), target, mapping),
            transform: (transformer) => new TransformedProperty(this.createBodySchemaProperty(jsonPath, param), transformer),
            validate: (value) => this.validateProperty(param, value)
        } as BodyProperty<T>;
    }

    /**
     * Gets a strongly-typed response property for this endpoint using a JSON path.
     *
     * @typeParam T - The expected type of the response property.
     * @param jsonPath - The JSON path to the property within the response (e.g., "data.id").
     * @returns A ResponseProperty object for the specified property.
     */
    getResponseProperty<T = any>(jsonPath: string): ResponseProperty<T> {
        // For response properties, we'll use a more flexible approach since we don't have strict response schemas
        const inferredType = this.inferResponsePropertyType(jsonPath);

        return {
            name: jsonPath,
            type: inferredType,
            required: false, // Response properties are generally optional
            location: 'response',
            jsonPath,
            schema: {
                name: jsonPath,
                type: inferredType,
                required: false
            },
            endpoint: this,
            mapTo: <TTarget>(target: SchemaProperty<TTarget>, mapping?: string) =>
                new ConnectionBuilder(this.createResponseSchemaProperty(jsonPath, inferredType), target, mapping),
            transform: (transformer) => new TransformedProperty(this.createResponseSchemaProperty(jsonPath, inferredType), transformer),
            validate: (value) => ({ isValid: true, errors: [], warnings: [] }),
            validateAgainstResponse: (response) => this.validateResponseProperty(jsonPath, response)
        } as ResponseProperty<T>;
    }

    /**
     * Convenience method to get the "id" property from the response.
     *
     * @returns A ResponseProperty object for the "id" property, typed as number or string.
     */
    getIdProperty(): ResponseProperty<number | string> {
        return this.getResponseProperty('id');
    }

    /**
     * Convenience method to get the "token" property from the response.
     *
     * @returns A ResponseProperty object for the "token" property, typed as string.
     */
    getTokenProperty(): ResponseProperty<string> {
        return this.getResponseProperty('token');
    }

    /**
     * Adds a typed connection between two schema properties (source and target) for this endpoint.
     *
     * @typeParam TSource - The type of the source property.
     * @typeParam TTarget - The type of the target property.
     * @param sourceProperty - The source schema property.
     * @param targetProperty - The target schema property.
     * @param mapping - Optional mapping string to define how the source maps to the target.
     * @returns The created EndpointConnection object.
     */
    addTypedConnection<TSource, TTarget>(
        sourceProperty: SchemaProperty<TSource>,
        targetProperty: SchemaProperty<TTarget>,
        mapping?: string
    ): EndpointConnection {
        const connection = sourceProperty.mapTo(targetProperty, mapping).build();
        this.connections.push(connection);
        this.updatedAt = new Date();
        return connection;
    }

    /**
     * Adds multiple connections to this endpoint using an array of ConnectionBuilder instances.
     *
     * @param connectionBuilders - An array of ConnectionBuilder objects to build and add as connections.
     * @returns An array of the created EndpointConnection objects.
     */
    addConnections(connectionBuilders: ConnectionBuilder<any, any>[]): EndpointConnection[] {
        const connections = connectionBuilders.map(builder => builder.build());
        this.connections.push(...connections);
        this.updatedAt = new Date();
        return connections;
    }

    /**
     * Creates a strongly-typed SchemaProperty for a path or query parameter.
     *
     * @param name - The name of the parameter.
     * @param param - The parameter definition.
     * @param location - The location of the parameter ('path' or 'query').
     * @returns A SchemaProperty object representing the parameter.
     */
    private createSchemaProperty(name: string, param: ParameterDefinition, location: 'path' | 'query'): SchemaProperty {
        return {
            name,
            type: param.type,
            required: param.required,
            location,
            schema: param,
            endpoint: this,
            mapTo: () => { throw new Error('mapTo not implemented for helper property'); },
            transform: () => { throw new Error('transform not implemented for helper property'); },
            validate: (value) => this.validateProperty(param, value)
        };
    }

    /**
     * Creates a strongly-typed SchemaProperty for a body parameter using a JSON path.
     *
     * @param jsonPath - The JSON path to the property within the body.
     * @param param - The parameter definition.
     * @returns A SchemaProperty object representing the body property.
     */
    private createBodySchemaProperty(jsonPath: string, param: ParameterDefinition): SchemaProperty {
        return {
            name: jsonPath,
            type: param.type,
            required: param.required,
            location: 'body',
            schema: param,
            endpoint: this,
            mapTo: () => { throw new Error('mapTo not implemented for helper property'); },
            transform: () => { throw new Error('transform not implemented for helper property'); },
            validate: (value) => this.validateProperty(param, value)
        };
    }

    /**
     * Creates a strongly-typed SchemaProperty for a response property using a JSON path and type.
     *
     * @param jsonPath - The JSON path to the property within the response.
     * @param type - The type of the response property.
     * @returns A SchemaProperty object representing the response property.
     */
    private createResponseSchemaProperty(jsonPath: string, type: ParameterType): SchemaProperty {
        return {
            name: jsonPath,
            type,
            required: false,
            location: 'response',
            schema: { name: jsonPath, type, required: false },
            endpoint: this,
            mapTo: () => { throw new Error('mapTo not implemented for helper property'); },
            transform: () => { throw new Error('transform not implemented for helper property'); },
            validate: () => ({ isValid: true, errors: [], warnings: [] })
        };
    }

    /**
     * Resolves a body schema property definition by traversing the schema using a JSON path.
     *
     * @param jsonPath - The JSON path to the property within the body schema (e.g., "user.address.street").
     * @returns The ParameterDefinition for the property if found, or null if not found.
     */
    private resolveBodySchemaPath(jsonPath: string): ParameterDefinition | null {
        const pathParts = jsonPath.split('.');
        let currentSchema: any = this.body?.schema;

        for (const part of pathParts) {
            if (currentSchema?.[part]) {
                currentSchema = currentSchema[part];
            } else if (currentSchema?.properties?.[part]) {
                currentSchema = currentSchema.properties[part];
            } else if (currentSchema?.items && !isNaN(parseInt(part))) {
                // Handle array index access
                currentSchema = currentSchema.items;
            } else {
                return null;
            }
        }

        return currentSchema as ParameterDefinition;
    }

    /**
     * Infers the type of a response property based on its JSON path and the expected response schema.
     * If the type cannot be determined from the schema, it uses common naming patterns to guess the type.
     *
     * @param jsonPath - The JSON path to the property within the response (e.g., "user.id").
     * @returns The inferred ParameterType for the property.
     */
    private inferResponsePropertyType(jsonPath: string): ParameterType {
        // Try to infer from expected response schema if available
        if (this.expectedResponse.length > 0) {
            const responseSchema = this.expectedResponse[0];
            if (responseSchema && responseSchema.body) {
                const pathParts = jsonPath.split('.');
                let current: any = responseSchema.body;

                for (const part of pathParts) {
                    if (current?.[part]) {
                        current = current[part];
                    } else {
                        break;
                    }
                }

                if (current?.type) {
                    return current.type;
                }
            }
        }

        // Default inference based on common patterns
        if (jsonPath.includes('id') || jsonPath.includes('Id')) {
            return 'number';
        }
        if (jsonPath.includes('token') || jsonPath.includes('Token')) {
            return 'string';
        }
        if (jsonPath.includes('count') || jsonPath.includes('Count') || jsonPath.includes('length')) {
            return 'number';
        }
        if (jsonPath.includes('is') || jsonPath.includes('has') || jsonPath.includes('enabled')) {
            return 'boolean';
        }
        if (jsonPath.endsWith('[]') || jsonPath.includes('items') || jsonPath.includes('list')) {
            return 'array';
        }

        // Default to string for flexibility
        return 'string';
    }

    /**
     * Validates a value against a given ParameterDefinition.
     *
     * @param param - The parameter definition to validate against.
     * @param value - The value to validate.
     * @returns An object containing isValid, errors, and warnings arrays.
     */
    private validateProperty(param: ParameterDefinition, value: any): { isValid: boolean; errors: string[]; warnings: string[] } {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Type validation
        if (!this.isValidType(value, param.type)) {
            errors.push(`Value ${value} is not of type ${param.type}`);
        }

        // Required validation
        if (param.required && (value === null || value === undefined || value === '')) {
            errors.push(`Required parameter ${param.name} is missing or empty`);
        }

        // Additional validations based on parameter definition
        if (param.validation) {
            if (param.validation.min !== undefined && typeof value === 'number' && value < param.validation.min) {
                errors.push(`Value ${value} is less than minimum ${param.validation.min}`);
            }
            if (param.validation.max !== undefined && typeof value === 'number' && value > param.validation.max) {
                errors.push(`Value ${value} is greater than maximum ${param.validation.max}`);
            }
            if (param.validation.pattern && typeof value === 'string' && !new RegExp(param.validation.pattern).test(value)) {
                errors.push(`Value ${value} does not match pattern ${param.validation.pattern}`);
            }
            if (param.validation.enum && !param.validation.enum.includes(value)) {
                errors.push(`Value ${value} is not in allowed values: ${param.validation.enum.join(', ')}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Checks if a value matches the expected ParameterType.
     *
     * @param value - The value to check.
     * @param expectedType - The expected ParameterType.
     * @returns True if the value matches the expected type, false otherwise.
     */
    private isValidType(value: any, expectedType: ParameterType): boolean {
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
     * Validates that a property exists in the response object at the given JSON path.
     *
     * @param jsonPath - The JSON path to the property within the response (e.g., "user.address.street").
     * @param response - The response object to validate against.
     * @returns An object containing isValid, errors, and warnings arrays.
     */
    private validateResponseProperty(jsonPath: string, response: any): { isValid: boolean; errors: string[]; warnings: string[] } {
        const pathParts = jsonPath.split('.');
        let current = response;

        for (const part of pathParts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return {
                    isValid: false,
                    errors: [`Property ${jsonPath} not found in response`],
                    warnings: []
                };
            }
        }

        return {
            isValid: true,
            errors: [],
            warnings: current === undefined ? [`Property ${jsonPath} exists but is undefined`] : []
        };
    }
}
