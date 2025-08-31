/**
 * Options to control the execution of an API request or workflow.
 *
 * @property timeout - (Optional) Maximum time in milliseconds to wait for the execution before timing out.
 * @property retries - (Optional) Number of times to retry the execution on failure.
 * @property validateResponse - (Optional) Whether to validate the response against the expected schema.
 * @property continueOnError - (Optional) Whether to continue execution if an error occurs.
 */
export interface ExecutionOptions {
    /** Maximum time in milliseconds to wait for the execution before timing out. */
    timeout?: number;
    /** Number of times to retry the execution on failure. */
    retries?: number;
    /** Whether to validate the response against the expected schema. */
    validateResponse?: boolean;
    /** Whether to continue execution if an error occurs. */
    continueOnError?: boolean;
}
