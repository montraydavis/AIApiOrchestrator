import { ExecutionResult } from "./ExecutionResult";

/**
 * Represents the context for API execution, including results and variables.
 *
 * @interface ExecutionContext
 * @property {Map<string, ExecutionResult>} results - A map of endpoint IDs to their corresponding execution results.
 * @property {Map<string, any>} variables - A map of variable names to their values, used for parameter substitution and state.
 */
export interface ExecutionContext {
    /**
     * A map of endpoint IDs to their corresponding execution results.
     */
    results: Map<string, ExecutionResult>;
    /**
     * A map of variable names to their values, used for parameter substitution and state.
     */
    variables: Map<string, any>;
}
