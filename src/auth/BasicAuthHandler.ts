import { AuthHandler } from './AuthHandler';
import { RequestData } from '../models/RequestData';
import { AuthConfig } from '../models/AuthConfig';
import { ExecutionContext } from '../models/ExecutionContext';

/**
 * BasicAuthHandler - Handles HTTP Basic Authentication by injecting the appropriate
 * Authorization header into the outgoing request.
 *
 * @implements {AuthHandler}
 */
export class BasicAuthHandler implements AuthHandler {
  /**
   * Applies HTTP Basic Authentication to the outgoing request.
   *
   * @param {RequestData} request - The request object to modify.
   * @param {AuthConfig} config - The authentication configuration containing username and password.
   * @param {ExecutionContext} ctx - The execution context (not used in this handler).
   * @returns {Promise<RequestData>} The modified request with the Authorization header set.
   */
  async applyAuth(
    request: RequestData,
    config: AuthConfig,
    ctx: ExecutionContext
  ): Promise<RequestData> {
    if (config.username && config.password) {
      const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      request.headers = request.headers || {};
      request.headers['Authorization'] = `Basic ${credentials}`;
    }
    return request;
  }
}
