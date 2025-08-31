import { RequestData } from '../models/RequestData';
import { AuthConfig } from '../models/AuthConfig';
import { ExecutionContext } from '../models/ExecutionContext';

/**
 * Interface for authentication handlers that apply authentication to outgoing requests.
 */
export interface AuthHandler {
  /**
   * Applies authentication to the outgoing request.
   *
   * @param request - The request object to modify.
   * @param config - The authentication configuration.
   * @param ctx - The execution context.
   * @returns A promise that resolves to the modified request with authentication applied.
   */
  applyAuth(
    request: RequestData,
    config: AuthConfig,
    ctx: ExecutionContext
  ): Promise<RequestData>;
}
