"use strict";
/**
 * TypeScript Sideshift APIv2 SDK
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SideshiftAPI = void 0;
var headers_1 = require("./utils/headers");
var validationHelpers_1 = require("./utils/validationHelpers");
var request_1 = require("./utils/request");
var SideshiftAPI = /** @class */ (function () {
    function SideshiftAPI(_a) {
        var secret = _a.secret, id = _a.id, _b = _a.commissionRate, commissionRate = _b === void 0 ? "0.5" : _b, _c = _a.verbose, verbose = _c === void 0 ? false : _c, _d = _a.retries, retries = _d === void 0 ? {} : _d;
        var _e, _f, _g, _h;
        /** Auth Configuration */
        if (!secret || typeof secret !== 'string' || !secret.trim()) {
            throw new Error("SideShift API secret must be a non-empty string. Provided: ".concat(secret));
        }
        if (!id || typeof id !== 'string' || !id.trim()) {
            throw new Error("SIDESHIFT_ID must be a non-empty string. Provided: ".concat(id));
        }
        /** this.SIDESHIFT_\SECRET = secret; */
        this.SIDESHIFT_ID = id;
        this.COMMISSION_RATE = String(commissionRate);
        /** Max retries configurations */
        this.maxRetries = (_e = retries.maxRetries) !== null && _e !== void 0 ? _e : 5;
        this.retryDelay = (_f = retries.retryDelay) !== null && _f !== void 0 ? _f : 2000; // 2 seconds
        this.retryBackoff = (_g = retries.retryBackoff) !== null && _g !== void 0 ? _g : 2; // exponential backoff multiplier
        this.retryCappedDelay = (_h = retries.retryCappedDelay) !== null && _h !== void 0 ? _h : 10000; // 10 seconds
        /** Verbose mode true/false */
        this.verbose = !!verbose;
        this.defaultTimeOut = 10000; // 10 seconds
        /** Header configurations */
        this.HEADER = headers_1.DEFAULT_HEADERS;
        this.HEADER_WITH_TOKEN = (0, headers_1.HEADER_WITH_TOKEN)(secret);
        this.HEADER_COMMISSION = (0, headers_1.HEADER_COMMISSION)(secret, this.COMMISSION_RATE);
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
        (0, request_1._updateRequestConfig)({
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
     * @returns {Object} The headers object with special headers and optional user IP
     */
    SideshiftAPI.prototype._getSpecialHeader = function (userIp) {
        return __assign(__assign({}, this.HEADER_COMMISSION), (userIp && { "x-user-ip": userIp }));
    };
    /** API functions - GET */
    /**
     * Get list of supported coins
     * @returns {Promise<Object>} Coins data from API
     */
    SideshiftAPI.prototype.getCoins = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, request_1._request)("".concat(this.BASE_URL, "/coins"), this.requestHeader)];
            });
        });
    };
    /**
     * Get coin icon
     * @param {string} coin - Coin symbol
     * @returns {Promise<Blob|Object>} Image blob or error object
     */
    SideshiftAPI.prototype.getCoinIcon = function (coin) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                (0, validationHelpers_1._validateString)(coin, "coin", "getCoinIcon");
                return [2 /*return*/, (0, request_1._requestImage)("".concat(this.BASE_URL, "/coins/icon/").concat(coin), this.imageHeader)];
            });
        });
    };
    /**
     * Get permissions
     * @returns {Promise<Object>} Permissions data from API
     */
    SideshiftAPI.prototype.getPermissions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, request_1._request)("".concat(this.BASE_URL, "/permissions"), this.requestHeader)];
            });
        });
    };
    /**
     * Get pair information
     * @param {string} from - From coin
     * @param {string} to - To coin
     * @param {number} amount - Deposit amout, Without specifying an amount, the system will assume a deposit value of 500 USD
     * @returns {Promise<PairData>} Pair data from API
     */
    SideshiftAPI.prototype.getPair = function (from_1, to_1) {
        return __awaiter(this, arguments, void 0, function (from, to, amount) {
            var queryParams;
            if (amount === void 0) { amount = null; }
            return __generator(this, function (_a) {
                (0, validationHelpers_1._validateString)(from, "from", "getPair");
                (0, validationHelpers_1._validateString)(to, "to", "getPair");
                if (amount)
                    (0, validationHelpers_1._validateNumber)(Number(amount), "amount", "getPair");
                queryParams = new URLSearchParams();
                queryParams.append('affiliateId', this.SIDESHIFT_ID);
                if (amount) {
                    queryParams.append('amount', Number(amount).toString());
                }
                return [2 /*return*/, (0, request_1._request)("".concat(this.BASE_URL, "/pair/").concat(from, "/").concat(to, "/?").concat(queryParams), this.requestHeaderCommission)];
            });
        });
    };
    /**
     * Get multiple pairs
     * @param {string[]} arrayOfCoins - Array of coin: "name-network", "BNB-bsc" "BTC-mainnet"
     * @returns {Promise<PairData[]>} Pair data from API
     */
    SideshiftAPI.prototype.getPairs = function (arrayOfCoins) {
        return __awaiter(this, void 0, void 0, function () {
            var queryParams;
            return __generator(this, function (_a) {
                (0, validationHelpers_1._validateArray)(arrayOfCoins, "arrayOfCoins", "getPairs", "string");
                queryParams = new URLSearchParams({
                    pairs: arrayOfCoins.join(','), // 'btc-mainnet,usdc-bsc,bch,eth'
                    affiliateId: this.SIDESHIFT_ID,
                });
                return [2 /*return*/, (0, request_1._request)("".concat(this.BASE_URL, "/pairs?").concat(queryParams), this.requestHeaderCommission)];
            });
        });
    };
    /**
     * Get shift by ID
     * @param {string} shiftId - Shift ID
     * @returns {Promise<ShiftData>} Shift data from API
     */
    SideshiftAPI.prototype.getShift = function (shiftId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                (0, validationHelpers_1._validateString)(shiftId, "shiftId", "getShift");
                return [2 /*return*/, (0, request_1._request)("".concat(this.BASE_URL, "/shifts/").concat(shiftId), this.requestHeader)];
            });
        });
    };
    /**
     * Get multiple shifts by IDs
     * @param {string[]} arrayOfIds - Array of shift IDs
     * @returns {Promise<ShiftData[]>} Bulk shifts data from API
     */
    SideshiftAPI.prototype.getBulkShifts = function (arrayOfIds) {
        return __awaiter(this, void 0, void 0, function () {
            var queryParams;
            return __generator(this, function (_a) {
                (0, validationHelpers_1._validateArray)(arrayOfIds, "arrayOfIds", "getBulkShifts", "string");
                queryParams = new URLSearchParams({
                    ids: arrayOfIds.join(',') // 'f173118220f1461841da,dda3867168da23927b62'
                });
                return [2 /*return*/, (0, request_1._request)("".concat(this.BASE_URL, "/shifts?").concat(queryParams), this.requestHeader)];
            });
        });
    };
    /**
     * Get recent shifts
     * @param {number} [limit=10] - Number of results (1-100)
     * @returns {Promise<RecentShiftData[]>} Recent shifts data from API
     */
    SideshiftAPI.prototype.getRecentShifts = function (limit) {
        return __awaiter(this, void 0, void 0, function () {
            var limitNumber, clampedLimit, queryParams;
            return __generator(this, function (_a) {
                if (limit) {
                    limitNumber = Number(limit);
                    (0, validationHelpers_1._validateNumber)(limitNumber, "limit", "getRecentShifts");
                    clampedLimit = Math.min(Math.max(limitNumber || 10, 1), 100);
                    queryParams = new URLSearchParams({ limit: clampedLimit.toString() });
                    return [2 /*return*/, (0, request_1._request)("".concat(this.BASE_URL, "/recent-shifts?").concat(queryParams), this.requestHeader)];
                }
                else {
                    return [2 /*return*/, (0, request_1._request)("".concat(this.BASE_URL, "/recent-shifts"), this.requestHeader)];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get XAI statistics
     * @returns {Promise<XaiStatsData>} XAI stats data from API
     */
    SideshiftAPI.prototype.getXaiStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, request_1._request)("".concat(this.BASE_URL, "/xai/stats"), this.requestHeader)];
            });
        });
    };
    /**
     * Get your Sideshift account information
     * @returns {Promise<AccountData>} Account data from API
     */
    SideshiftAPI.prototype.getAccount = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, request_1._request)("".concat(this.BASE_URL, "/account"), this.requestHeaderWithToken)];
            });
        });
    };
    /**
     * Get checkout information
     * @param {string} checkoutId - Checkout ID
     * @returns {Promise<CheckoutData>} Checkout data from API
     */
    SideshiftAPI.prototype.getCheckout = function (checkoutId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                (0, validationHelpers_1._validateString)(checkoutId, "checkoutId", "getCheckout");
                return [2 /*return*/, (0, request_1._request)("".concat(this.BASE_URL, "/checkout/").concat(checkoutId), this.requestHeaderWithToken)];
            });
        });
    };
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
    SideshiftAPI.prototype.requestQuote = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var quoteBody;
            var depositCoin = _b.depositCoin, depositNetwork = _b.depositNetwork, settleCoin = _b.settleCoin, settleNetwork = _b.settleNetwork, depositAmount = _b.depositAmount, settleAmount = _b.settleAmount, userIp = _b.userIp;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        (0, validationHelpers_1._validateString)(depositCoin, "depositCoin", "requestQuote");
                        (0, validationHelpers_1._validateString)(depositNetwork, "depositNetwork", "requestQuote");
                        (0, validationHelpers_1._validateString)(settleCoin, "settleCoin", "requestQuote");
                        (0, validationHelpers_1._validateString)(settleNetwork, "settleNetwork", "requestQuote");
                        (0, validationHelpers_1._validateNumber)(depositAmount, "depositAmount", "requestQuote");
                        (0, validationHelpers_1._validateNumber)(settleAmount, "settleAmount", "requestQuote");
                        (0, validationHelpers_1._validateOptionalString)(userIp, "userIp", "requestQuote");
                        quoteBody = {
                            depositCoin: depositCoin,
                            depositNetwork: depositNetwork,
                            settleCoin: settleCoin,
                            settleNetwork: settleNetwork,
                            depositAmount: depositAmount,
                            settleAmount: settleAmount,
                            "affiliateId": this.SIDESHIFT_ID
                        };
                        return [4 /*yield*/, (0, request_1._post)("".concat(this.BASE_URL, "/quotes"), this._getSpecialHeader(userIp), quoteBody)];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        });
    };
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
    SideshiftAPI.prototype.createFixedShift = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var fixedShiftBody;
            var settleAddress = _b.settleAddress, quoteId = _b.quoteId, settleMemo = _b.settleMemo, refundAddress = _b.refundAddress, refundMemo = _b.refundMemo, externalId = _b.externalId, userIp = _b.userIp;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        (0, validationHelpers_1._validateString)(settleAddress, "settleAddress", "createFixedShift");
                        (0, validationHelpers_1._validateString)(quoteId, "quoteId", "createFixedShift");
                        (0, validationHelpers_1._validateOptionalString)(settleMemo, "settleMemo", "createFixedShift");
                        (0, validationHelpers_1._validateOptionalString)(refundAddress, "refundAddress", "createFixedShift");
                        (0, validationHelpers_1._validateOptionalString)(refundMemo, "refundMemo", "createFixedShift");
                        (0, validationHelpers_1._validateOptionalString)(externalId, "externalId", "createFixedShift");
                        (0, validationHelpers_1._validateOptionalString)(userIp, "userIp", "createFixedShift");
                        fixedShiftBody = __assign(__assign(__assign(__assign({ settleAddress: settleAddress, affiliateId: this.SIDESHIFT_ID, quoteId: quoteId }, (settleMemo && { settleMemo: settleMemo })), (refundAddress && { refundAddress: refundAddress })), (refundMemo && { refundMemo: refundMemo })), (externalId && { externalId: externalId }));
                        return [4 /*yield*/, (0, request_1._post)("".concat(this.BASE_URL, "/shifts/fixed"), this._getSpecialHeader(userIp), fixedShiftBody)];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        });
    };
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
    SideshiftAPI.prototype.createVariableShift = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var variableShiftBody;
            var settleAddress = _b.settleAddress, settleCoin = _b.settleCoin, settleNetwork = _b.settleNetwork, depositCoin = _b.depositCoin, depositNetwork = _b.depositNetwork, refundAddress = _b.refundAddress, settleMemo = _b.settleMemo, refundMemo = _b.refundMemo, externalId = _b.externalId, userIp = _b.userIp;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        (0, validationHelpers_1._validateString)(settleAddress, "settleAddress", "createVariableShift");
                        (0, validationHelpers_1._validateString)(settleCoin, "settleCoin", "createVariableShift");
                        (0, validationHelpers_1._validateString)(settleNetwork, "settleNetwork", "createVariableShift");
                        (0, validationHelpers_1._validateString)(depositCoin, "depositCoin", "createVariableShift");
                        (0, validationHelpers_1._validateString)(depositNetwork, "depositNetwork", "createVariableShift");
                        (0, validationHelpers_1._validateOptionalString)(refundAddress, "refundAddress", "createVariableShift");
                        (0, validationHelpers_1._validateOptionalString)(settleMemo, "settleMemo", "createVariableShift");
                        (0, validationHelpers_1._validateOptionalString)(refundMemo, "refundMemo", "createVariableShift");
                        (0, validationHelpers_1._validateOptionalString)(externalId, "externalId", "createVariableShift");
                        (0, validationHelpers_1._validateOptionalString)(userIp, "userIp", "createVariableShift");
                        variableShiftBody = __assign(__assign(__assign(__assign({ settleAddress: settleAddress, settleCoin: settleCoin, settleNetwork: settleNetwork, depositCoin: depositCoin, depositNetwork: depositNetwork, affiliateId: this.SIDESHIFT_ID }, (settleMemo && { settleMemo: settleMemo })), (refundAddress && { refundAddress: refundAddress })), (refundMemo && { refundMemo: refundMemo })), (externalId && { externalId: externalId }));
                        return [4 /*yield*/, (0, request_1._post)("".concat(this.BASE_URL, "/shifts/variable"), this._getSpecialHeader(userIp), variableShiftBody)];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        });
    };
    /**
     * Set refund address for a shift
     * @param {Object} options - Configuration options
     * @param {string} options.shiftId - Shift ID
     * @param {string} options.refundAddress - Refund address
     * @param {string} [options.refundMemo] - Refund memo (optional)
     * @returns {Promise<RefundData>} Update result from API
     */
    SideshiftAPI.prototype.setRefundAddress = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var bodyObj;
            var shiftId = _b.shiftId, refundAddress = _b.refundAddress, refundMemo = _b.refundMemo;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        (0, validationHelpers_1._validateString)(shiftId, "shiftId", "setRefundAddress");
                        (0, validationHelpers_1._validateString)(refundAddress, "refundAddress", "setRefundAddress");
                        (0, validationHelpers_1._validateOptionalString)(refundMemo, "refundMemo", "setRefundAddress");
                        bodyObj = __assign({ "address": refundAddress }, (refundMemo && { "memo": refundMemo }));
                        return [4 /*yield*/, (0, request_1._post)("".concat(this.BASE_URL, "/shifts/").concat(shiftId, "/set-refund-address"), this.HEADER_WITH_TOKEN, bodyObj)];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        });
    };
    /**
     * Cancel an order
     * @param {string} orderId - Order ID to cancel
     * @returns {Promise<Object>} Cancel result from API
     */
    SideshiftAPI.prototype.cancelOrder = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            var bodyObj;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        (0, validationHelpers_1._validateString)(orderId, "orderId", "cancelOrder");
                        bodyObj = {
                            "orderId": orderId
                        };
                        return [4 /*yield*/, (0, request_1._post)("".concat(this.BASE_URL, "/cancel-order"), this.HEADER_WITH_TOKEN, bodyObj)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
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
    SideshiftAPI.prototype.createCheckout = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var checkoutBody;
            var settleCoin = _b.settleCoin, settleNetwork = _b.settleNetwork, settleAmount = _b.settleAmount, settleAddress = _b.settleAddress, successUrl = _b.successUrl, cancelUrl = _b.cancelUrl, settleMemo = _b.settleMemo, userIp = _b.userIp;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        (0, validationHelpers_1._validateString)(settleCoin, "settleCoin", "createCheckout");
                        (0, validationHelpers_1._validateString)(settleNetwork, "settleNetwork", "createCheckout");
                        (0, validationHelpers_1._validateNumber)(settleAmount, "settleAmount", "createCheckout");
                        (0, validationHelpers_1._validateString)(settleAddress, "settleAddress", "createCheckout");
                        (0, validationHelpers_1._validateString)(successUrl, "successUrl", "createCheckout");
                        (0, validationHelpers_1._validateString)(cancelUrl, "cancelUrl", "createCheckout");
                        (0, validationHelpers_1._validateOptionalString)(settleMemo, "settleMemo", "createCheckout");
                        (0, validationHelpers_1._validateOptionalString)(userIp, "userIp", "createCheckout");
                        checkoutBody = __assign({ settleCoin: settleCoin, settleNetwork: settleNetwork, settleAmount: settleAmount, settleAddress: settleAddress, successUrl: successUrl, cancelUrl: cancelUrl, affiliateId: this.SIDESHIFT_ID }, (settleMemo && { settleMemo: settleMemo }));
                        return [4 /*yield*/, (0, request_1._post)("".concat(this.BASE_URL, "/checkout"), this._getSpecialHeader(userIp), checkoutBody)];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        });
    };
    return SideshiftAPI;
}());
exports.SideshiftAPI = SideshiftAPI;
module.exports = SideshiftAPI;
