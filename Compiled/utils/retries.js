"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._shouldRetry = _shouldRetry;
exports._calculateBackoffDelay = _calculateBackoffDelay;
exports._delay = _delay;
/**
 * Determines whether an error should be retried
 * @param {Error} error - The error object to check
 * @returns {boolean} Whether the error should be retried
 */
function _shouldRetry(error) {
    if (!error) {
        return false;
    }
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')
        return true;
    // Retry on network-related issues
    if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('fetch')) {
        return true;
    }
    // Don't retry on client-side errors like invalid URLs or malformed data
    if (error.name === 'TypeError' || error.name === 'SyntaxError') {
        return false;
    }
    // Do not retry server-side errors >= 500 
    if (error.status && (error.status >= 500 || error.status === 403 || error.status === 404)) {
        return false;
    }
    // Retry rate-limited (429)
    if (error.status === 429) {
        return true;
    }
    return false;
}
/**
 * Calculate backoff delay for retries
 * @param {number} retries - The number of retries attempted
 * @param {number} retryDelay - The base retry delay
 * @param {number} retryBackoff - The backoff multiplier
 * @param {number} maxRetries - The maximum number of retries
 * @param {number} retryCappedDelay - The maximum delay allowed
 * @returns {number} The calculated backoff delay in milliseconds
 */
function _calculateBackoffDelay(retries, retryDelay, retryBackoff, maxRetries, retryCappedDelay) {
    if (retries >= maxRetries) {
        return retryCappedDelay;
    }
    var baseDelay = Math.pow(retryBackoff, retries) * retryDelay;
    var cappedBaseDelay = Math.min(baseDelay, retryCappedDelay);
    var jitter = Math.floor(Math.random() * cappedBaseDelay * 0.2);
    return cappedBaseDelay + jitter;
}
/**
 * Create a delay promise
 * @param {number} ms - The number of milliseconds to delay
 * @returns {Promise<void>} A promise that resolves after the specified delay
 */
function _delay(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
