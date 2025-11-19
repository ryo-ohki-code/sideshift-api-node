import { Headers } from './../types/headers';
import { RequestConfig } from './../types/requestConfig';
import { _handleResponse } from './responseHandler';
import { _shouldRetry, _calculateBackoffDelay, _delay } from './retries';
import { _errorMsg, _createError } from './error';

let _retryDelay: number;
let _retryBackoff: number;
let _retryCappedDelay: number;
let _maxRetries: number;
let _defaultTimeOut: number;
let _verbose: boolean;
let _BASE_URL: string;

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
export function _updateRequestConfig(config: RequestConfig): void {
    _retryDelay = config.retryDelay;
    _retryBackoff = config.retryBackoff;
    _maxRetries = config.maxRetries;
    _retryCappedDelay = config.retryCappedDelay;
    _defaultTimeOut = config.defaultTimeOut;
    _verbose = config.verbose;
    _BASE_URL = config.BASE_URL;
}

/**
 * Make an API request
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @param {Number} retries - Number of retry done
 * @returns {Promise<Object>} Response data or error object
 */
export async function _request(url: string, options: any = {}, retries: number = 0): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        if (!controller.signal.aborted) {
            controller.abort();
        }
    }, _defaultTimeOut);

    try {
        if (!url || typeof url !== 'string') {
            throw new Error('Invalid URL provided');
        }

        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const handledResponse = await _handleResponse(response, url, options, _verbose);

        if (url === `${_BASE_URL}/cancel-order` && handledResponse.status === 204) {
            let orderId = null;
            if (options?.body && typeof options?.body === 'string') {
                try {
                    const parsedBody = JSON.parse(options.body);
                    orderId = parsedBody.orderId;
                } catch (e) {
                    if (_verbose) console.error('Failed to parse request body:', e);
                }
            }
            return { success: true, orderId };
        }

        if (typeof handledResponse.json !== 'function') {
            throw new Error('Fetch response is not a valid json object');
        }

        return await handledResponse.json();
    } catch (err: any) {
        clearTimeout(timeoutId);
        if (!controller.signal.aborted) {
            controller.abort();
        }

        // Retry on GET method only
        if (options.method !== 'POST') {
            if (retries > _maxRetries) {
                throw new Error('Max retry timeout exceeded');
            }

            // Retry on specific types of errors
            const shouldRetry = retries < _maxRetries && _shouldRetry(err);

            if (shouldRetry) {
                // const delay = this._calculateBackoffDelay(retries);
                const delay = _calculateBackoffDelay(
                    retries,
                    _retryDelay,
                    _retryBackoff,
                    _maxRetries,
                    _retryCappedDelay
                )
                if (_verbose) console.warn(`Request failed ${retries}/${_maxRetries}, retrying in ${delay}ms...`, err.message);

                await _delay(delay);
                return _request(url, options, retries + 1);
            }
        }

        const error = _createError(`Fetch API error: ${err.error?.message || err.message || err}`,
            null,
            url,
            options,
            err
        );

        throw error;
    }
}

/**
 * Make an image API request
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Blob|Object>} Image blob or error object
 */
export async function _requestImage(url: string, options: any = {}, retries: number = 0): Promise<Blob | object> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        if (!controller.signal.aborted) {
            controller.abort();
        }
    }, _defaultTimeOut);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const handledResponse = await _handleResponse(response, url, options, _verbose);

        try {
            if (typeof handledResponse.blob !== 'function') {
                throw new Error('Fetch response is not a valid blob object');
            }
            return await handledResponse.blob();
        } catch (e: any) {
            const error = _createError(`Failed to process image response: ${e.message || e}`,
                response,
                url,
                options,
                e
            );
            throw error;
        }
    } catch (err: any) {
        clearTimeout(timeoutId);
        if (!controller.signal.aborted) {
            controller.abort();
        }
        // Retry logic
        const shouldRetry = retries < _maxRetries && _shouldRetry(err);

        if (shouldRetry) {
            // const delay = this._calculateBackoffDelay(retries);
            const delay = _calculateBackoffDelay(
                retries,
                _retryDelay,
                _retryBackoff,
                _maxRetries,
                _retryCappedDelay
            )
            if (_verbose) console.warn(`Image request failed ${retries}/${_maxRetries}, retrying in ${delay}ms...`, err.message);

            await _delay(delay);
            return _requestImage(url, options, retries + 1);
        }

        const error = _createError(`Fetch API image error: ${err.error?.message || err.message || err}`,
            null,
            url,
            options,
            err
        );
        throw error;
    }
}

/**
 * Sends a GET request to the specified URL with the given headers
 * @param {string} url - The API endpoint URL
 * @param {Object} headers - The headers to include in the request
 * @returns {Promise<Response>} The fetch response object
 */
export async function _get(url: string, headers: Headers): Promise<any> {
    return _request(url, {
        method: 'GET',
        headers: headers,
    });
}

/**
 * Sends a POST request to the specified URL with the given body and headers
 * @param {string} url - The API endpoint URL
 * @param {Object} headers - The headers to include in the request
 * @param {Object} body - The request body to send
 * @returns {Promise<Response>} The fetch response object
 */
export async function _post(url: string, headers: Headers, body: any): Promise<any> {
    return _request(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });
}

