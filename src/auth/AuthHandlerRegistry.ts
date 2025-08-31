import { AuthType, AuthConfig } from '../models/AuthConfig';
import { AuthHandler } from './AuthHandler';

/**
 * Registry for managing authentication handlers by type.
 * Allows registration and retrieval of AuthHandler instances for different AuthTypes.
 */
export class AuthHandlerRegistry {
  /**
   * Internal map of authentication handlers keyed by AuthType.
   * @private
   */
  private handlers: Map<AuthType, AuthHandler> = new Map();

  /**
   * Registers an authentication handler for a specific AuthType.
   * @param type - The authentication type to register the handler for.
   * @param handler - The AuthHandler instance to associate with the type.
   */
  register(type: AuthType, handler: AuthHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Retrieves the authentication handler for a given AuthType.
   * @param type - The authentication type to retrieve the handler for.
   * @returns The AuthHandler instance if registered, otherwise undefined.
   */
  getHandler(type: AuthType): AuthHandler | undefined {
    return this.handlers.get(type);
  }
}
