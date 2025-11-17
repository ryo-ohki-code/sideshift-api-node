'use strict';

/**
 * Filter API key from the log
 * @param {Object} headers - The headers object to filter
 * @returns {string} The filtered headers as a JSON string
 */
function _filterHeaders(headers) {
    if (!headers)
        return 'None';
    const filtered = { ...headers };
    const sensitiveKeys = ['x-sideshift-secret']; // Array, if need to add more filter
    for (const key of sensitiveKeys) {
        if (filtered[key]) {
            filtered[key] = '[FILTERED]';
        }
    }
    return JSON.stringify(filtered, null, 2);
}
const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
};
const HEADER_WITH_TOKEN = (secret) => ({
    ...DEFAULT_HEADERS,
    "x-sideshift-secret": secret
});
const HEADER_COMMISSION = (secret, commissionRate) => ({
    ...HEADER_WITH_TOKEN(secret),
    ...(commissionRate !== "0.5" && { commissionRate })
});

/**
 * Validate that a value is a non-empty string
 * @param {*} value - The value to validate
 * @param {string} paramName - The name of the parameter being validated
 * @param {string} functionName - The name of the function where validation occurred
 * @returns {string} The trimmed valid string value
 * @throws {Error} If the value is invalid
 */
function _validateString(value, paramName, functionName) {
    if (!value || typeof value !== 'string' || !value.trim()) {
        throw new Error(`Invalid ${paramName} in ${functionName}`);
    }
    return value.trim();
}
/**
 * Validate that a value is an optional string
 * @param {*} value - The value to validate
 * @param {string} paramName - The name of the parameter being validated
 * @param {string} functionName - The name of the function where validation occurred
 * @returns {string|null|undefined} The trimmed valid string value, or null/undefined if not provided
 * @throws {Error} If the value is provided but not a string
 */
function _validateOptionalString(value, paramName, functionName) {
    if (value && typeof value !== 'string') {
        throw new Error(`Error from ${functionName}: Missing or invalid ${paramName} parameter`);
    }
    if (value === null || value === undefined) {
        return value;
    }
    else {
        return value.trim();
    }
}
/**
 * Validate that a value is a non-negative finite number
 * @param {*} value - The value to validate
 * @param {string} paramName - The name of the parameter being validated
 * @param {string} functionName - The name of the function where validation occurred
 * @returns {number|null} The valid number value, or null if not provided
 * @throws {Error} If the value is invalid
 */
function _validateNumber(value, paramName, functionName) {
    if (value !== null && (typeof value !== 'number' || value < 0 || !Number.isFinite(value))) {
        throw new Error(`Error from ${functionName}: Missing or invalid ${paramName} parameter`);
    }
    return value;
}
/**
 * Validate that a value is a non-empty array with specified element type
 * @param {*} value - The value to validate
 * @param {string} paramName - The name of the parameter being validated
 * @param {string} functionName - The name of the function where validation occurred
 * @param {string} elementType - The expected type of array elements (default: 'string')
 * @returns {Array} The valid array value
 * @throws {Error} If the value is invalid
 */
function _validateArray(value, paramName, functionName, elementType = 'string') {
    if (!Array.isArray(value)) {
        throw new Error(`Error from ${functionName}: Missing or invalid ${paramName} parameter - must be an array`);
    }
    if (value.length === 0) {
        throw new Error(`Error from ${functionName}: Missing or invalid ${paramName} parameter - must be a non-empty array`);
    }
    _validateArrayElements(value, paramName, functionName, elementType);
    return value;
}
/**
 * Validate that all elements in an array are of the specified type
 * @param {Array} value - The array to validate
 * @param {string} paramName - The name of the parameter being validated
 * @param {string} functionName - The name of the function where validation occurred
 * @param {string} elementType - The expected type of array elements (default: 'string')
 * @returns {Array} The valid array value
 * @throws {Error} If any element is invalid
 */
function _validateArrayElements(value, paramName, functionName, elementType = 'string') {
    for (let i = 0; i < value.length; i++) {
        if (!value[i] || typeof value[i] !== elementType ||
            (elementType === 'string' && !value[i].trim())) {
            throw new Error(`Error from ${functionName}: Missing or invalid ${paramName}[${i}] parameter - each element must be a non-empty ${elementType}`);
        }
    }
    return value;
}

/**
 * Generate an error message for missing or invalid parameters
 * @private
 * @param {string} fieldName - The name of the field that caused the error
 * @param {string} source - The source where the error occurred
 * @returns {string} The formatted error message
 */
/**
 * Create a formatted error object
 * @param {string} message - Error message
 * @param {Response|null} response - Response object if available
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {any} errorData - Additional error data
 * @returns {Error} Formatted error object
 */
function _createError(message, response, url, options, errorData) {
    const error = new Error(message);
    // Add additional properties to the error for better debugging
    error.status = response?.status;
    error.statusText = response?.statusText;
    error.url = url;
    error.options = options;
    error.error = errorData;
    // optimized version
    // (error as any).response = response;
    // (error as any).url = url;
    // (error as any).options = options;
    // (error as any).errorData = errorData;
    return error;
}

/**
 * Handle the API request
 * @private
 * @param {Object} response - Fetch response object
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Resolves with the response object if successful
 * @throws {Error} Throws an error with HTTP status details and error data when response is not ok
 */
async function _handleResponse(response, url, options, verbose) {
    if (verbose) {
        console.log('\n=== DEBUG REQUEST ===');
        console.log('URL:', url);
        console.log('Method:', options?.method);
        console.log('Headers:', options?.headers ? _filterHeaders(options.headers) : 'None');
        console.log('Body:', options?.body ? typeof options.body === 'string' ? options.body : JSON.stringify(options.body, null, 2) : 'No body');
        console.log('=====================');
    }
    if (!response.ok) {
        let errorData = {};
        try {
            errorData = await response.json();
        }
        catch {
            try {
                errorData = await response.text();
            }
            catch {
                errorData = { message: 'Failed to parse error details' };
            }
        }
        const error = _createError(`HTTP ${response?.status} ${response?.statusText}`, response, url, options, errorData.error || errorData);
        throw error;
    }
    return response;
}

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
    const baseDelay = Math.pow(retryBackoff, retries) * retryDelay;
    const cappedBaseDelay = Math.min(baseDelay, retryCappedDelay);
    const jitter = Math.floor(Math.random() * cappedBaseDelay * 0.2);
    return cappedBaseDelay + jitter;
}
/**
 * Create a delay promise
 * @param {number} ms - The number of milliseconds to delay
 * @returns {Promise<void>} A promise that resolves after the specified delay
 */
function _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let _retryDelay;
let _retryBackoff;
let _retryCappedDelay;
let _maxRetries;
let _defaultTimeOut;
let _verbose;
let _BASE_URL;
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
function _updateRequestConfig(config) {
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
async function _request(url, options = {}, retries = 0) {
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
                }
                catch (e) {
                    if (_verbose)
                        console.error('Failed to parse request body:', e);
                }
            }
            return { success: true, orderId };
        }
        if (typeof handledResponse.json !== 'function') {
            throw new Error('Fetch response is not a valid json object');
        }
        return await handledResponse.json();
    }
    catch (err) {
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
                const delay = _calculateBackoffDelay(retries, _retryDelay, _retryBackoff, _maxRetries, _retryCappedDelay);
                if (_verbose)
                    console.warn(`Request failed ${retries}/${_maxRetries}, retrying in ${delay}ms...`, err.message);
                await _delay(delay);
                return _request(url, options, retries + 1);
            }
        }
        const error = _createError(`Fetch API error: ${err.error?.message || err.message || err}`, null, url, options, err);
        throw error;
    }
}
/**
 * Make an image API request
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Blob|Object>} Image blob or error object
 */
async function _requestImage(url, options = {}, retries = 0) {
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
        }
        catch (e) {
            const error = _createError(`Failed to process image response: ${e.message || e}`, response, url, options, e);
            throw error;
        }
    }
    catch (err) {
        clearTimeout(timeoutId);
        if (!controller.signal.aborted) {
            controller.abort();
        }
        // Retry logic
        const shouldRetry = retries < _maxRetries && _shouldRetry(err);
        if (shouldRetry) {
            // const delay = this._calculateBackoffDelay(retries);
            const delay = _calculateBackoffDelay(retries, _retryDelay, _retryBackoff, _maxRetries, _retryCappedDelay);
            if (_verbose)
                console.warn(`Image request failed ${retries}/${_maxRetries}, retrying in ${delay}ms...`, err.message);
            await _delay(delay);
            return _requestImage(url, options, retries + 1);
        }
        const error = _createError(`Fetch API image error: ${err.error?.message || err.message || err}`, null, url, options, err);
        throw error;
    }
}
/**
 * Sends a POST request to the specified URL with the given body and headers
 * @param {string} url - The API endpoint URL
 * @param {Object} headers - The headers to include in the request
 * @param {Object} body - The request body to send
 * @returns {Promise<Response>} The fetch response object
 */
async function _post(url, headers, body) {
    return _request(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
    });
}

/**
 * TypeScript Sideshift APIv2 SDK
 */
class SideshiftAPI {
    SIDESHIFT_ID;
    COMMISSION_RATE;
    maxRetries;
    retryDelay;
    retryBackoff;
    retryCappedDelay;
    verbose;
    defaultTimeOut;
    HEADER;
    HEADER_WITH_TOKEN;
    HEADER_COMMISSION;
    imageHeader;
    requestHeader;
    requestHeaderWithToken;
    requestHeaderCommission;
    BASE_URL;
    constructor({ secret, id, commissionRate = "0.5", verbose = false, retries = {} }) {
        /** Auth Configuration */
        if (!secret || typeof secret !== 'string' || !secret.trim()) {
            throw new Error(`SideShift API secret must be a non-empty string. Provided: ${secret}`);
        }
        if (!id || typeof id !== 'string' || !id.trim()) {
            throw new Error(`SIDESHIFT_ID must be a non-empty string. Provided: ${id}`);
        }
        /** this.SIDESHIFT_\SECRET = secret; */
        this.SIDESHIFT_ID = id;
        this.COMMISSION_RATE = String(commissionRate);
        /** Max retries configurations */
        this.maxRetries = retries.maxRetries ?? 5;
        this.retryDelay = retries.retryDelay ?? 2000; // 2 seconds
        this.retryBackoff = retries.retryBackoff ?? 2; // exponential backoff multiplier
        this.retryCappedDelay = retries.retryCappedDelay ?? 10000; // 10 seconds
        /** Verbose mode true/false */
        this.verbose = !!verbose;
        this.defaultTimeOut = 10000; // 10 seconds
        /** Header configurations */
        this.HEADER = DEFAULT_HEADERS;
        this.HEADER_WITH_TOKEN = HEADER_WITH_TOKEN(secret);
        this.HEADER_COMMISSION = HEADER_COMMISSION(secret, this.COMMISSION_RATE);
        this.imageHeader = {
            headers: { "Accept": "image/svg" },
            method: "GET"
        };
        this.requestHeader = {
            headers: this.HEADER,
            method: "GET"
        };
        this.requestHeaderWithToken = {
            headers: this.HEADER_WITH_TOKEN,
            method: "GET"
        };
        this.requestHeaderCommission = {
            headers: this.HEADER_COMMISSION,
            method: "GET"
        };
        /** Base URL */
        this.BASE_URL = "https://sideshift.ai/api/v2";
        /** Update the request utility with this instance's config */
        _updateRequestConfig({
            retryDelay: this.retryDelay,
            retryBackoff: this.retryBackoff,
            maxRetries: this.maxRetries,
            retryCappedDelay: this.retryCappedDelay,
            defaultTimeOut: this.defaultTimeOut,
            verbose: this.verbose,
            BASE_URL: this.BASE_URL
        });
    }
    /**
     * Get special headers with optional user IP
     * @private
     * @param {string|null|undefined} userIp - The user's IP address
     * @returns {Special_Header} The headers object with special headers and optional user IP
     */
    _getSpecialHeader(userIp) {
        return {
            ...this.HEADER_COMMISSION,
            ...(userIp && { "x-user-ip": userIp }),
            // ...(userIp !== null && userIp !== undefined && { "x-user-ip": userIp }),
        };
    }
    /** API functions - GET */
    /**
     * Get list of supported coins
     * @returns {Promise<Coins>} Coins data from API
     */
    async getCoins() {
        return _request(`${this.BASE_URL}/coins`, this.requestHeader);
    }
    /**
     * Get coin icon
     * @param {string} coin - Coin symbol
     * @returns {Promise<Blob|Object>} Image blob or error object
     */
    async getCoinIcon(coin) {
        _validateString(coin, "coin", "getCoinIcon");
        return _requestImage(`${this.BASE_URL}/coins/icon/${coin}`, this.imageHeader);
    }
    /**
     * Get permissions
     * @returns {Promise<Permissions>} Permissions data from API
     */
    async getPermissions() {
        return _request(`${this.BASE_URL}/permissions`, this.requestHeader);
    }
    /**
     * Get pair information
     * @param {string} from - From coin
     * @param {string} to - To coin
     * @param {number} amount - Deposit amout, Without specifying an amount, the system will assume a deposit value of 500 USD
     * @returns {Promise<PairData>} Pair data from API
     */
    async getPair(from, to, amount = null) {
        _validateString(from, "from", "getPair");
        _validateString(to, "to", "getPair");
        if (amount)
            _validateNumber(Number(amount), "amount", "getPair");
        const queryParams = new URLSearchParams();
        queryParams.append('affiliateId', this.SIDESHIFT_ID);
        if (amount) {
            queryParams.append('amount', Number(amount).toString());
        }
        return _request(`${this.BASE_URL}/pair/${from}/${to}/?${queryParams}`, this.requestHeaderCommission);
    }
    /**
     * Get multiple pairs
     * @param {string[]} arrayOfCoins - Array of coin: "name-network", "BNB-bsc" "BTC-mainnet"
     * @returns {Promise<PairData[]>} Pair data from API
     */
    async getPairs(arrayOfCoins) {
        _validateArray(arrayOfCoins, "arrayOfCoins", "getPairs", "string");
        const queryParams = new URLSearchParams({
            pairs: arrayOfCoins.join(','), // 'btc-mainnet,usdc-bsc,bch,eth'
            affiliateId: this.SIDESHIFT_ID,
        });
        return _request(`${this.BASE_URL}/pairs?${queryParams}`, this.requestHeaderCommission);
    }
    /**
     * Get shift by ID
     * @param {string} shiftId - Shift ID
     * @returns {Promise<ShiftData>} Shift data from API
     */
    async getShift(shiftId) {
        _validateString(shiftId, "shiftId", "getShift");
        return _request(`${this.BASE_URL}/shifts/${shiftId}`, this.requestHeader);
    }
    /**
     * Get multiple shifts by IDs
     * @param {string[]} arrayOfIds - Array of shift IDs
     * @returns {Promise<ShiftData[]>} Bulk shifts data from API
     */
    async getBulkShifts(arrayOfIds) {
        _validateArray(arrayOfIds, "arrayOfIds", "getBulkShifts", "string");
        const queryParams = new URLSearchParams({
            ids: arrayOfIds.join(',') // 'f173118220f1461841da,dda3867168da23927b62'
        });
        return _request(`${this.BASE_URL}/shifts?${queryParams}`, this.requestHeader);
    }
    /**
     * Get recent shifts
     * @param {number} [limit=10] - Number of results (1-100)
     * @returns {Promise<RecentShiftData[]>} Recent shifts data from API
     */
    async getRecentShifts(limit) {
        if (limit) {
            const limitNumber = Number(limit);
            _validateNumber(limitNumber, "limit", "getRecentShifts");
            const clampedLimit = Math.min(Math.max(limitNumber || 10, 1), 100);
            const queryParams = new URLSearchParams({ limit: clampedLimit.toString() });
            return _request(`${this.BASE_URL}/recent-shifts?${queryParams}`, this.requestHeader);
        }
        else {
            return _request(`${this.BASE_URL}/recent-shifts`, this.requestHeader);
        }
    }
    /**
     * Get XAI statistics
     * @returns {Promise<XaiStatsData>} XAI stats data from API
     */
    async getXaiStats() {
        return _request(`${this.BASE_URL}/xai/stats`, this.requestHeader);
    }
    /**
     * Get your Sideshift account information
     * @returns {Promise<AccountData>} Account data from API
     */
    async getAccount() {
        return _request(`${this.BASE_URL}/account`, this.requestHeaderWithToken);
    }
    /**
     * Get checkout information
     * @param {string} checkoutId - Checkout ID
     * @returns {Promise<CheckoutData>} Checkout data from API
     */
    async getCheckout(checkoutId) {
        _validateString(checkoutId, "checkoutId", "getCheckout");
        return _request(`${this.BASE_URL}/checkout/${checkoutId}`, this.requestHeaderWithToken);
    }
    /** API functions - POST */
    /**
     * Request a quote for a shift
     * @param {Object} options - Configuration options
     * @param {string} options.depositCoin - Deposit coin symbol
     * @param {string} options.depositNetwork - Deposit network
     * @param {string} options.settleCoin - Settle coin symbol
     * @param {string} options.settleNetwork - Settle network
     * @param {number} options.depositAmount - Deposit amount
     * @param {number} options.settleAmount - Settle amount
     * @param {string} [userIp] - User IP address (optional)
     * @returns {Promise<QuoteData>} Quote data from API
     */
    async requestQuote({ depositCoin, depositNetwork, settleCoin, settleNetwork, depositAmount, settleAmount, userIp }) {
        _validateString(depositCoin, "depositCoin", "requestQuote");
        _validateString(depositNetwork, "depositNetwork", "requestQuote");
        _validateString(settleCoin, "settleCoin", "requestQuote");
        _validateString(settleNetwork, "settleNetwork", "requestQuote");
        _validateNumber(depositAmount, "depositAmount", "requestQuote");
        _validateNumber(settleAmount, "settleAmount", "requestQuote");
        _validateOptionalString(userIp, "userIp", "requestQuote");
        const quoteBody = {
            depositCoin,
            depositNetwork,
            settleCoin,
            settleNetwork,
            depositAmount,
            settleAmount,
            "affiliateId": this.SIDESHIFT_ID
        };
        return await _post(`${this.BASE_URL}/quotes`, this._getSpecialHeader(userIp), quoteBody);
    }
    /**
     * Create a fixed shift
     * @param {Object} options - Configuration options
     * @param {string} options.settleAddress - Settle address
     * @param {string} options.quoteId - Quote ID
     * @param {string} [options.settleMemo] - Settle memo (optional)
     * @param {string} [options.refundAddress] - Refund address (optional)
     * @param {string} [options.refundMemo] - Refund memo (optional)
     * @param {string} [options.externalId] - Integrations own ID (optional)
     * @param {string} [userIp] - User IP address (optional)
     * @returns {Promise<FixedShiftData>} Created shift data from API
     */
    async createFixedShift({ settleAddress, quoteId, settleMemo, refundAddress, refundMemo, externalId, userIp }) {
        _validateString(settleAddress, "settleAddress", "createFixedShift");
        _validateString(quoteId, "quoteId", "createFixedShift");
        _validateOptionalString(settleMemo, "settleMemo", "createFixedShift");
        _validateOptionalString(refundAddress, "refundAddress", "createFixedShift");
        _validateOptionalString(refundMemo, "refundMemo", "createFixedShift");
        _validateOptionalString(externalId, "externalId", "createFixedShift");
        _validateOptionalString(userIp, "userIp", "createFixedShift");
        const fixedShiftBody = {
            settleAddress,
            affiliateId: this.SIDESHIFT_ID,
            quoteId,
            ...(settleMemo && { settleMemo }),
            ...(refundAddress && { refundAddress }),
            ...(refundMemo && { refundMemo }),
            ...(externalId && { externalId })
        };
        return await _post(`${this.BASE_URL}/shifts/fixed`, this._getSpecialHeader(userIp), fixedShiftBody);
    }
    /**
     * Create a variable shift
     * @param {Object} options - Configuration options
     * @param {string} options.settleAddress - Settle address
     * @param {string} options.settleCoin - Settle coin symbol
     * @param {string} options.settleNetwork - Settle network
     * @param {string} options.depositCoin - Deposit coin symbol
     * @param {string} options.depositNetwork - Deposit network
     * @param {string} [options.refundAddress] - Refund address (optional)
     * @param {string} [options.settleMemo] - Settle memo (optional)
     * @param {string} [options.refundMemo] - Refund memo (optional)
     * @param {string} [options.externalId] - Integrations own ID (optional)
     * @param {string} [userIp] - User IP address (optional)
     * @returns {Promise<VariableShiftData>} Created shift data from API
     */
    async createVariableShift({ settleAddress, settleCoin, settleNetwork, depositCoin, depositNetwork, refundAddress, settleMemo, refundMemo, externalId, userIp }) {
        _validateString(settleAddress, "settleAddress", "createVariableShift");
        _validateString(settleCoin, "settleCoin", "createVariableShift");
        _validateString(settleNetwork, "settleNetwork", "createVariableShift");
        _validateString(depositCoin, "depositCoin", "createVariableShift");
        _validateString(depositNetwork, "depositNetwork", "createVariableShift");
        _validateOptionalString(refundAddress, "refundAddress", "createVariableShift");
        _validateOptionalString(settleMemo, "settleMemo", "createVariableShift");
        _validateOptionalString(refundMemo, "refundMemo", "createVariableShift");
        _validateOptionalString(externalId, "externalId", "createVariableShift");
        _validateOptionalString(userIp, "userIp", "createVariableShift");
        const variableShiftBody = {
            settleAddress,
            settleCoin,
            settleNetwork,
            depositCoin,
            depositNetwork,
            affiliateId: this.SIDESHIFT_ID,
            ...(settleMemo && { settleMemo }),
            ...(refundAddress && { refundAddress }),
            ...(refundMemo && { refundMemo }),
            ...(externalId && { externalId })
        };
        return await _post(`${this.BASE_URL}/shifts/variable`, this._getSpecialHeader(userIp), variableShiftBody);
    }
    /**
     * Set refund address for a shift
     * @param {Object} options - Configuration options
     * @param {string} options.shiftId - Shift ID
     * @param {string} options.refundAddress - Refund address
     * @param {string} [options.refundMemo] - Refund memo (optional)
     * @returns {Promise<RefundData>} Update result from API
     */
    async setRefundAddress({ shiftId, refundAddress, refundMemo }) {
        _validateString(shiftId, "shiftId", "setRefundAddress");
        _validateString(refundAddress, "refundAddress", "setRefundAddress");
        _validateOptionalString(refundMemo, "refundMemo", "setRefundAddress");
        const bodyObj = {
            "address": refundAddress,
            ...(refundMemo && { "memo": refundMemo })
        };
        return await _post(`${this.BASE_URL}/shifts/${shiftId}/set-refund-address`, this.HEADER_WITH_TOKEN, bodyObj);
    }
    /**
     * Cancel an order
     * @param {string} orderId - Order ID to cancel
     * @returns {Promise<Object>} Cancel result from API
     */
    async cancelOrder(orderId) {
        _validateString(orderId, "orderId", "cancelOrder");
        const bodyObj = {
            "orderId": orderId
        };
        return await _post(`${this.BASE_URL}/cancel-order`, this.HEADER_WITH_TOKEN, bodyObj);
    }
    /**
    * Create a checkout
    * @param {Object} options - Configuration options
    * @param {string} options.settleCoin - Settle coin symbol
    * @param {string} options.settleNetwork - Settle network
    * @param {number} options.settleAmount - Settle amount
    * @param {string} options.settleAddress - Settle address
    * @param {string} options.successUrl - Success URL
    * @param {string} options.cancelUrl - Cancel URL
    * @param {string} [options.settleMemo] - Settle memo (optional)
    * @param {string} [userIp] - User IP address (optional)
    * @returns {Promise<CheckoutData>} Checkout data from API
    */
    async createCheckout({ settleCoin, settleNetwork, settleAmount, settleAddress, successUrl, cancelUrl, settleMemo, userIp }) {
        _validateString(settleCoin, "settleCoin", "createCheckout");
        _validateString(settleNetwork, "settleNetwork", "createCheckout");
        _validateNumber(settleAmount, "settleAmount", "createCheckout");
        _validateString(settleAddress, "settleAddress", "createCheckout");
        _validateString(successUrl, "successUrl", "createCheckout");
        _validateString(cancelUrl, "cancelUrl", "createCheckout");
        _validateOptionalString(settleMemo, "settleMemo", "createCheckout");
        _validateOptionalString(userIp, "userIp", "createCheckout");
        const checkoutBody = {
            settleCoin,
            settleNetwork,
            settleAmount,
            settleAddress,
            successUrl,
            cancelUrl,
            affiliateId: this.SIDESHIFT_ID,
            ...(settleMemo && { settleMemo })
        };
        return await _post(`${this.BASE_URL}/checkout`, this._getSpecialHeader(userIp), checkoutBody);
    }
}
module.exports = SideshiftAPI;

exports.SideshiftAPI = SideshiftAPI;
//# sourceMappingURL=index.cjs.map
