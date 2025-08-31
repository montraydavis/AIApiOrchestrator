/**
 * Represents the standard HTTP methods used in API requests.
 *
 * @typedef {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'} HttpMethod
 * @property GET - Retrieve data from the server.
 * @property POST - Submit data to be processed to the server.
 * @property PUT - Update existing data on the server.
 * @property PATCH - Partially update existing data on the server.
 * @property DELETE - Remove data from the server.
 * @property HEAD - Retrieve headers for a resource, without the body.
 * @property OPTIONS - Describe the communication options for the target resource.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
