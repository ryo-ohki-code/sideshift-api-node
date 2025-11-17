import { RequestConfig } from './../types/requestConfig';
/**
 * Updates the request configuration for API calls
 * @param {Object} config - Configuration object for request settings
 * @param {number} config.retryDelay - Initial delay between retries in milliseconds
 * @param {number} config.retryBackoff - Backoff multiplier for exponential backoff
 * @param {number} config.maxRetries - Maximum number of retry attempts
 * @param {number} config.retryCappedDelay - Maximum delay between retries in milliseconds
 * @param {number} config.defaultTimeOut - Default timeout for requests in milliseconds
 * @param {boolean} config.verbose - Enable verbose logging output
 * @param {string} config.BASE_URL - Base URL for all API endpoints
 * @returns {RequestConfig} This function updates global configuration variables
 */
export declare function _updateRequestConfig(config: RequestConfig): void;
/**
 * Make an API request
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @param {Number} retries - Number of retry done
 * @returns {Promise<Object>} Response data or error object
 */
export declare function _request(url: string, options?: any, retries?: number): Promise<any>;
/**
 * Make an image API request
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Blob|Object>} Image blob or error object
 */
export declare function _requestImage(url: string, options?: any, retries?: number): Promise<Blob | object>;
/**
 * Sends a POST request to the specified URL with the given body and headers
 * @param {string} url - The API endpoint URL
 * @param {Object} headers - The headers to include in the request
 * @param {Object} body - The request body to send
 * @returns {Promise<Response>} The fetch response object
 */
export declare function _post(url: string, headers: any, body: any): Promise<any>;
//# sourceMappingURL=request.d.ts.map