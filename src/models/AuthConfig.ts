// Authentication configuration

export type AuthType = 'apiKey' | 'bearerToken' | 'basic' | 'oauth2' | 'custom' | 'none';

/**
 * Configuration for authentication to be used with an API endpoint.
 *
 * @property type - The type of authentication to use. Supported types: 'apiKey', 'bearerToken', 'basic', 'oauth2', 'custom', 'none'.
 * @property token - (Optional) The bearer token or OAuth2 token, used for 'bearerToken' or 'oauth2' types.
 * @property username - (Optional) The username for basic authentication.
 * @property password - (Optional) The password for basic authentication.
 * @property apiKey - (Optional) The API key value, used for 'apiKey' type.
 * @property headerName - (Optional) The name of the header to use for API key or custom authentication.
 * @property customHandler - (Optional) A custom handler function for advanced or non-standard authentication flows.
 *   Receives the current execution context and returns a Promise resolving to the request data with authentication applied.
 */
export interface AuthConfig {
    type: AuthType;
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    headerName?: string; // For API key or custom header
    customHandler?: (ctx: import('./ExecutionContext').ExecutionContext) => Promise<import('./RequestData').RequestData>;
}
