/**
 * TypeScript Sideshift APIv2 SDK
 */

import {
    SideshiftAPIOptions,
} from './types/constructor';

import {
    PairData,
    RecentShiftData,
    XaiStatsData,
    AccountData,
} from './types/types';

import {
    ShiftData,
    QuoteData,
    FixedShiftData,
    VariableShiftData,
    RefundData,
    CheckoutData
} from './types/shifts';

import { _filterHeaders, DEFAULT_HEADERS, HEADER_WITH_TOKEN, HEADER_COMMISSION } from './utils/headers';
import { _validateString, _validateOptionalString, _validateNumber, _validateArray } from './utils/validationHelpers';
import { _handleResponse } from './utils/responseHandler';
import { _shouldRetry, _calculateBackoffDelay, _delay } from './utils/retries';
import { _errorMsg, _createError } from './utils/error';

export class SideshiftAPI {
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
        commissionRate = "0.5",
        verbose = false,
        retries = {}
    }: SideshiftAPIOptions) {
        /** Auth Configuration */
        if (!secret || typeof secret !== 'string' || !secret.trim()) {
            throw new Error(`SideShift API secret must be a non-empty string. Provided: ${secret}`);
        }
        if (!id || typeof id !== 'string' || !id.trim()) {
            throw new Error(`SIDESHIFT_ID must be a non-empty string. Provided: ${id}`);
        }

        // this.SIDESHIFT_\SECRET = secret;
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

            const handledResponse = await _handleResponse(response, url, options, this.verbose);

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
                const shouldRetry = retries < this.maxRetries && _shouldRetry(err);

                if (shouldRetry) {
                    // const delay = this._calculateBackoffDelay(retries);
                    const delay = _calculateBackoffDelay(
                        retries,
                        this.retryDelay,
                        this.retryBackoff,
                        this.maxRetries,
                        this.retryCappedDelay
                    )
                    if (this.verbose) console.warn(`Request failed ${retries}/${this.maxRetries}, retrying in ${delay}ms...`, err.message);

                    await _delay(delay);
                    return this._request(url, options, retries + 1);
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
            const handledResponse = await _handleResponse(response, url, options, this.verbose);

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
            const shouldRetry = retries < this.maxRetries && _shouldRetry(err);

            if (shouldRetry) {
                // const delay = this._calculateBackoffDelay(retries);
                const delay = _calculateBackoffDelay(
                    retries,
                    this.retryDelay,
                    this.retryBackoff,
                    this.maxRetries,
                    this.retryCappedDelay
                )
                if (this.verbose) console.warn(`Image request failed ${retries}/${this.maxRetries}, retrying in ${delay}ms...`, err.message);

                await _delay(delay);
                return this._requestImage(url, options, retries + 1);
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
     * Sends a POST request to the specified URL with the given body and headers
     * @private
     * @param {string} url - The API endpoint URL
     * @param {Object} headers - The headers to include in the request
     * @param {Object} body - The request body to send
     * @returns {Promise<Response>} The fetch response object
     */
    private async _post(url: string, headers: any, body: any): Promise<any> {
        return this._request(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
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
        _validateString(coin, "coin", "getCoinIcon");
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
     * @returns {Promise<PairData>} Pair data from API
     */
    async getPair(from: string, to: string, amount: number | null = null): Promise<PairData> {
        _validateString(from, "from", "getPair");
        _validateString(to, "to", "getPair");
        if (amount) _validateNumber(Number(amount), "amount", "getPair");

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
     * @returns {Promise<PairData[]>} Pair data from API
     */
    async getPairs(arrayOfCoins: string[]): Promise<PairData[]> {
        _validateArray(arrayOfCoins, "arrayOfCoins", "getPairs", "string");
        const queryParams = new URLSearchParams({
            pairs: arrayOfCoins.join(','), // 'btc-mainnet,usdc-bsc,bch,eth'
            affiliateId: this.SIDESHIFT_ID,
        });
        return this._request(`${this.BASE_URL}/pairs?${queryParams}`, this.requestHeaderCommission);
    }

    /**
     * Get shift by ID
     * @param {string} shiftId - Shift ID
     * @returns {Promise<ShiftData>} Shift data from API
     */
    async getShift(shiftId: string): Promise<ShiftData> {
        _validateString(shiftId, "shiftId", "getShift");
        return this._request(`${this.BASE_URL}/shifts/${shiftId}`, this.requestHeader);
    }

    /**
     * Get multiple shifts by IDs
     * @param {string[]} arrayOfIds - Array of shift IDs
     * @returns {Promise<ShiftData[]>} Bulk shifts data from API
     */
    async getBulkShifts(arrayOfIds: string[]): Promise<ShiftData[]> {
        _validateArray(arrayOfIds, "arrayOfIds", "getBulkShifts", "string");
        const queryParams = new URLSearchParams({
            ids: arrayOfIds.join(',') // 'f173118220f1461841da,dda3867168da23927b62'
        });
        return this._request(`${this.BASE_URL}/shifts?${queryParams}`, this.requestHeader);
    }

    /**
     * Get recent shifts
     * @param {number} [limit=10] - Number of results (1-100)
     * @returns {Promise<RecentShiftData[]>} Recent shifts data from API
     */
    async getRecentShifts(limit?: number): Promise<RecentShiftData[]> {
        if (limit) {
            const limitNumber = Number(limit);
            _validateNumber(limitNumber, "limit", "getRecentShifts");
            const clampedLimit = Math.min(Math.max(limitNumber || 10, 1), 100);
            const queryParams = new URLSearchParams({ limit: clampedLimit.toString() });
            return this._request(`${this.BASE_URL}/recent-shifts?${queryParams}`, this.requestHeader);
        } else {
            return this._request(`${this.BASE_URL}/recent-shifts`, this.requestHeader);
        }
    }

    /**
     * Get XAI statistics
     * @returns {Promise<XaiStatsData>} XAI stats data from API
     */
    async getXaiStats(): Promise<XaiStatsData> {
        return this._request(`${this.BASE_URL}/xai/stats`, this.requestHeader);
    }

    /**
     * Get your Sideshift account information
     * @returns {Promise<AccountData>} Account data from API
     */
    async getAccount(): Promise<AccountData> {
        return this._request(`${this.BASE_URL}/account`, this.requestHeaderWithToken);
    }

    /**
     * Get checkout information
     * @param {string} checkoutId - Checkout ID
     * @returns {Promise<CheckoutData>} Checkout data from API
     */
    async getCheckout(checkoutId: string): Promise<CheckoutData> {
        _validateString(checkoutId, "checkoutId", "getCheckout");
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
     * @returns {Promise<QuoteData>} Quote data from API
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
    }): Promise<QuoteData> {
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

        return await this._post(`${this.BASE_URL}/quotes`, this._getSpecialHeader(userIp), quoteBody);
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
    }): Promise<FixedShiftData> {
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

        return await this._post(`${this.BASE_URL}/shifts/fixed`, this._getSpecialHeader(userIp), fixedShiftBody);
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
    }): Promise<VariableShiftData> {
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

        return await this._post(`${this.BASE_URL}/shifts/variable`, this._getSpecialHeader(userIp), variableShiftBody);
    }


    /**
     * Set refund address for a shift
     * @param {Object} options - Configuration options
     * @param {string} options.shiftId - Shift ID
     * @param {string} options.refundAddress - Refund address
     * @param {string} [options.refundMemo] - Refund memo (optional)
     * @returns {Promise<RefundData>} Update result from API
     */
    async setRefundAddress({
        shiftId,
        refundAddress,
        refundMemo
    }: {
        shiftId: string;
        refundAddress: string;
        refundMemo?: string;
    }): Promise<RefundData> {
        _validateString(shiftId, "shiftId", "setRefundAddress");
        _validateString(refundAddress, "refundAddress", "setRefundAddress");
        _validateOptionalString(refundMemo, "refundMemo", "setRefundAddress");

        const bodyObj = {
            "address": refundAddress,
            ...(refundMemo && { "memo": refundMemo })
        };

        return await this._post(`${this.BASE_URL}/shifts/${shiftId}/set-refund-address`, this.HEADER_WITH_TOKEN, bodyObj);
    }

    /**
     * Cancel an order
     * @param {string} orderId - Order ID to cancel
     * @returns {Promise<Object>} Cancel result from API
     */
    async cancelOrder(orderId: string): Promise<object> {
        _validateString(orderId, "orderId", "cancelOrder");

        const bodyObj = {
            "orderId": orderId
        };

        return await this._post(`${this.BASE_URL}/cancel-order`, this.HEADER_WITH_TOKEN, bodyObj);
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
    }): Promise<CheckoutData> {
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

        return await this._post(`${this.BASE_URL}/checkout`, this._getSpecialHeader(userIp), checkoutBody);
    }
}

module.exports = SideshiftAPI;
