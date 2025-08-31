import { AuthHandler } from './AuthHandler';
import { RequestData } from '../models/RequestData';
import { AuthConfig } from '../models/AuthConfig';
import { ExecutionContext } from '../models/ExecutionContext';

/**
 * ApiKeyAuthHandler - Handles API key authentication by injecting the API key into the request headers.
 *
 * @implements {AuthHandler}
 */
export class ApiKeyAuthHandler implements AuthHandler {
  /**
   * Applies API key authentication to the outgoing request.
   *
   * @param {RequestData} request - The request object to modify.
   * @param {AuthConfig} config - The authentication configuration containing the API key and optional header name.
   * @param {ExecutionContext} ctx - The execution context (not used in this handler).
   * @returns {Promise<RequestData>} The modified request with the API key header set.
   */
  async applyAuth(
    request: RequestData,
    config: AuthConfig,
    ctx: ExecutionContext
  ): Promise<RequestData> {
    if (config.apiKey) {
      request.headers = request.headers || {};
      request.headers[config.headerName || 'X-API-Key'] = config.apiKey;
    }
    return request;
  }
}
