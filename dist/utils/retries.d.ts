/**
 * Determines whether an error should be retried
 * @param {Error} error - The error object to check
 * @returns {boolean} Whether the error should be retried
 */
export declare function _shouldRetry(error: any): boolean;
/**
 * Calculate backoff delay for retries
 * @param {number} retries - The number of retries attempted
 * @param {number} retryDelay - The base retry delay
 * @param {number} retryBackoff - The backoff multiplier
 * @param {number} maxRetries - The maximum number of retries
 * @param {number} retryCappedDelay - The maximum delay allowed
 * @returns {number} The calculated backoff delay in milliseconds
 */
export declare function _calculateBackoffDelay(retries: number, retryDelay: number, retryBackoff: number, maxRetries: number, retryCappedDelay: number): number;
/**
 * Create a delay promise
 * @param {number} ms - The number of milliseconds to delay
 * @returns {Promise<void>} A promise that resolves after the specified delay
 */
export declare function _delay(ms: number): Promise<void>;
