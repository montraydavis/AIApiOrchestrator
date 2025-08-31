import { json } from "stream/consumers";
import { AOAI } from "../ai/AOAI";
import { ApiEndpoint } from "../models/ApiEndpoint";
import { AuthConfig, AuthType } from "../models/AuthConfig";
import { ExecutionContext } from "../models/ExecutionContext";
import { ExecutionOptions } from "../models/ExecutionOptions";
import { ExecutionResult } from "../models/ExecutionResult";
import { HttpMethod } from "../models/HttpMethod";
import { HttpResponseUtils } from "../utils/HttpResponseUtils";
import { ParameterDefinition } from "../models/ParameterDefinition";
import { BodySchema } from "../models/BodySchema";
import { ConnectionBuilder } from "../models/ConnectionBuilder";
import { ParameterType } from "../models/ParameterType";
import { SchemaValidation } from "../utils/SchemaValidation";
import { AuthHandlerRegistry } from '../auth/AuthHandlerRegistry';
import { ApiKeyAuthHandler } from '../auth/ApiKeyAuthHandler';
import { BearerTokenAuthHandler } from '../auth/BearerTokenAuthHandler';
import { BasicAuthHandler } from '../auth/BasicAuthHandler';
import { RequestData } from '../models/RequestData';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

/**
 * Main execution engine class for managing API endpoint execution, authentication, and context.
 *
 * @class ApiExecutionEngine
 * @property {ExecutionContext} context - The execution context holding results and variables.
 * @property {AuthHandlerRegistry} authRegistry - Registry for authentication handlers.
 * @property {AuthConfig | undefined} globalAuth - Optional global authentication configuration.
 * @property {AOAI} aoai - Azure OpenAI API wrapper instance for AI-powered operations.
 */
export class ApiExecutionEngine {
  /**
   * The execution context holding results and variables for API execution.
   * @private
   */
  private context: ExecutionContext;

  /**
   * Registry for authentication handlers.
   * @private
   */
  private authRegistry: AuthHandlerRegistry;

  /**
   * Optional global authentication configuration.
   * @private
   */
  private globalAuth: AuthConfig | undefined;

  /**
   * Azure OpenAI API wrapper instance for AI-powered operations.
   */
  aoai: AOAI;

  /**
   * Creates an instance of ApiExecutionEngine.
   * @param aoai - The AOAI instance for AI-powered operations.
   * @param options - Optional configuration, including a global authentication config.
   */
  constructor(aoai: AOAI, options: { globalAuth?: AuthConfig } = {}) {
    this.context = {
      results: new Map(),
      variables: new Map()
    };
    this.authRegistry = new AuthHandlerRegistry();
    this.globalAuth = options.globalAuth;
    // Register default handlers
    this.authRegistry.register('apiKey', new ApiKeyAuthHandler());
    this.authRegistry.register('bearerToken', new BearerTokenAuthHandler());
    this.authRegistry.register('basic', new BasicAuthHandler());
    this.aoai = aoai;
  }

  /**
   * Executes a single API endpoint, resolving all dependencies, parameters, and authentication.
   * Stores the result in the execution context for downstream use.
   * @param endpoint - The API endpoint to execute.
   * @param options - Optional execution options.
   * @returns The execution result for the endpoint.
   */
  public async executeEndpoint(
    endpoint: ApiEndpoint,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    console.log(`Executing endpoint ${endpoint.name}`);

    const startTime = Date.now();

    try {
      // Validate endpoint configuration
      const validationErrors = endpoint.validate();
      if (validationErrors.length > 0) {
        throw new Error(`Endpoint validation failed: ${validationErrors.join(', ')}`);
      }

      this.validateTypedConnections(endpoint);

      // Resolve all parameters and data dependencies
      const resolvedData = await this.resolveEndpointData(endpoint);

      // Build request configuration
      let requestConfig = await this.buildRequestConfig(endpoint, resolvedData);

      // Determine auth config (endpoint or global)
      const authConfig: AuthConfig | undefined = endpoint.auth || this.globalAuth;
      if (authConfig && authConfig.type !== 'none') {
        const handler = this.authRegistry.getHandler(authConfig.type);
        if (handler) {
          requestConfig = await handler.applyAuth(requestConfig, authConfig, this.context);
        } else if (authConfig.type === 'custom' && authConfig.customHandler) {
          requestConfig = await authConfig.customHandler(this.context);
        }
      }

      // Execute HTTP request with retries
      const response = await this.executeHttpRequest(requestConfig, options);

      if (endpoint.connections.length > 0) {
        console.log(this.formatConnectionDataForLogging(endpoint));
      }

      // Create execution result
      const result: ExecutionResult = {
        endpointId: endpoint.id,
        success: true,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
        requestData: {
          url: requestConfig.url,
          method: requestConfig.method,
          headers: requestConfig.headers,
          queryParams: resolvedData.queryParams,
          body: resolvedData.body
        },
        responseData: {
          headers: response.headers,
          body: response.data,
          size: JSON.stringify(response.data).length
        },
        timestamp: new Date()
      };

      // Store result in context for downstream endpoints
      this.context.results.set(endpoint.id, result);

      // Validate response if requested
      if (options.validateResponse) {
        this.validateResponse(endpoint, result);
      }

      console.log(`Executed endpoint ${endpoint.name}`, result);

      return result;
    } catch (error) {
      const result: ExecutionResult = {
        endpointId: endpoint.id,
        success: false,
        statusCode: 0,
        responseTime: Date.now() - startTime,
        requestData: {
          url: endpoint.getFullUrl(),
          method: endpoint.method,
          headers: {},
          queryParams: {},
        },
        responseData: {
          headers: {},
          body: null,
          size: 0
        },
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      };

      this.context.results.set(endpoint.id, result);
      return result;
    }
  }

  /**
   * Executes multiple API endpoints in dependency order.
   * Stops execution on error unless continueOnError is set to true in options.
   * @param endpoints - The list of API endpoints to execute.
   * @param options - Optional execution options.
   * @returns An array of execution results for each endpoint.
   */
  public async executeFlow(
    endpoints: ApiEndpoint[],
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult[]> {
    // Sort endpoints by dependencies
    const sortedEndpoints = this.sortEndpointsByDependencies(endpoints);
    const results: ExecutionResult[] = [];

    for (const endpoint of sortedEndpoints) {
      const result = await this.executeEndpoint(endpoint, options);
      results.push(result);

      // Stop execution on error if continueOnError is false
      if (!result.success && !options.continueOnError) {
        break;
      }
    }

    return results;
  }

  /**
   * Validates the AI-generated parameter object against the provided schema.
   * Throws an error if validation fails, and logs warnings if present.
   * @param aiResponse - The AI-generated parameter object.
   * @param schema - The parameter schema to validate against.
   * @param contextType - The context type ('path', 'query', or 'body').
   */
  private validateParameterSchema(
    aiResponse: any,
    schema: Record<string, ParameterDefinition>,
    contextType: 'path' | 'query' | 'body'
  ): void {
    // Use enhanced validation
    const result = SchemaValidation.validateParameters(aiResponse, schema);

    if (!result.isValid) {
      throw new Error(
        `AI ${contextType} response validation failed:\n` +
        result.errors.map(error => `  - ${error}`).join('\n') +
        (result.warnings.length > 0 ?
          '\nWarnings:\n' + result.warnings.map(warning => `  - ${warning}`).join('\n') : '')
      );
    }

    // Log warnings if any
    if (result.warnings.length > 0) {
      console.warn(`⚠️ AI ${contextType} response warnings:`);
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  }

  /**
   * Diagnoses and logs issues with endpoint connections, such as missing source endpoints,
   * failed executions, missing fields, or type incompatibilities.
   * @param endpoint - The API endpoint whose connections are to be diagnosed.
   */
  private diagnoseConnectionIssues(endpoint: ApiEndpoint): void {
    const issues: string[] = [];

    for (const connection of endpoint.connections) {
      // Check if source endpoint exists in context
      const sourceResult = this.context.results.get(connection.sourceNodeId);
      if (!sourceResult) {
        issues.push(`Connection '${connection.id}': Source endpoint '${connection.sourceNodeId}' not executed`);
        continue;
      }

      if (!sourceResult.success) {
        issues.push(`Connection '${connection.id}': Source endpoint '${connection.sourceNodeId}' failed`);
        continue;
      }

      // Check if source field exists in response
      const value = this.extractValueFromResult(sourceResult, connection.sourceField);
      if (value === undefined) {
        issues.push(`Connection '${connection.id}': Source field '${connection.sourceField}' not found in response`);

        // Provide helpful suggestions
        const availableFields = this.getAvailableResponseFields(sourceResult.responseData.body);
        if (availableFields.length > 0) {
          issues.push(`  Available fields: ${availableFields.slice(0, 5).join(', ')}${availableFields.length > 5 ? '...' : ''}`);
        }
      }

      // Type compatibility check
      if (connection.sourceType && connection.targetType) {
        if (!this.areTypesCompatibleEnhanced(connection.sourceType, connection.targetType) && !connection.transform) {
          issues.push(`Connection '${connection.id}': Incompatible types ${connection.sourceType} -> ${connection.targetType} (consider adding transform)`);
        }
      }
    }

    if (issues.length > 0) {
      console.warn(`🔗 Connection issues for endpoint '${endpoint.id}':`);
      issues.forEach(issue => console.warn(`  ${issue}`));
    }
  }

  /**
   * Recursively collects available field paths from a response body object, up to a specified depth.
   * Does not recurse into arrays to avoid excessive field enumeration.
   *
   * @param responseBody - The response body object to inspect.
   * @param prefix - The prefix to prepend to field paths (used for recursion).
   * @param maxDepth - The maximum depth to recurse into nested objects.
   * @returns An array of string field paths found in the response body, sorted alphabetically.
   */
  private getAvailableResponseFields(responseBody: any, prefix: string = '', maxDepth: number = 2): string[] {
    if (maxDepth <= 0 || !responseBody || typeof responseBody !== 'object') {
      return [];
    }

    const fields: string[] = [];

    for (const [key, value] of Object.entries(responseBody)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      fields.push(fieldPath);

      // Recurse into nested objects (but not arrays to avoid too many fields)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        fields.push(...this.getAvailableResponseFields(value, fieldPath, maxDepth - 1));
      }
    }

    return fields.sort();
  }

  /**
   * Validates that a value matches the expected parameter type.
   *
   * @param value - The value to check.
   * @param expectedType - The expected type as a string ('string', 'number', 'boolean', 'array', 'object').
   * @returns True if the value matches the expected type, false otherwise.
   */
  private validateParameterType(value: any, expectedType: string): boolean {
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
   * Returns a human-readable type name for a given value, for use in error messages.
   *
   * @param value - The value to inspect.
   * @returns The type name as a string ('null', 'array', or typeof value).
   */
  private getValueType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  /**
   * Validates parameter value constraints such as string length, number bounds, and array size.
   * Throws an error if a constraint is violated.
   *
   * @param key - The parameter key.
   * @param value - The value to validate.
   * @param paramDef - The parameter definition object.
   * @param contextType - The context type ('path', 'query', 'body', etc.) for error messages.
   */
  private validateParameterValue(
    key: string,
    value: any,
    paramDef: ParameterDefinition,
    contextType: string
  ): void {
    // String validation
    if (typeof value === 'string') {
      if (value.length === 0 && paramDef.required) {
        throw new Error(`AI ${contextType} response field '${key}' cannot be empty string`);
      }
      if (value.length > 1000) { // Reasonable limit
        throw new Error(`AI ${contextType} response field '${key}' string too long (max 1000 chars)`);
      }
    }

    // Number validation
    if (typeof value === 'number') {
      if (value < -1000000 || value > 1000000) { // Reasonable bounds
        throw new Error(`AI ${contextType} response field '${key}' number out of reasonable bounds`);
      }
    }

    // Array validation
    if (Array.isArray(value)) {
      if (value.length > 100) { // Reasonable limit
        throw new Error(`AI ${contextType} response field '${key}' array too large (max 100 items)`);
      }
    }
  }

  /**
   * Validates the AI-generated response body against the provided body schema.
   * Performs both schema-based and additional size validations.
   *
   * @param aiResponse - The AI-generated response body to validate.
   * @param bodySchema - The expected body schema definition.
   * @throws If the response does not match the schema or exceeds size limits.
   */
  private validateBodySchema(aiResponse: any, bodySchema: BodySchema): void {
    if (!bodySchema.schema) {
      // If no schema defined, allow any valid JSON
      if (typeof aiResponse !== 'object' || aiResponse === null) {
        throw new Error('AI body response must be a valid JSON object');
      }
      return;
    }

    // Use parameter schema validation for body fields
    this.validateParameterSchema(aiResponse, bodySchema.schema, 'body');

    // Additional body-specific validation
    const responseSize = JSON.stringify(aiResponse).length;
    if (responseSize > 10000) { // 10KB limit
      throw new Error(`AI body response too large (${responseSize} bytes, max 10KB)`);
    }
  }

  /**
   * Checks the availability of connections for a given endpoint, including whether source endpoints
   * have been executed and whether required fields are present in their responses.
   *
   * @param endpoint - The API endpoint whose connections are to be checked.
   * @returns An object containing arrays of available connections, missing connections, and warnings.
   */
  private validateConnectionAvailability(endpoint: ApiEndpoint): {
    availableConnections: string[];
    missingConnections: string[];
    warnings: string[];
  } {
    const availableConnections: string[] = [];
    const missingConnections: string[] = [];
    const warnings: string[] = [];

    for (const connection of endpoint.connections) {
      const sourceResult = this.context.results.get(connection.sourceNodeId);

      if (sourceResult && sourceResult.success) {
        availableConnections.push(connection.sourceNodeId);

        // Check if the specified source field exists in the response
        const value = this.extractValueFromResult(sourceResult, connection.sourceField);
        if (value === undefined) {
          warnings.push(
            `Connection ${connection.sourceNodeId} → ${endpoint.id}: ` +
            `Field '${connection.sourceField}' not found in source response`
          );
        }
      } else {
        missingConnections.push(connection.sourceNodeId);
        warnings.push(
          `Connection ${connection.sourceNodeId} → ${endpoint.id}: ` +
          `Source endpoint failed or not executed`
        );
      }
    }

    return {
      availableConnections,
      missingConnections,
      warnings
    };
  }

  /**
   * Gathers context information from all connections of the given endpoint.
   * This includes data from source endpoints, field mappings, and a summary string for use in AI prompts.
   *
   * @param endpoint - The API endpoint whose connections are to be analyzed.
   * @returns An object containing:
   *   - hasConnections: Whether any connections are present and have data.
   *   - connectionData: Array of objects describing each connection, including truncated response data.
   *   - contextSummary: A human-readable summary of the available connection data.
   */
  private gatherConnectionContext(endpoint: ApiEndpoint): {
    hasConnections: boolean;
    connectionData: Array<{
      sourceEndpoint: string;
      sourceField: string;
      targetField: string;
      targetLocation: string;
      mapping: string;
      responseData: any;
    }>;
    contextSummary: string;
  } {
    const connectionData: Array<{
      sourceEndpoint: string;
      sourceField: string;
      targetField: string;
      targetLocation: string;
      mapping: string;
      responseData: any;
    }> = [];

    // Gather data from connected endpoints
    for (const connection of endpoint.connections) {
      const sourceResult = this.context.results.get(connection.sourceNodeId);

      if (sourceResult && sourceResult.success) {
        // Truncate response data for AI context
        const truncatedResponse = HttpResponseUtils.truncateArrays(
          sourceResult.responseData.body,
          1, // Max array length
          3  // Max depth for AI context
        );

        connectionData.push({
          sourceEndpoint: connection.sourceNodeId,
          sourceField: connection.sourceField,
          targetField: connection.targetField,
          targetLocation: connection.targetLocation,
          mapping: connection.naturalLanguageMapping,
          responseData: truncatedResponse
        });
      }
    }

    // Create context summary
    const contextSummary = connectionData.length > 0
      ? `Available data from ${connectionData.length} connected endpoint(s):\n` +
      connectionData.map(conn =>
        `- ${conn.sourceEndpoint}: ${conn.mapping} (${conn.sourceField} → ${conn.targetField})`
      ).join('\n')
      : 'No connected endpoints available.';

    return {
      hasConnections: connectionData.length > 0,
      connectionData,
      contextSummary
    };
  }

  /**
   * Resolves all data required for an endpoint, including parameters, body, headers, and data from connections.
   * Applies any necessary transformations and merges connection data into the appropriate locations.
   *
   * @param endpoint - The API endpoint for which to resolve data.
   * @returns A promise resolving to an object containing queryParams, pathParams, body, and headers.
   */
  private async resolveEndpointData(endpoint: ApiEndpoint): Promise<{
    queryParams: Record<string, any>;
    pathParams: Record<string, any>;
    body: any;
    headers: Record<string, string>;
  }> {
    // Start with resolved parameters from endpoint
    let queryParams = endpoint.getResolvedParams();
    let pathParams: Record<string, any> = {};
    let body = endpoint.getResolvedBody();
    let headers = { ...endpoint.headers };

    // Extract path parameter values
    Object.entries(endpoint.pathParams).forEach(([key, param]) => {
      if (param.defaultValue !== undefined) {
        pathParams[key] = param.defaultValue;
      }
    });

    // Resolve data from connections
    for (const connection of endpoint.connections) {
      const sourceResult = this.context.results.get(connection.sourceNodeId);

      if (sourceResult && sourceResult.success) {
        const value = this.extractValueFromResult(sourceResult, connection.sourceField);

        if (value !== undefined) {
          // Apply transformation if specified
          const finalValue = connection.transform
            ? this.applyTransformation(value, connection.transform)
            : value;

          // Set value in appropriate location
          switch (connection.targetLocation) {
            case 'query':
              queryParams[connection.targetField] = finalValue;
              break;
            case 'body':
              if (!body) body = {};
              body[connection.targetField] = finalValue;
              break;
            case 'header':
              headers[connection.targetField] = String(finalValue);
              break;
            case 'path':
              pathParams[connection.targetField] = finalValue;
              break;
          }
        }
      }
    }

    return { queryParams, pathParams, body, headers };
  }

  /**
   * Resolves path parameters for the given endpoint using AI, incorporating connection context and schema validation.
   * Updates the resolvedData.pathParams object with validated AI-generated values.
   *
   * @param endpoint - The API endpoint whose path parameters are to be resolved.
   * @param resolvedData - The object to update with resolved path parameters.
   * @throws Error if the AI response is not valid JSON or fails schema validation.
   */
  private async resolvePathParameters(endpoint: ApiEndpoint, resolvedData: any): Promise<void> {
    const connectionContext = this.gatherConnectionContext(endpoint);

    // Load and compile Handlebars template
    const templatePath = path.join(__dirname, 'prompt-templates', 'path-parameters-prompt.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSource);

    // Prepare context for template
    const context = {
      pathParamsSchema: JSON.stringify(endpoint.pathParams, null, 2),
      connectionContextSummary: connectionContext.contextSummary,
      hasConnections: connectionContext.hasConnections,
      connectionData: connectionContext.connectionData.map(conn => ({
        sourceEndpoint: conn.sourceEndpoint,
        mapping: conn.mapping,
        responseData: JSON.stringify(conn.responseData, null, 2)
      })),
      naturalLanguageInput: endpoint.naturalLanguageInput
    };

    const prompt = template(context);

    try {
      const response = await this.aoai.chat(prompt, "gpt-4.1");
      const cleanResponse = this.cleanAiJsonResponse(response);
      const aiResolvedParams = JSON.parse(cleanResponse);

      // Validate against schema before using
      this.validateParameterSchema(aiResolvedParams, endpoint.pathParams, 'path');

      // Only update existing path parameters that passed validation
      Object.keys(resolvedData.pathParams).forEach(key => {
        if (aiResolvedParams.hasOwnProperty(key)) {
          resolvedData.pathParams[key] = aiResolvedParams[key];
        }
      });

      console.log(`AI resolved path params (validated):`, aiResolvedParams);
      if (connectionContext.hasConnections) {
        console.log(`Used data from ${connectionContext.connectionData.length} connected endpoint(s)`);
      }
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        throw new Error(`AI path parameter response is not valid JSON: ${error.message}`);
      }
      if (error.message.includes('AI path response')) {
        throw error; // Re-throw validation errors
      }
      throw new Error(`AI path parameter resolution failed: ${error.message}`);
    }
  }

  /**
   * Resolves query parameters for the given endpoint using AI, incorporating connection context and schema validation.
   * Updates the resolvedData.queryParams object with validated AI-generated values.
   *
   * @param endpoint - The API endpoint whose query parameters are to be resolved.
   * @param resolvedData - The object to update with resolved query parameters.
   * @throws Error if the AI response is not valid JSON or fails schema validation.
   */
  private async resolveQueryParameters(endpoint: ApiEndpoint, resolvedData: any): Promise<void> {
    const connectionContext = this.gatherConnectionContext(endpoint);

    // Load and compile Handlebars template
    const templatePath = path.join(__dirname, 'prompt-templates', 'query-parameters-prompt.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSource);

    // Prepare context for template
    const context = {
      queryParamsSchema: JSON.stringify(endpoint.queryParams, null, 2),
      connectionContextSummary: connectionContext.contextSummary,
      hasConnections: connectionContext.hasConnections,
      connectionData: connectionContext.connectionData.map(conn => ({
        sourceEndpoint: conn.sourceEndpoint,
        mapping: conn.mapping,
        responseData: JSON.stringify(conn.responseData, null, 2)
      })),
      naturalLanguageInput: endpoint.naturalLanguageInput
    };

    const prompt = template(context);

    try {
      const response = await this.aoai.chat(prompt, "gpt-4.1");
      const cleanResponse = this.cleanAiJsonResponse(response);
      const aiResolvedParams = JSON.parse(cleanResponse);

      // Validate against schema before using
      this.validateParameterSchema(aiResolvedParams, endpoint.queryParams, 'query');

      // Merge validated AI-resolved params with existing query params
      Object.keys(endpoint.queryParams).forEach(key => {
        if (aiResolvedParams.hasOwnProperty(key)) {
          resolvedData.queryParams[key] = aiResolvedParams[key];
        }
      });

      console.log(`AI resolved query params (validated):`, aiResolvedParams);
      if (connectionContext.hasConnections) {
        console.log(`Used data from ${connectionContext.connectionData.length} connected endpoint(s)`);
      }
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        throw new Error(`AI query parameter response is not valid JSON: ${error.message}`);
      }
      if (error.message.includes('AI query response')) {
        throw error; // Re-throw validation errors
      }
      throw new Error(`AI query parameter resolution failed: ${error.message}`);
    }
  }

  /**
   * Resolves body parameters for the given endpoint using AI, incorporating connection context and schema validation.
   * Updates the resolvedData.body object with validated AI-generated values.
   *
   * @param endpoint - The API endpoint whose body parameters are to be resolved.
   * @param resolvedData - The object to update with resolved body parameters.
   * @throws Error if the AI response is not valid JSON or fails schema validation.
   */
  private async resolveBodyParameters(endpoint: ApiEndpoint, resolvedData: any): Promise<void> {
    if (!endpoint.body || endpoint.method === 'GET') {
      return;
    }

    const connectionContext = this.gatherConnectionContext(endpoint);

    // Load and compile Handlebars template
    const templatePath = path.join(__dirname, 'prompt-templates', 'body-parameters-prompt.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSource);

    // Prepare context for template
    const context = {
      httpMethod: endpoint.method,
      bodySchema: JSON.stringify(endpoint.body.schema || {}, null, 2),
      connectionContextSummary: connectionContext.contextSummary,
      hasConnections: connectionContext.hasConnections,
      connectionData: connectionContext.connectionData.map(conn => ({
        sourceEndpoint: conn.sourceEndpoint,
        mapping: conn.mapping,
        responseData: JSON.stringify(conn.responseData, null, 2)
      })),
      naturalLanguageInput: endpoint.naturalLanguageInput
    };

    const prompt = template(context);

    try {
      const response = await this.aoai.chat(prompt, "gpt-4.1");
      const cleanResponse = this.cleanAiJsonResponse(response);
      const aiResolvedBody = JSON.parse(cleanResponse);

      // Validate against body schema before using
      this.validateBodySchema(aiResolvedBody, endpoint.body);

      // Merge validated AI-resolved body with existing body data
      if (resolvedData.body) {
        resolvedData.body = { ...resolvedData.body, ...aiResolvedBody };
      } else {
        resolvedData.body = aiResolvedBody;
      }

      console.log(`AI resolved body (validated):`, aiResolvedBody);
      if (connectionContext.hasConnections) {
        console.log(`Used data from ${connectionContext.connectionData.length} connected endpoint(s)`);
      }
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        throw new Error(`AI body response is not valid JSON: ${error.message}`);
      }
      if (error.message.includes('AI body response')) {
        throw error; // Re-throw validation errors
      }
      throw new Error(`AI body parameter resolution failed: ${error.message}`);
    }
  }

  /**
   * Cleans an AI-generated JSON response string by removing code block markers and extracting the JSON object or array.
   * Throws an error if a JSON structure cannot be extracted.
   *
   * @param response - The raw AI response string.
   * @returns The cleaned JSON string.
   * @throws Error if the response does not contain valid JSON.
   */
  private cleanAiJsonResponse(response: string): string {
    let cleaned = response.trim()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Try to extract JSON object first (most common case)
    const objectMatch = cleaned.match(/^[^{]*({.*})[^}]*$/s);
    if (objectMatch) {
      if (!objectMatch[1]) {
        throw new Error(`AI body response is not valid JSON: ${response}`);
      }

      return objectMatch[1];
    }

    // If no object found, try to extract JSON array
    const arrayMatch = cleaned.match(/^[^[]*(\[.*\])[^]]*$/s);
    if (arrayMatch) {
      if (!arrayMatch[1]) {
        throw new Error(`AI body response is not valid JSON: ${response}`);
      }

      return arrayMatch[1];
    }

    // Return as-is if no JSON structure found
    return cleaned;
  }


  /**
   * Calls the AI model with the provided prompt and context type, handling retries and response validation.
   * Cleans and parses the AI response as JSON, and validates the structure based on the context type.
   *
   * @param prompt - The prompt string to send to the AI model.
   * @param contextType - The type of context for the parameters ('path', 'query', or 'body').
   * @param retries - The number of retry attempts in case of failure (default: 2).
   * @returns The parsed and validated AI response as an object, or an empty object on repeated failure.
   */
  private async callAiWithContext(
    prompt: string,
    contextType: 'path' | 'query' | 'body',
    retries: number = 2
  ): Promise<any> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.aoai.chat(prompt, "gpt-4.1");

        // Clean response and attempt to parse JSON
        const cleanResponse = response.trim()
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .replace(/^[^{]*({.*})[^}]*$/s, '$1'); // Extract JSON object

        const parsedResponse = JSON.parse(cleanResponse);

        // Validate response structure based on context
        if (this.validateAiResponse(parsedResponse, contextType)) {
          return parsedResponse;
        } else {
          throw new Error(`Invalid ${contextType} response structure`);
        }

      } catch (error: any) {
        console.warn(`⚠️ AI ${contextType} resolution attempt ${attempt + 1} failed:`, error);

        if (attempt === retries) {
          return {}; // Return empty object on final failure
        }

        // Wait before retry
        await this.sleep(1000 * (attempt + 1));
      }
    }

    return {};
  }

  /**
   * Validates the structure of the AI response based on the context type.
   *
   * @param response - The AI response object to validate.
   * @param contextType - The type of context ('path', 'query', or 'body').
   * @returns True if the response structure is valid for the given context, false otherwise.
   */
  private validateAiResponse(response: any, contextType: 'path' | 'query' | 'body'): boolean {
    if (!response || typeof response !== 'object') {
      return false;
    }

    switch (contextType) {
      case 'path':
      case 'query':
        // Should be a flat object with simple values
        return Object.values(response).every(value =>
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean'
        );

      case 'body':
        // Can be any valid JSON structure
        return true;

      default:
        return false;
    }
  }

  /**
   * Handles comprehensive AI resolution for an endpoint, including path, query, and body parameters.
   * Validates connection availability and processes each parameter type as needed.
   *
   * @param endpoint - The API endpoint to resolve parameters for.
   * @param resolvedData - The current resolved data for the endpoint.
   */
  private async processAiResolution(endpoint: ApiEndpoint, resolvedData: any): Promise<void> {
    const hasPathParams = Object.keys(endpoint.pathParams).length > 0;
    const hasQueryParams = Object.keys(endpoint.queryParams).length > 0;
    const hasBody = endpoint.body && endpoint.method !== 'GET';

    // Validate connection availability
    const connectionStatus = this.validateConnectionAvailability(endpoint);

    if (connectionStatus.warnings.length > 0) {
      console.warn('🔗 Connection warnings:');
      connectionStatus.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    console.log(`🔗 Connection status for ${endpoint.id}:`);
    console.log(`  - Available: ${connectionStatus.availableConnections.length}`);
    console.log(`  - Missing: ${connectionStatus.missingConnections.length}`);

    // Process path parameters with connection context
    if (hasPathParams) {
      await this.resolvePathParameters(endpoint, resolvedData);
    }

    // Process query parameters with connection context
    if (hasQueryParams) {
      await this.resolveQueryParameters(endpoint, resolvedData);
    }

    // Process body parameters with connection context (only for non-GET methods)
    if (hasBody) {
      await this.resolveBodyParameters(endpoint, resolvedData);
    }
  }

  /**
   * Formats connection data for logging, including mappings and available data previews.
   *
   * @param endpoint - The API endpoint whose connections are to be logged.
   * @returns A formatted string representing the connection data for logging.
   */
  private formatConnectionDataForLogging(endpoint: ApiEndpoint): string {
    if (endpoint.connections.length === 0) {
      return 'No connections configured.';
    }

    const connectionContext = this.gatherConnectionContext(endpoint);
    let output = `Connections for ${endpoint.name}:\n`;

    connectionContext.connectionData.forEach(conn => {
      output += `\n📎 ${conn.sourceEndpoint} → ${endpoint.id}:\n`;
      output += `  - Mapping: ${conn.mapping}\n`;
      output += `  - Source Field: ${conn.sourceField}\n`;
      output += `  - Target: ${conn.targetField} (${conn.targetLocation})\n`;
      output += `  - Available Data Preview:\n`;
      output += HttpResponseUtils.formatForLogging(conn.responseData, 1)
        .split('\n')
        .map(line => `    ${line}`)
        .join('\n');
    });

    return output;
  }

  /**
   * Builds the HTTP request configuration for an endpoint, including URL, headers, query parameters, and body.
   * If the endpoint has natural language input, triggers AI resolution for parameters.
   *
   * @param endpoint - The API endpoint to build the request for.
   * @param resolvedData - The resolved data for the endpoint.
   * @returns The constructed RequestData object.
   */
  private async buildRequestConfig(endpoint: ApiEndpoint, resolvedData: any): Promise<RequestData> {
    // Only process AI resolution if natural language input exists
    if (endpoint.naturalLanguageInput) {
      await this.processAiResolution(endpoint, resolvedData);
    }

    // Build full URL with path parameters
    const url = endpoint.getFullUrl(resolvedData.pathParams);

    // Prepare headers
    const headers: Record<string, string> = {
      ...resolvedData.headers
    };

    // Add content type for body requests (skip for GET)
    if (resolvedData.body && !headers['Content-Type'] && endpoint.method !== 'GET') {
      headers['Content-Type'] = endpoint.body?.type === 'form'
        ? 'application/x-www-form-urlencoded'
        : 'application/json';
    }

    // Return RequestData shape (no auth logic here)
    return {
      url,
      method: endpoint.method,
      headers,
      queryParams: resolvedData.queryParams,
      body: endpoint.method !== 'GET' ? resolvedData.body : undefined
    };
  }

  /**
   * Executes an HTTP request with retry logic, using the provided configuration and execution options.
   *
   * @param config - The request configuration to use for the HTTP request.
   * @param options - Execution options, including retry count and timeout.
   * @returns The HTTP response data.
   */
  private async executeHttpRequest(
    config: RequestData,
    options: ExecutionOptions
  ): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      const maxRetries = options.retries || 0;
      let lastError: Error;
      const timeout = (options.timeout !== undefined ? options.timeout : 30000);
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Simple fetch-based implementation
          const response = await this.performHttpRequest(config, timeout);
          return resolve(response);
        } catch (error: any) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt === maxRetries) {
            return reject(lastError);
          }

          // Wait before retry
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }

      return reject(lastError!);
    });
  }

  /**
   * Performs the actual HTTP request using fetch, with support for query parameters, headers, and body.
   *
   * @param config - The request configuration.
   * @param timeout - The timeout in milliseconds for the request.
   * @returns The HTTP response, including status, headers, and data.
   */
  private async performHttpRequest(config: RequestData, timeout: number): Promise<any> {
    const { url, method, headers, queryParams, body } = config;

    // Build URL with query parameters
    const urlWithParams = new URL(url);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        urlWithParams.searchParams.append(key, String(value));
      });
    }

    // Create fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(timeout || 30000)
    };

    // Add body for POST/PUT/PATCH/DELETE
    if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(urlWithParams.toString(), fetchOptions);

    // Parse response
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let responseData: any;
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseData
    };
  }

  /**
   * Extracts a value from an execution result using a simple dot-separated JSON path.
   *
   * @param result - The execution result containing the response data.
   * @param path - The dot-separated path to extract (e.g., "user.name" or "items.0.id").
   *                If empty or '.', returns the entire response body.
   * @returns The value at the specified path, or undefined if not found.
   */
  private extractValueFromResult(result: ExecutionResult, path: string): any {
    const data = result.responseData.body;

    if (!path || path === '.') {
      return data;
    }

    // Simple JSON path extraction
    const parts = path.split('.');
    let current = data;

    for (const part of parts) {
      if (part === '') continue; // Skip empty parts from leading dots

      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Applies a transformation to a value based on the specified transformation type.
   *
   * Supported transformations:
   *   - 'string': Convert to string
   *   - 'number': Convert to number
   *   - 'boolean': Convert to boolean
   *   - 'upper': Convert to uppercase string
   *   - 'lower': Convert to lowercase string
   *   - 'trim': Trim whitespace from string
   *   - 'bearer-prefix': Prefix with "Bearer "
   *   - 'basic-auth': Encode as Basic Auth header (base64)
   *   - 'json-stringify': Convert to JSON string
   *   - 'url-encode': URL-encode the value
   *   - 'array-wrap': Wrap value in array if not already an array
   *   - 'array-first': Return first element if array, else value
   *
   * @param value - The value to transform.
   * @param transform - The transformation type.
   * @returns The transformed value.
   */
  private applyTransformation(value: any, transform: string): any {
    switch (transform) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'upper':
        return String(value).toUpperCase();
      case 'lower':
        return String(value).toLowerCase();
      case 'trim':
        return String(value).trim();
      case 'bearer-prefix':
        return `Bearer ${value}`;
      case 'basic-auth':
        return `Basic ${btoa(value)}`;
      case 'json-stringify':
        return JSON.stringify(value);
      case 'url-encode':
        return encodeURIComponent(String(value));
      case 'array-wrap':
        return Array.isArray(value) ? value : [value];
      case 'array-first':
        return Array.isArray(value) ? value[0] : value;
      default:
        return value;
    }
  }

  /**
   * Sorts API endpoints in dependency order, so that dependencies are executed before dependents.
   * Throws an error if a circular dependency is detected.
   *
   * @param endpoints - The array of API endpoints to sort.
   * @returns The sorted array of endpoints.
   * @throws Error if a circular dependency is detected.
   */
  private sortEndpointsByDependencies(endpoints: ApiEndpoint[]): ApiEndpoint[] {
    const sorted: ApiEndpoint[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (endpoint: ApiEndpoint) => {
      if (visiting.has(endpoint.id)) {
        throw new Error(`Circular dependency detected involving endpoint: ${endpoint.id}`);
      }

      if (visited.has(endpoint.id)) {
        return;
      }

      visiting.add(endpoint.id);

      // Visit dependencies first
      for (const connection of endpoint.connections) {
        const dependency = endpoints.find(ep => ep.id === connection.sourceNodeId);
        if (dependency) {
          visit(dependency);
        }
      }

      visiting.delete(endpoint.id);
      visited.add(endpoint.id);
      sorted.push(endpoint);
    };

    endpoints.forEach(endpoint => visit(endpoint));
    return sorted;
  }

  /**
   * Validates the response of an endpoint against its expected response schema.
   * Throws an error if the status code is not expected.
   *
   * @param endpoint - The API endpoint definition.
   * @param result - The execution result to validate.
   * @throws Error if the status code is not among the expected responses.
   */
  private validateResponse(endpoint: ApiEndpoint, result: ExecutionResult): void {
    const expectedResponse = endpoint.expectedResponse.find(
      resp => resp.statusCode === result.statusCode
    );

    if (!expectedResponse) {
      throw new Error(`Unexpected status code: ${result.statusCode}`);
    }

    // Additional validation logic can be added here
  }

  /**
   * Utility function to pause execution for a specified number of milliseconds.
   *
   * @param ms - The number of milliseconds to sleep.
   * @returns A promise that resolves after the specified delay.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clears the execution context, removing all stored results and variables.
   */
  public clearContext(): void {
    this.context.results.clear();
    this.context.variables.clear();
  }

  /**
   * Returns a shallow copy of the current execution context.
   * Useful for inspection or debugging purposes.
   *
   * @returns {ExecutionContext} The current execution context.
   */
  public getContext(): ExecutionContext {
    return { ...this.context };
  }

  /**
   * Validates all typed connections for an endpoint, ensuring type compatibility and valid transformations.
   * Throws an error if any connection is type-incompatible or has an invalid transformation.
   * Marks each validated connection with a `validated` flag.
   *
   * @param {ApiEndpoint} endpoint - The API endpoint whose connections are to be validated.
   * @throws {Error} If a type-incompatible connection or invalid transformation is found.
   */
  private validateTypedConnections(endpoint: ApiEndpoint): void {
    const typedConnections = endpoint.connections.filter(conn => conn.sourceType && conn.targetType);

    for (const connection of typedConnections) {
      // Enhanced type compatibility validation
      if (!this.areTypesCompatibleEnhanced(connection.sourceType!, connection.targetType!)) {
        throw new Error(
          `Type incompatible connection in ${endpoint.id}: ` +
          `${connection.sourceType} -> ${connection.targetType} ` +
          `(${connection.sourceField} -> ${connection.targetField})`
        );
      }

      // Validate transformation if present
      if (connection.transform && !this.isValidTransformation(connection.transform, connection.sourceType!, connection.targetType!)) {
        throw new Error(
          `Invalid transformation '${connection.transform}' for types ` +
          `${connection.sourceType} -> ${connection.targetType} in ${endpoint.id}`
        );
      }

      // Mark as validated
      connection.validated = true;
    }
  }

  /**
   * Determines whether two parameter types are compatible for connection.
   * Allows for certain type conversions (e.g., string to number, string to boolean).
   *
   * @param {ParameterType} sourceType - The type of the source parameter.
   * @param {ParameterType} targetType - The type of the target parameter.
   * @returns {boolean} True if the types are compatible, false otherwise.
   */
  private areTypesCompatibleEnhanced(sourceType: ParameterType, targetType: ParameterType): boolean {
    // Exact match
    if (sourceType === targetType) return true;

    // String can accept any type (will be converted)
    if (targetType === 'string') return true;

    // Number can accept string if it's convertible
    if (targetType === 'number' && sourceType === 'string') return true;

    // Boolean can accept string for 'true'/'false' values
    if (targetType === 'boolean' && sourceType === 'string') return true;

    // Object can accept any complex type
    if (targetType === 'object' && (sourceType === 'array' || sourceType === 'object')) return true;

    return false;
  }

  /**
   * Checks if a given transformation is valid for the specified source and target parameter types.
   *
   * @param {string} transformName - The name of the transformation.
   * @param {ParameterType} sourceType - The type of the source parameter.
   * @param {ParameterType} targetType - The type of the target parameter.
   * @returns {boolean} True if the transformation is valid, false otherwise.
   */
  private isValidTransformation(transformName: string, sourceType: ParameterType, targetType: ParameterType): boolean {
    const validTransformations: Record<string, { from: ParameterType[]; to: ParameterType[] }> = {
      'string': { from: ['string', 'number', 'boolean', 'array', 'object'], to: ['string'] },
      'number': { from: ['string', 'number'], to: ['number'] },
      'boolean': { from: ['string', 'boolean'], to: ['boolean'] },
      'bearer-prefix': { from: ['string'], to: ['string'] },
      'array-wrap': { from: ['string', 'number', 'boolean', 'object'], to: ['array'] },
      'array-first': { from: ['array'], to: ['string', 'number', 'boolean', 'object'] },
      'upper': { from: ['string'], to: ['string'] },
      'lower': { from: ['string'], to: ['string'] },
      'trim': { from: ['string'], to: ['string'] }
    };

    const transform = validTransformations[transformName];
    if (!transform) return false;

    return transform.from.includes(sourceType) && transform.to.includes(targetType);
  }
}
