import { AuthHandler } from './AuthHandler';
import { RequestData } from '../models/RequestData';
import { AuthConfig } from '../models/AuthConfig';
import { ExecutionContext } from '../models/ExecutionContext';

/**
 * BearerTokenAuthHandler - Handles Bearer Token authentication by injecting the token
 * into the Authorization header of the outgoing request.
 *
 * @implements {AuthHandler}
 */
export class BearerTokenAuthHandler implements AuthHandler {
  /**
   * Applies Bearer Token authentication to the outgoing request.
   *
   * @param {RequestData} request - The request object to modify.
   * @param {AuthConfig} config - The authentication configuration containing the bearer token.
   * @param {ExecutionContext} ctx - The execution context (not used in this handler).
   * @returns {Promise<RequestData>} The modified request with the Authorization header set.
   */
  async applyAuth(
    request: RequestData,
    config: AuthConfig,
    ctx: ExecutionContext
  ): Promise<RequestData> {
    if (config.token) {
      request.headers = request.headers || {};
      request.headers['Authorization'] = `Bearer ${config.token}`;
    }
    return request;
  }
}
