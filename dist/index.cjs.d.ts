/**
 * TypeScript Sideshift APIv2 SDK
 */
import { SideshiftAPIOptions } from './types/constructor';
import { Coins, Permissions, PairData, RecentShiftData, XaiStatsData, AccountData } from './types/types';
import { ShiftData, QuoteData, FixedShiftData, VariableShiftData, RefundData, CheckoutData } from './types/shifts-get';
import { RequestQuote, CreateFixedShift, CreateVariableShift, SetRefundAddress, CreateCheckout } from './types/shifts-post';
export declare class SideshiftAPI {
    private SIDESHIFT_ID;
    private COMMISSION_RATE;
    private maxRetries;
    private retryDelay;
    private retryBackoff;
    private retryCappedDelay;
    private verbose;
    private defaultTimeOut;
    private HEADER;
    private HEADER_WITH_TOKEN;
    private HEADER_COMMISSION;
    private imageHeader;
    private requestHeader;
    private requestHeaderWithToken;
    private requestHeaderCommission;
    private BASE_URL;
    constructor({ secret, id, commissionRate, verbose, retries }: SideshiftAPIOptions);
    /**
     * Get special headers with optional user IP
     * @private
     * @param {string|null|undefined} userIp - The user's IP address
     * @returns {Special_Header} The headers object with special headers and optional user IP
     */
    private _getSpecialHeader;
    /** API functions - GET */
    /**
     * Get list of supported coins
     * @returns {Promise<Coins>} Coins data from API
     */
    getCoins(): Promise<Coins>;
    /**
     * Get coin icon
     * @param {string} coin - Coin symbol
     * @returns {Promise<Blob|Object>} Image blob or error object
     */
    getCoinIcon(coin: string): Promise<Blob | Object>;
    /**
     * Get permissions
     * @returns {Promise<Permissions>} Permissions data from API
     */
    getPermissions(): Promise<Permissions>;
    /**
     * Get pair information
     * @param {string} from - From coin
     * @param {string} to - To coin
     * @param {number} amount - Deposit amout, Without specifying an amount, the system will assume a deposit value of 500 USD
     * @returns {Promise<PairData>} Pair data from API
     */
    getPair(from: string, to: string, amount?: number | null): Promise<PairData>;
    /**
     * Get multiple pairs
     * @param {string[]} arrayOfCoins - Array of coin: "name-network", "BNB-bsc" "BTC-mainnet"
     * @returns {Promise<PairData[]>} Pair data from API
     */
    getPairs(arrayOfCoins: string[]): Promise<PairData[]>;
    /**
     * Get shift by ID
     * @param {string} shiftId - Shift ID
     * @returns {Promise<ShiftData>} Shift data from API
     */
    getShift(shiftId: string): Promise<ShiftData>;
    /**
     * Get multiple shifts by IDs
     * @param {string[]} arrayOfIds - Array of shift IDs
     * @returns {Promise<ShiftData[]>} Bulk shifts data from API
     */
    getBulkShifts(arrayOfIds: string[]): Promise<ShiftData[]>;
    /**
     * Get recent shifts
     * @param {number} [limit=10] - Number of results (1-100)
     * @returns {Promise<RecentShiftData[]>} Recent shifts data from API
     */
    getRecentShifts(limit?: number): Promise<RecentShiftData[]>;
    /**
     * Get XAI statistics
     * @returns {Promise<XaiStatsData>} XAI stats data from API
     */
    getXaiStats(): Promise<XaiStatsData>;
    /**
     * Get your Sideshift account information
     * @returns {Promise<AccountData>} Account data from API
     */
    getAccount(): Promise<AccountData>;
    /**
     * Get checkout information
     * @param {string} checkoutId - Checkout ID
     * @returns {Promise<CheckoutData>} Checkout data from API
     */
    getCheckout(checkoutId: string): Promise<CheckoutData>;
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
    requestQuote({ depositCoin, depositNetwork, settleCoin, settleNetwork, depositAmount, settleAmount, userIp }: RequestQuote): Promise<QuoteData>;
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
    createFixedShift({ settleAddress, quoteId, settleMemo, refundAddress, refundMemo, externalId, userIp }: CreateFixedShift): Promise<FixedShiftData>;
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
    createVariableShift({ settleAddress, settleCoin, settleNetwork, depositCoin, depositNetwork, refundAddress, settleMemo, refundMemo, externalId, userIp }: CreateVariableShift): Promise<VariableShiftData>;
    /**
     * Set refund address for a shift
     * @param {Object} options - Configuration options
     * @param {string} options.shiftId - Shift ID
     * @param {string} options.refundAddress - Refund address
     * @param {string} [options.refundMemo] - Refund memo (optional)
     * @returns {Promise<RefundData>} Update result from API
     */
    setRefundAddress({ shiftId, refundAddress, refundMemo }: SetRefundAddress): Promise<RefundData>;
    /**
     * Cancel an order
     * @param {string} orderId - Order ID to cancel
     * @returns {Promise<Object>} Cancel result from API
     */
    cancelOrder(orderId: string): Promise<object>;
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
    createCheckout({ settleCoin, settleNetwork, settleAmount, settleAddress, successUrl, cancelUrl, settleMemo, userIp }: CreateCheckout): Promise<CheckoutData>;
}
//# sourceMappingURL=index.cjs.d.ts.map