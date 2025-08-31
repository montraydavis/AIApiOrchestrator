import { ResponseData } from "./ResponseData";
import { RequestData } from "./RequestData";

/**
 * Represents the result of executing an API endpoint.
 *
 * @property endpointId - The unique identifier of the executed endpoint.
 * @property success - Indicates whether the execution was successful.
 * @property statusCode - The HTTP status code returned by the endpoint.
 * @property responseTime - The time taken to receive a response, in milliseconds.
 * @property requestData - The data sent in the request.
 * @property responseData - The data received in the response.
 * @property error - (Optional) Error message if the execution failed.
 * @property timestamp - The date and time when the execution occurred.
 */
export interface ExecutionResult {
    /** The unique identifier of the executed endpoint. */
    endpointId: string;
    /** Indicates whether the execution was successful. */
    success: boolean;
    /** The HTTP status code returned by the endpoint. */
    statusCode: number;
    /** The time taken to receive a response, in milliseconds. */
    responseTime: number;
    /** The data sent in the request. */
    requestData: RequestData;
    /** The data received in the response. */
    responseData: ResponseData;
    /** Error message if the execution failed. */
    error?: string;
    /** The date and time when the execution occurred. */
    timestamp: Date;
}
