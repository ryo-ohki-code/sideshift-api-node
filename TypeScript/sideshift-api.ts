/**
 * TypeScript Sideshift module - API v2
 */

interface SideshiftAPIOptions {
    secret: string;
    id: string;
    commisssionRate?: string;
    verbose?: boolean;
    retries?: {
        maxRetries?: number;
        retryDelay?: number;
        retryBackoff?: number;
        retryCappedDelay?: number;
    };
}

export class SideshiftAPI {
    private SIDESHIFT_SECRET: string;
    private SIDESHIFT_ID: string;
    private COMMISSION_RATE: string;

    private maxRetries: number;
    private retryDelay: number;
    private retryBackoff: number;
    private retryCappedDelay: number;

    private verbose: boolean;
    private defaultTimeOut: number;

    private HEADER: { "Content-Type": string };
    private HEADER_WITH_TOKEN: { "Content-Type": string; "x-sideshift-secret": string };
    private HEADER_COMMISSION: { "Content-Type": string; "x-sideshift-secret": string; commissionRate?: string };

    private imageHeader: { headers: { "Accept": "image/svg" }; method: "GET" };
    private requestHeader: { headers: { "Content-Type": string }; method: "GET" };
    private requestHeaderWithToken: { headers: { "Content-Type": string; "x-sideshift-secret": string }; method: "GET" };
    private requestHeaderCommission: { headers: { "Content-Type": string; "x-sideshift-secret": string; commissionRate?: string }; method: "GET" };

    private BASE_URL: string;

    constructor({
        secret,
        id,
        commisssionRate = "0.5",
        verbose = false,
        retries = {}
    }: SideshiftAPIOptions) {
        /** Auth Configuration */
        if (!secret || typeof secret !== 'string' || !secret.trim()) {
            throw new Error(`SIDESHIFT_SECRET must be a non-empty string. Provided: ${secret}`);
        }
        if (!id || typeof id !== 'string' || !id.trim()) {
            throw new Error(`SIDESHIFT_ID must be a non-empty string. Provided: ${id}`);
        }

        this.SIDESHIFT_SECRET = secret;
        this.SIDESHIFT_ID = id;
        this.COMMISSION_RATE = String(commisssionRate);

        /** Max retries configurations */
        this.maxRetries = retries.maxRetries || 5;
        this.retryDelay = retries.retryDelay || 2000; // 2 seconds
        this.retryBackoff = retries.retryBackoff || 2; // exponential backoff multiplier
        this.retryCappedDelay = retries.retryCappedDelay || 10000; // 10 seconds

        /** Verbose mode true/false */
        this.verbose = !!verbose;

        this.defaultTimeOut = 10000; // 10 seconds

        /** Header configurations */
        this.HEADER = {
            "Content-Type": "application/json",
        };

        this.HEADER_WITH_TOKEN = {
            ...this.HEADER,
            "x-sideshift-secret": this.SIDESHIFT_SECRET
        };

        this.HEADER_COMMISSION = {
            ...this.HEADER_WITH_TOKEN,
            ...(this.COMMISSION_RATE !== "0.5" && { commissionRate: this.COMMISSION_RATE }),
        };

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
    }

    /**
     * Filter API key from the log
     * @private
     * @param {Object} headers - The headers object to filter
     * @returns {string} The filtered headers as a JSON string
     */
    private _filterHeaders(headers: Record<string, any>): string {
        if (!headers) return 'None';

        const filtered = { ...headers };
        const sensitiveKeys = ['x-sideshift-secret']; // Array, if need to add more filter

        for (const key of sensitiveKeys) {
            if (filtered[key]) {
                filtered[key] = '[FILTERED]';
            }
        }

        return JSON.stringify(filtered, null, 2);
    }

    /**
     * Determines whether an error should be retried
     * @private
     * @param {Error} error - The error object to check
     * @returns {boolean} Whether the error should be retried
     */
    private _shouldRetry(error: any): boolean {
        if (!error) {
            return false;
        }

        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;

        // Retry on network-related issues
        if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('fetch')) {
            return true;
        }

        // Don't retry on client-side errors like invalid URLs or malformed data
        if (error.name === 'TypeError' || error.name === 'SyntaxError') {
            return false;
        }

        // Do not retry server-side errors >= 500 
        if (error.status && error.status >= 500) {
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
     * @private
     * @param {number} retries - The number of retries attempted
     * @returns {number} The calculated backoff delay in milliseconds
     */
    private _calculateBackoffDelay(retries: number): number {
        if (retries >= this.maxRetries) {
            return this.retryCappedDelay;
        }

        const baseDelay = Math.pow(this.retryBackoff, retries) * this.retryDelay;
        const cappedBaseDelay = Math.min(baseDelay, this.retryCappedDelay);
        const jitter = Math.floor(Math.random() * cappedBaseDelay * 0.2);
        return cappedBaseDelay + jitter;
    }

    /**
     * Create a delay promise
     * @private
     * @param {number} ms - The number of milliseconds to delay
     * @returns {Promise<void>} A promise that resolves after the specified delay
     */
    private _delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Set common error properties on an Error object
     * @private
     * @param {string} message - The error message
     * @param {Object} response - Fetch response object
     * @param {string} url - The API endpoint URL
     * @param {Object} options - Fetch options
     * @param {*} errorData - Error data
     * @returns {Error}
     */
    private _createError(message: string, response: any, url: string, options: any, errorData: any): Error {
        const error = new Error(message);
        (error as any).status = response?.status;
        (error as any).statusText = response?.statusText;
        (error as any).url = url;
        (error as any).options = options;
        (error as any).error = errorData;
        if (errorData?.stack) {
            error.stack = errorData.stack;
        }
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
    private async _handleResponse(response: Response, url: string, options: any): Promise<Response> {
        if (this.verbose) {
            console.log('\n=== DEBUG REQUEST ===');
            console.log('URL:', url);
            console.log('Method:', options?.method);
            console.log('Headers:', options?.headers ? this._filterHeaders(options.headers) : 'None');
            console.log('Body:', options?.body ? typeof options.body === 'string' ? options.body : JSON.stringify(options.body, null, 2) : 'No body');
            console.log('=====================');
        }
        if (!response.ok) {
            let errorData = {};

            try {
                errorData = await response.json() as any;
            } catch {
                try {
                    errorData = await response.text();
                } catch {
                    errorData = { message: 'Failed to parse error details' };
                }
            }

            const error = this._createError(`HTTP ${response?.status} ${response?.statusText}`,
                response,
                url,
                options,
                (errorData as any).error || errorData
            );

            throw error;
        }

        return response;
    }

    /**
     * Make an API request
     * @private
     * @param {string} url - The API endpoint URL
     * @param {Object} options - Fetch options
     * @param {Number} retries - Number of retry done
     * @returns {Promise<Object>} Response data or error object
     */
    private async _request(url: string, options: any = {}, retries: number = 0): Promise<any> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            if (!controller.signal.aborted) {
                controller.abort();
            }
        }, this.defaultTimeOut);

        try {
            if (!url || typeof url !== 'string') {
                throw new Error('Invalid URL provided');
            }

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const handledResponse = await this._handleResponse(response, url, options);

            if (url === `${this.BASE_URL}/cancel-order` && handledResponse.status === 204) {
                let orderId = null;
                if (options?.body && typeof options?.body === 'string') {
                    try {
                        const parsedBody = JSON.parse(options.body);
                        orderId = parsedBody.orderId;
                    } catch (e) {
                        if (this.verbose) console.error('Failed to parse request body:', e);
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
                if (retries > this.maxRetries) {
                    throw new Error('Max retry timeout exceeded');
                }

                // Retry on specific types of errors
                const shouldRetry = retries < this.maxRetries && this._shouldRetry(err);

                if (shouldRetry) {
                    const delay = this._calculateBackoffDelay(retries);

                    if (this.verbose) console.warn(`Request failed ${retries}/${this.maxRetries}, retrying in ${delay}ms...`, err.message);

                    await this._delay(delay);
                    return this._request(url, options, retries + 1);
                }
            }

            const error = this._createError(`Fetch API error: ${err.error?.message || err.message || err}`,
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
     * @private
     * @param {string} url - The API endpoint URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Blob|Object>} Image blob or error object
     */
    private async _requestImage(url: string, options: any = {}, retries: number = 0): Promise<Blob | object> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            if (!controller.signal.aborted) {
                controller.abort();
            }
        }, this.defaultTimeOut);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const handledResponse = await this._handleResponse(response, url, options);

            try {
                if (typeof handledResponse.blob !== 'function') {
                    throw new Error('Fetch response is not a valid blob object');
                }
                return await handledResponse.blob();
            } catch (e: any) {
                const error = this._createError(`Failed to process image response: ${e.message || e}`,
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
            const shouldRetry = retries < this.maxRetries && this._shouldRetry(err);

            if (shouldRetry) {
                const delay = this._calculateBackoffDelay(retries);

                if (this.verbose) console.warn(`Image request failed ${retries}/${this.maxRetries}, retrying in ${delay}ms...`, err.message);

                await this._delay(delay);
                return this._request(url, options, retries + 1);
            }

            const error = this._createError(`Fetch API image error: ${err.error?.message || err.message || err}`,
                null,
                url,
                options,
                err
            );
            throw error;
        }
    }


    /**
     * Generate an error message for missing or invalid parameters
     * @private
     * @param {string} fieldName - The name of the field that caused the error
     * @param {string} source - The source where the error occurred
     * @returns {string} The formatted error message
     */
    private _errorMsg(fieldName: string, source: string): string {
        const error = `Error from ${source}: Missing or invalid ${fieldName} parameter`;
        return error;
    }

    /**
     * Validate that a value is a non-empty string
     * @private
     * @param {*} value - The value to validate
     * @param {string} fieldName - The name of the field being validated
     * @param {string} source - The source where the validation occurred
     * @returns {string} The trimmed valid string value
     * @throws {Error} If the value is invalid
     */
    private _validateString(value: any, fieldName: string, source: string): string {
        if (!value || typeof value !== 'string' || !value.trim()) {
            throw new Error(this._errorMsg(fieldName, source));
        }
        return value.trim();
    }

    /**
     * Validate that a value is an optional string
     * @private
     * @param {*} value - The value to validate
     * @param {string} fieldName - The name of the field being validated
     * @param {string} source - The source where the validation occurred
     * @returns {string|null|undefined} The trimmed valid string value, or null/undefined if not provided
     * @throws {Error} If the value is provided but not a string
     */
    private _validateOptinalString(value: any, fieldName: string, source: string): string | null | undefined {
        if (value && typeof value !== 'string') {
            throw new Error(this._errorMsg(fieldName, source));
        }
        if (value === null || value === undefined) {
            return value;
        } else {
            return value.trim();
        }
    }

    /**
     * Validate that a value is a non-negative finite number
     * @private
     * @param {*} value - The value to validate
     * @param {string} fieldName - The name of the field being validated
     * @param {string} source - The source where the validation occurred
     * @returns {number|null} The valid number value, or null if not provided
     * @throws {Error} If the value is invalid
     */
    private _validateNumber(value: any, fieldName: string, source: string): number | null {
        if (value !== null && (typeof value !== 'number' || value < 0 || !Number.isFinite(value))) {
            throw new Error(this._errorMsg(fieldName, source));
        }
        return value;
    }

    /**
     * Validate that a value is a non-empty array with specified element type
     * @private
     * @param {*} value - The value to validate
     * @param {string} fieldName - The name of the field being validated
     * @param {string} source - The source where the validation occurred
     * @param {string} elementType - The expected type of array elements (default: 'string')
     * @returns {Array} The valid array value
     * @throws {Error} If the value is invalid
     */
    private _validateArray(value: any, fieldName: string, source: string, elementType: string = 'string'): Array<any> {
        if (!Array.isArray(value)) {
            throw new Error(`${this._errorMsg(fieldName, source)} - must be an array`);
        }

        if (value.length === 0) {
            throw new Error(`${this._errorMsg(fieldName, source)} - must be a non-empty array`);
        }

        this._validateArrayElements(value, fieldName, source, elementType);

        return value;
    }

    /**
     * Validate that all elements in an array are of the specified type
     * @private
     * @param {Array} value - The array to validate
     * @param {string} fieldName - The name of the field being validated
     * @param {string} source - The source where the validation occurred
     * @param {string} elementType - The expected type of array elements (default: 'string')
     * @returns {Array} The valid array value
     * @throws {Error} If any element is invalid
     */
    private _validateArrayElements(value: Array<any>, fieldName: string, source: string, elementType: string = 'string'): Array<any> {
        for (let i = 0; i < value.length; i++) {
            if (!value[i] || typeof value[i] !== elementType ||
                (elementType === 'string' && !value[i].trim())) {
                throw new Error(`${this._errorMsg(`${fieldName}[${i}]`, source)} - each element must be a non-empty ${elementType}`);
            }
        }
        return value;
    }

    /**
     * Get special headers with optional user IP
     * @private
     * @param {string|null|undefined} userIp - The user's IP address
     * @returns {Object} The headers object with special headers and optional user IP
     */
    private _getSpecialHeader(userIp: string | null | undefined): Object {
        return {
            ...this.HEADER_COMMISSION,
            ...(userIp && { "x-user-ip": userIp }),
            // ...(userIp !== null && userIp !== undefined && { "x-user-ip": userIp }),
        };
    }



    /** API functions - GET */
    /**
     * Get list of supported coins
     * @returns {Promise<Object>} Coins data from API
     */
    async getCoins(): Promise<object> {
        return this._request(`${this.BASE_URL}/coins`, this.requestHeader);
    }

    /**
     * Get coin icon
     * @param {string} coin - Coin symbol
     * @returns {Promise<Blob|Object>} Image blob or error object
     */
    async getCoinIcon(coin: string): Promise<Blob | object> {
        this._validateString(coin, "coin", "getCoinIcon");
        return this._requestImage(`${this.BASE_URL}/coins/icon/${coin}`, this.imageHeader);
    }

    /**
     * Get permissions
     * @returns {Promise<Object>} Permissions data from API
     */
    async getPermissions(): Promise<object> {
        return this._request(`${this.BASE_URL}/permissions`, this.requestHeader);
    }

    /**
     * Get pair information
     * @param {string} from - From coin
     * @param {string} to - To coin
     * @param {number} amount - Deposit amout, Without specifying an amount, the system will assume a deposit value of 500 USD
     * @returns {Promise<Object>} Pair data from API
     */
    async getPair(from: string, to: string, amount: number | null = null): Promise<object> {
        this._validateString(from, "from", "getPair");
        this._validateString(to, "to", "getPair");
        if (amount) this._validateNumber(Number(amount), "amount", "getPair");

        const queryParams = new URLSearchParams();
        queryParams.append('affiliateId', this.SIDESHIFT_ID);
        if (amount) {
            queryParams.append('amount', Number(amount).toString());
        }
        return this._request(`${this.BASE_URL}/pair/${from}/${to}/?${queryParams}`, this.requestHeaderCommission);
    }

    /**
     * Get multiple pairs
     * @param {string[]} arrayOfCoins - Array of coin: "name-network", "BNB-bsc" "BTC-mainnet"
     * @returns {Promise<Object>} Pairs data from API
     */
    async getPairs(arrayOfCoins: string[]) {
        this._validateArray(arrayOfCoins, "arrayOfCoins", "getPairs", "string");
        const queryParams = new URLSearchParams({
            pairs: arrayOfCoins.join(','), // 'btc-mainnet,usdc-bsc,bch,eth'
            affiliateId: this.SIDESHIFT_ID,
        });
        return this._request(`${this.BASE_URL}/pairs?${queryParams}`, this.requestHeaderCommission);
    }

    /**
     * Get shift by ID
     * @param {string} shiftId - Shift ID
     * @returns {Promise<Object>} Shift data from API
     */
    async getShift(shiftId: string) {
        this._validateString(shiftId, "shiftId", "getShift");
        return this._request(`${this.BASE_URL}/shifts/${shiftId}`, this.requestHeader);
    }

    /**
     * Get multiple shifts by IDs
     * @param {string[]} arrayOfIds - Array of shift IDs
     * @returns {Promise<Object>} Bulk shifts data from API
     */
    async getBulkShifts(arrayOfIds: string[]) {
        this._validateArray(arrayOfIds, "arrayOfIds", "getBulkShifts", "string");
        const queryParams = new URLSearchParams({
            ids: arrayOfIds.join(',') // 'f173118220f1461841da,dda3867168da23927b62'
        });
        return this._request(`${this.BASE_URL}/shifts?${queryParams}`, this.requestHeader);
    }

    /**
     * Get recent shifts
     * @param {number} [limit=10] - Number of results (1-100)
     * @returns {Promise<Object>} Recent shifts data from API
     */
    async getRecentShifts(limit?: number): Promise<object> {
        if (limit) {
            const limitNumber = Number(limit);
            this._validateNumber(limitNumber, "limit", "getRecentShifts");
            const clampedLimit = Math.min(Math.max(limitNumber || 10, 1), 100);
            const queryParams = new URLSearchParams({ clampedLimit: clampedLimit.toString() });
            return this._request(`${this.BASE_URL}/recent-shifts?${queryParams}`, this.requestHeader);
        } else {
            return this._request(`${this.BASE_URL}/recent-shifts`, this.requestHeader);
        }
    }

    /**
     * Get XAI statistics
     * @returns {Promise<Object>} XAI stats data from API
     */
    async getXaiStats(): Promise<object> {
        return this._request(`${this.BASE_URL}/xai/stats`, this.requestHeader);
    }

    /**
     * Get your Sideshift account information
     * @returns {Promise<Object>} Account data from API
     */
    async getAccount(): Promise<object> {
        return this._request(`${this.BASE_URL}/account`, this.requestHeaderWithToken);
    }

    /**
     * Get checkout information
     * @param {string} checkoutId - Checkout ID
     * @returns {Promise<Object>} Checkout data from API
     */
    async getCheckout(checkoutId: string): Promise<object> {
        this._validateString(checkoutId, "checkoutId", "getCheckout");
        return this._request(`${this.BASE_URL}/checkout/${checkoutId}`, this.requestHeaderWithToken);
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
     * @returns {Promise<Object>} Quote data from API
     */
    async requestQuote({
        depositCoin,
        depositNetwork,
        settleCoin,
        settleNetwork,
        depositAmount,
        settleAmount,
        userIp
    }: {
        depositCoin: string;
        depositNetwork: string;
        settleCoin: string;
        settleNetwork: string;
        depositAmount: number;
        settleAmount: number;
        userIp?: string;
    }): Promise<object> {
        this._validateString(depositCoin, "depositCoin", "requestQuote");
        this._validateString(depositNetwork, "depositNetwork", "requestQuote");
        this._validateString(settleCoin, "settleCoin", "requestQuote");
        this._validateString(settleNetwork, "settleNetwork", "requestQuote");
        this._validateNumber(depositAmount, "depositAmount", "requestQuote");
        this._validateNumber(settleAmount, "settleAmount", "requestQuote");
        this._validateOptinalString(userIp, "userIp", "requestQuote");
        const quoteBody = {
            "depositCoin": depositCoin,
            "depositNetwork": depositNetwork,
            "settleCoin": settleCoin,
            "settleNetwork": settleNetwork,
            "depositAmount": depositAmount,
            "settleAmount": settleAmount,
            "affiliateId": this.SIDESHIFT_ID
        };

        return this._request(`${this.BASE_URL}/quotes`, {
            headers: this._getSpecialHeader(userIp),
            body: JSON.stringify(quoteBody),
            method: "POST"
        });
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
     * @returns {Promise<Object>} Created shift data from API
     */
    async createFixedShift({
        settleAddress,
        quoteId,
        settleMemo,
        refundAddress,
        refundMemo,
        externalId,
        userIp
    }: {
        settleAddress: string;
        quoteId: string;
        settleMemo?: string;
        refundAddress?: string;
        refundMemo?: string;
        externalId?: string; // <-- Added this line
        userIp?: string;
    }): Promise<object> {
        this._validateString(settleAddress, "settleAddress", "createFixedShift");
        this._validateString(quoteId, "quoteId", "createFixedShift");
        this._validateOptinalString(settleMemo, "settleMemo", "createFixedShift");
        this._validateOptinalString(refundAddress, "refundAddress", "createFixedShift");
        this._validateOptinalString(refundMemo, "refundMemo", "createFixedShift");
        this._validateOptinalString(externalId, "externalId", "createFixedShift");
        this._validateOptinalString(userIp, "userIp", "createFixedShift");

        const fixedShiftBody = {
            settleAddress,
            affiliateId: this.SIDESHIFT_ID,
            quoteId,
            ...(settleMemo && { settleMemo }),
            ...(refundAddress && { refundAddress }),
            ...(refundMemo && { refundMemo }),
            ...(externalId && { externalId }),
        };

        return this._request(`${this.BASE_URL}/shifts/fixed`, {
            headers: this._getSpecialHeader(userIp),
            body: JSON.stringify(fixedShiftBody),
            method: "POST"
        });
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
     * @returns {Promise<Object>} Created shift data from API
     */
    async createVariableShift({
        settleAddress,
        settleCoin,
        settleNetwork,
        depositCoin,
        depositNetwork,
        refundAddress,
        settleMemo,
        refundMemo,
        externalId,
        userIp
    }: {
        settleAddress: string;
        settleCoin: string;
        settleNetwork: string;
        depositCoin: string;
        depositNetwork: string;
        refundAddress?: string;
        settleMemo?: string;
        refundMemo?: string;
        externalId?: string; // <-- Added this line
        userIp?: string;
    }): Promise<object> {
        this._validateString(settleAddress, "settleAddress", "createVariableShift");
        this._validateString(settleCoin, "settleCoin", "createVariableShift");
        this._validateString(settleNetwork, "settleNetwork", "createVariableShift");
        this._validateString(depositCoin, "depositCoin", "createVariableShift");
        this._validateString(depositNetwork, "depositNetwork", "createVariableShift");
        this._validateOptinalString(refundAddress, "refundAddress", "createVariableShift");
        this._validateOptinalString(settleMemo, "settleMemo", "createVariableShift");
        this._validateOptinalString(refundMemo, "refundMemo", "createVariableShift");
        this._validateOptinalString(externalId, "externalId", "createVariableShift");
        this._validateOptinalString(userIp, "userIp", "createVariableShift");

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
            ...(externalId && { externalId }),
        };

        return this._request(`${this.BASE_URL}/shifts/variable`, {
            headers: this._getSpecialHeader(userIp),
            body: JSON.stringify(variableShiftBody),
            method: "POST"
        });
    }


    /**
     * Set refund address for a shift
     * @param {Object} options - Configuration options
     * @param {string} options.shiftId - Shift ID
     * @param {string} options.refundAddress - Refund address
     * @param {string} [options.refundMemo] - Refund memo (optional)
     * @returns {Promise<Object>} Update result from API
     */
    async setRefundAddress({
        shiftId,
        refundAddress,
        refundMemo
    }: {
        shiftId: string;
        refundAddress: string;
        refundMemo?: string;
    }): Promise<object> {
        this._validateString(shiftId, "shiftId", "setRefundAddress");
        this._validateString(refundAddress, "refundAddress", "setRefundAddress");
        this._validateOptinalString(refundMemo, "refundMemo", "setRefundAddress");

        const bodyObj = {
            "address": refundAddress,
            ...(refundMemo && { "memo": refundMemo })
        };

        return this._request(`${this.BASE_URL}/shifts/${shiftId}/set-refund-address`, {
            headers: this.HEADER_WITH_TOKEN,
            body: JSON.stringify(bodyObj),
            method: "POST"
        });
    }

    /**
     * Cancel an order
     * @param {string} orderId - Order ID to cancel
     * @returns {Promise<Object>} Cancel result from API
     */
    async cancelOrder(orderId: string): Promise<object> {
        this._validateString(orderId, "orderId", "cancelOrder");

        const bodyObj = {
            "orderId": orderId
        };

        return this._request(`${this.BASE_URL}/cancel-order`, {
            headers: this.HEADER_WITH_TOKEN,
            body: JSON.stringify(bodyObj),
            method: "POST"
        });
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
    * @returns {Promise<Object>} Checkout data from API
    */
    async createCheckout({
        settleCoin,
        settleNetwork,
        settleAmount,
        settleAddress,
        successUrl,
        cancelUrl,
        settleMemo,
        userIp
    }: {
        settleCoin: string;
        settleNetwork: string;
        settleAmount: number;
        settleAddress: string;
        successUrl: string;
        cancelUrl: string;
        settleMemo?: string;
        userIp?: string;
    }): Promise<object> {
        this._validateString(settleCoin, "settleCoin", "createVariableShift");
        this._validateString(settleNetwork, "settleNetwork", "createVariableShift");
        this._validateNumber(settleAmount, "settleAmount", "createVariableShift");
        this._validateString(settleAddress, "settleAddress", "createVariableShift");
        this._validateString(successUrl, "successUrl", "createVariableShift");
        this._validateString(cancelUrl, "cancelUrl", "createVariableShift");
        this._validateOptinalString(settleMemo, "settleMemo", "createVariableShift");
        this._validateOptinalString(userIp, "userIp", "createVariableShift");

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

        return this._request(`${this.BASE_URL}/checkout`, {
            headers: this._getSpecialHeader(userIp),
            body: JSON.stringify(checkoutBody),
            method: "POST"
        });
    }
}

module.exports = SideshiftAPI;
