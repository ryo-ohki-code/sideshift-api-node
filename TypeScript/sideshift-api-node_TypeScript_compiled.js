"use strict";
/**
 * TypeScript Sideshift module - API v2
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
var SideshiftAPI = /** @class */ (function () {
    function SideshiftAPI(_a) {
        var secret = _a.secret, id = _a.id, _b = _a.commisssionRate, commisssionRate = _b === void 0 ? "0.5" : _b, _c = _a.verbose, verbose = _c === void 0 ? false : _c, _d = _a.retries, retries = _d === void 0 ? {} : _d;
        /** Auth Configuration */
        if (!secret || typeof secret !== 'string' || !secret.trim()) {
            throw new Error("SIDESHIFT_SECRET must be a non-empty string. Provided: ".concat(secret));
        }
        if (!id || typeof id !== 'string' || !id.trim()) {
            throw new Error("SIDESHIFT_ID must be a non-empty string. Provided: ".concat(id));
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
        this.HEADER_WITH_TOKEN = __assign(__assign({}, this.HEADER), { "x-sideshift-secret": this.SIDESHIFT_SECRET });
        this.HEADER_COMMISSION = __assign(__assign({}, this.HEADER_WITH_TOKEN), (this.COMMISSION_RATE !== "0.5" && { commissionRate: this.COMMISSION_RATE }));
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
    SideshiftAPI.prototype._filterHeaders = function (headers) {
        if (!headers)
            return 'None';
        var filtered = __assign({}, headers);
        var sensitiveKeys = ['x-sideshift-secret']; // Array, if need to add more filter
        for (var _i = 0, sensitiveKeys_1 = sensitiveKeys; _i < sensitiveKeys_1.length; _i++) {
            var key = sensitiveKeys_1[_i];
            if (filtered[key]) {
                filtered[key] = '[FILTERED]';
            }
        }
        return JSON.stringify(filtered, null, 2);
    };
    /**
     * Determines whether an error should be retried
     * @private
     * @param {Error} error - The error object to check
     * @returns {boolean} Whether the error should be retried
     */
    SideshiftAPI.prototype._shouldRetry = function (error) {
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
    };
    /**
     * Calculate backoff delay for retries
     * @private
     * @param {number} retries - The number of retries attempted
     * @returns {number} The calculated backoff delay in milliseconds
     */
    SideshiftAPI.prototype._calculateBackoffDelay = function (retries) {
        if (retries >= this.maxRetries) {
            return this.retryCappedDelay;
        }
        var baseDelay = Math.pow(this.retryBackoff, retries) * this.retryDelay;
        var cappedBaseDelay = Math.min(baseDelay, this.retryCappedDelay);
        var jitter = Math.floor(Math.random() * cappedBaseDelay * 0.2);
        return cappedBaseDelay + jitter;
    };
    /**
     * Create a delay promise
     * @private
     * @param {number} ms - The number of milliseconds to delay
     * @returns {Promise<void>} A promise that resolves after the specified delay
     */
    SideshiftAPI.prototype._delay = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
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
    SideshiftAPI.prototype._createError = function (message, response, url, options, errorData) {
        var error = new Error(message);
        error.status = response === null || response === void 0 ? void 0 : response.status;
        error.statusText = response === null || response === void 0 ? void 0 : response.statusText;
        error.url = url;
        error.options = options;
        error.error = errorData;
        if (errorData === null || errorData === void 0 ? void 0 : errorData.stack) {
            error.stack = errorData.stack;
        }
        return error;
    };
    /**
     * Handle the API request
     * @private
     * @param {Object} response - Fetch response object
     * @param {string} url - The API endpoint URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} Resolves with the response object if successful
     * @throws {Error} Throws an error with HTTP status details and error data when response is not ok
     */
    SideshiftAPI.prototype._handleResponse = function (response, url, options) {
        return __awaiter(this, void 0, void 0, function () {
            var errorData, _a, _b, error;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (this.verbose) {
                            console.log('\n=== DEBUG REQUEST ===');
                            console.log('URL:', url);
                            console.log('Method:', options === null || options === void 0 ? void 0 : options.method);
                            console.log('Headers:', (options === null || options === void 0 ? void 0 : options.headers) ? this._filterHeaders(options.headers) : 'None');
                            console.log('Body:', (options === null || options === void 0 ? void 0 : options.body) ? typeof options.body === 'string' ? options.body : JSON.stringify(options.body, null, 2) : 'No body');
                            console.log('=====================');
                        }
                        if (!!response.ok) return [3 /*break*/, 9];
                        errorData = {};
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 8]);
                        return [4 /*yield*/, response.json()];
                    case 2:
                        errorData = (_c.sent());
                        return [3 /*break*/, 8];
                    case 3:
                        _a = _c.sent();
                        _c.label = 4;
                    case 4:
                        _c.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, response.text()];
                    case 5:
                        errorData = _c.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        _b = _c.sent();
                        errorData = { message: 'Failed to parse error details' };
                        return [3 /*break*/, 7];
                    case 7: return [3 /*break*/, 8];
                    case 8:
                        error = this._createError("HTTP ".concat(response === null || response === void 0 ? void 0 : response.status, " ").concat(response === null || response === void 0 ? void 0 : response.statusText), response, url, options, errorData.error || errorData);
                        throw error;
                    case 9: return [2 /*return*/, response];
                }
            });
        });
    };
    /**
     * Make an API request
     * @private
     * @param {string} url - The API endpoint URL
     * @param {Object} options - Fetch options
     * @param {Number} retries - Number of retry done
     * @returns {Promise<Object>} Response data or error object
     */
    SideshiftAPI.prototype._request = function (url_1) {
        return __awaiter(this, arguments, void 0, function (url, options, retries) {
            var controller, timeoutId, response, handledResponse, orderId, parsedBody, err_1, shouldRetry, delay, error;
            var _a;
            if (options === void 0) { options = {}; }
            if (retries === void 0) { retries = 0; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        controller = new AbortController();
                        timeoutId = setTimeout(function () {
                            if (!controller.signal.aborted) {
                                controller.abort();
                            }
                        }, this.defaultTimeOut);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 5, , 8]);
                        if (!url || typeof url !== 'string') {
                            throw new Error('Invalid URL provided');
                        }
                        return [4 /*yield*/, fetch(url, __assign(__assign({}, options), { signal: controller.signal }))];
                    case 2:
                        response = _b.sent();
                        clearTimeout(timeoutId);
                        return [4 /*yield*/, this._handleResponse(response, url, options)];
                    case 3:
                        handledResponse = _b.sent();
                        if (url === "".concat(this.BASE_URL, "/cancel-order") && handledResponse.status === 204) {
                            orderId = null;
                            if ((options === null || options === void 0 ? void 0 : options.body) && typeof (options === null || options === void 0 ? void 0 : options.body) === 'string') {
                                try {
                                    parsedBody = JSON.parse(options.body);
                                    orderId = parsedBody.orderId;
                                }
                                catch (e) {
                                    if (this.verbose)
                                        console.error('Failed to parse request body:', e);
                                }
                            }
                            return [2 /*return*/, { success: true, orderId: orderId }];
                        }
                        if (typeof handledResponse.json !== 'function') {
                            throw new Error('Fetch response is not a valid json object');
                        }
                        return [4 /*yield*/, handledResponse.json()];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5:
                        err_1 = _b.sent();
                        clearTimeout(timeoutId);
                        if (!controller.signal.aborted) {
                            controller.abort();
                        }
                        if (!(options.method !== 'POST')) return [3 /*break*/, 7];
                        if (retries > this.maxRetries) {
                            throw new Error('Max retry timeout exceeded');
                        }
                        shouldRetry = retries < this.maxRetries && this._shouldRetry(err_1);
                        if (!shouldRetry) return [3 /*break*/, 7];
                        delay = this._calculateBackoffDelay(retries);
                        if (this.verbose)
                            console.warn("Request failed ".concat(retries, "/").concat(this.maxRetries, ", retrying in ").concat(delay, "ms..."), err_1.message);
                        return [4 /*yield*/, this._delay(delay)];
                    case 6:
                        _b.sent();
                        return [2 /*return*/, this._request(url, options, retries + 1)];
                    case 7:
                        error = this._createError("Fetch API error: ".concat(((_a = err_1.error) === null || _a === void 0 ? void 0 : _a.message) || err_1.message || err_1), null, url, options, err_1);
                        throw error;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Make an image API request
     * @private
     * @param {string} url - The API endpoint URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Blob|Object>} Image blob or error object
     */
    SideshiftAPI.prototype._requestImage = function (url_1) {
        return __awaiter(this, arguments, void 0, function (url, options, retries) {
            var controller, timeoutId, response, handledResponse, e_1, error, err_2, shouldRetry, delay, error;
            var _a;
            if (options === void 0) { options = {}; }
            if (retries === void 0) { retries = 0; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        controller = new AbortController();
                        timeoutId = setTimeout(function () {
                            if (!controller.signal.aborted) {
                                controller.abort();
                            }
                        }, this.defaultTimeOut);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 8, , 11]);
                        return [4 /*yield*/, fetch(url, __assign(__assign({}, options), { signal: controller.signal }))];
                    case 2:
                        response = _b.sent();
                        clearTimeout(timeoutId);
                        return [4 /*yield*/, this._handleResponse(response, url, options)];
                    case 3:
                        handledResponse = _b.sent();
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 7]);
                        if (typeof handledResponse.blob !== 'function') {
                            throw new Error('Fetch response is not a valid blob object');
                        }
                        return [4 /*yield*/, handledResponse.blob()];
                    case 5: return [2 /*return*/, _b.sent()];
                    case 6:
                        e_1 = _b.sent();
                        error = this._createError("Failed to process image response: ".concat(e_1.message || e_1), response, url, options, e_1);
                        throw error;
                    case 7: return [3 /*break*/, 11];
                    case 8:
                        err_2 = _b.sent();
                        clearTimeout(timeoutId);
                        if (!controller.signal.aborted) {
                            controller.abort();
                        }
                        shouldRetry = retries < this.maxRetries && this._shouldRetry(err_2);
                        if (!shouldRetry) return [3 /*break*/, 10];
                        delay = this._calculateBackoffDelay(retries);
                        if (this.verbose)
                            console.warn("Image request failed ".concat(retries, "/").concat(this.maxRetries, ", retrying in ").concat(delay, "ms..."), err_2.message);
                        return [4 /*yield*/, this._delay(delay)];
                    case 9:
                        _b.sent();
                        return [2 /*return*/, this._request(url, options, retries + 1)];
                    case 10:
                        error = this._createError("Fetch API image error: ".concat(((_a = err_2.error) === null || _a === void 0 ? void 0 : _a.message) || err_2.message || err_2), null, url, options, err_2);
                        throw error;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate an error message for missing or invalid parameters
     * @private
     * @param {string} fieldName - The name of the field that caused the error
     * @param {string} source - The source where the error occurred
     * @returns {string} The formatted error message
     */
    SideshiftAPI.prototype._errorMsg = function (fieldName, source) {
        var error = "Error from ".concat(source, ": Missing or invalid ").concat(fieldName, " parameter");
        return error;
    };
    /**
     * Validate that a value is a non-empty string
     * @private
     * @param {*} value - The value to validate
     * @param {string} fieldName - The name of the field being validated
     * @param {string} source - The source where the validation occurred
     * @returns {string} The trimmed valid string value
     * @throws {Error} If the value is invalid
     */
    SideshiftAPI.prototype._validateString = function (value, fieldName, source) {
        if (!value || typeof value !== 'string' || !value.trim()) {
            throw new Error(this._errorMsg(fieldName, source));
        }
        return value.trim();
    };
    /**
     * Validate that a value is an optional string
     * @private
     * @param {*} value - The value to validate
     * @param {string} fieldName - The name of the field being validated
     * @param {string} source - The source where the validation occurred
     * @returns {string|null|undefined} The trimmed valid string value, or null/undefined if not provided
     * @throws {Error} If the value is provided but not a string
     */
    SideshiftAPI.prototype._validateOptinalString = function (value, fieldName, source) {
        if (value && typeof value !== 'string') {
            throw new Error(this._errorMsg(fieldName, source));
        }
        if (value === null || value === undefined) {
            return value;
        }
        else {
            return value.trim();
        }
    };
    /**
     * Validate that a value is a non-negative finite number
     * @private
     * @param {*} value - The value to validate
     * @param {string} fieldName - The name of the field being validated
     * @param {string} source - The source where the validation occurred
     * @returns {number|null} The valid number value, or null if not provided
     * @throws {Error} If the value is invalid
     */
    SideshiftAPI.prototype._validateNumber = function (value, fieldName, source) {
        if (value !== null && (typeof value !== 'number' || value < 0 || !Number.isFinite(value))) {
            throw new Error(this._errorMsg(fieldName, source));
        }
        return value;
    };
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
    SideshiftAPI.prototype._validateArray = function (value, fieldName, source, elementType) {
        if (elementType === void 0) { elementType = 'string'; }
        if (!Array.isArray(value)) {
            throw new Error("".concat(this._errorMsg(fieldName, source), " - must be an array"));
        }
        if (value.length === 0) {
            throw new Error("".concat(this._errorMsg(fieldName, source), " - must be a non-empty array"));
        }
        this._validateArrayElements(value, fieldName, source, elementType);
        return value;
    };
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
    SideshiftAPI.prototype._validateArrayElements = function (value, fieldName, source, elementType) {
        if (elementType === void 0) { elementType = 'string'; }
        for (var i = 0; i < value.length; i++) {
            if (!value[i] || typeof value[i] !== elementType ||
                (elementType === 'string' && !value[i].trim())) {
                throw new Error("".concat(this._errorMsg("".concat(fieldName, "[").concat(i, "]"), source), " - each element must be a non-empty ").concat(elementType));
            }
        }
        return value;
    };
    /**
     * Get special headers with optional user IP
     * @private
     * @param {string|null|undefined} userIp - The user's IP address
     * @returns {Object} The headers object with special headers and optional user IP
     */
    SideshiftAPI.prototype._getSpecialHeader = function (userIp) {
        return __assign(__assign({}, this.HEADER_COMMISSION), (userIp && { "x-user-ip": userIp }));
    };
    /**
     * Sends a POST request to the specified URL with the given body and headers
     * @private
     * @param {string} url - The API endpoint URL
     * @param {Object} headers - The headers to include in the request
     * @param {Object} body - The request body to send
     * @returns {Promise<Response>} The fetch response object
     */
    SideshiftAPI.prototype._post = function (url, headers, body) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._request(url, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(body)
                    })];
            });
        });
    };
    /** API functions - GET */
    /**
     * Get list of supported coins
     * @returns {Promise<Object>} Coins data from API
     */
    SideshiftAPI.prototype.getCoins = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._request("".concat(this.BASE_URL, "/coins"), this.requestHeader)];
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
                this._validateString(coin, "coin", "getCoinIcon");
                return [2 /*return*/, this._requestImage("".concat(this.BASE_URL, "/coins/icon/").concat(coin), this.imageHeader)];
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
                return [2 /*return*/, this._request("".concat(this.BASE_URL, "/permissions"), this.requestHeader)];
            });
        });
    };
    /**
     * Get pair information
     * @param {string} from - From coin
     * @param {string} to - To coin
     * @param {number} amount - Deposit amout, Without specifying an amount, the system will assume a deposit value of 500 USD
     * @returns {Promise<Object>} Pair data from API
     */
    SideshiftAPI.prototype.getPair = function (from_1, to_1) {
        return __awaiter(this, arguments, void 0, function (from, to, amount) {
            var queryParams;
            if (amount === void 0) { amount = null; }
            return __generator(this, function (_a) {
                this._validateString(from, "from", "getPair");
                this._validateString(to, "to", "getPair");
                if (amount)
                    this._validateNumber(Number(amount), "amount", "getPair");
                queryParams = new URLSearchParams();
                queryParams.append('affiliateId', this.SIDESHIFT_ID);
                if (amount) {
                    queryParams.append('amount', Number(amount).toString());
                }
                return [2 /*return*/, this._request("".concat(this.BASE_URL, "/pair/").concat(from, "/").concat(to, "/?").concat(queryParams), this.requestHeaderCommission)];
            });
        });
    };
    /**
     * Get multiple pairs
     * @param {string[]} arrayOfCoins - Array of coin: "name-network", "BNB-bsc" "BTC-mainnet"
     * @returns {Promise<Object>} Pairs data from API
     */
    SideshiftAPI.prototype.getPairs = function (arrayOfCoins) {
        return __awaiter(this, void 0, void 0, function () {
            var queryParams;
            return __generator(this, function (_a) {
                this._validateArray(arrayOfCoins, "arrayOfCoins", "getPairs", "string");
                queryParams = new URLSearchParams({
                    pairs: arrayOfCoins.join(','), // 'btc-mainnet,usdc-bsc,bch,eth'
                    affiliateId: this.SIDESHIFT_ID,
                });
                return [2 /*return*/, this._request("".concat(this.BASE_URL, "/pairs?").concat(queryParams), this.requestHeaderCommission)];
            });
        });
    };
    /**
     * Get shift by ID
     * @param {string} shiftId - Shift ID
     * @returns {Promise<Object>} Shift data from API
     */
    SideshiftAPI.prototype.getShift = function (shiftId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this._validateString(shiftId, "shiftId", "getShift");
                return [2 /*return*/, this._request("".concat(this.BASE_URL, "/shifts/").concat(shiftId), this.requestHeader)];
            });
        });
    };
    /**
     * Get multiple shifts by IDs
     * @param {string[]} arrayOfIds - Array of shift IDs
     * @returns {Promise<Object>} Bulk shifts data from API
     */
    SideshiftAPI.prototype.getBulkShifts = function (arrayOfIds) {
        return __awaiter(this, void 0, void 0, function () {
            var queryParams;
            return __generator(this, function (_a) {
                this._validateArray(arrayOfIds, "arrayOfIds", "getBulkShifts", "string");
                queryParams = new URLSearchParams({
                    ids: arrayOfIds.join(',') // 'f173118220f1461841da,dda3867168da23927b62'
                });
                return [2 /*return*/, this._request("".concat(this.BASE_URL, "/shifts?").concat(queryParams), this.requestHeader)];
            });
        });
    };
    /**
     * Get recent shifts
     * @param {number} [limit=10] - Number of results (1-100)
     * @returns {Promise<Object>} Recent shifts data from API
     */
    SideshiftAPI.prototype.getRecentShifts = function (limit) {
        return __awaiter(this, void 0, void 0, function () {
            var limitNumber, clampedLimit, queryParams;
            return __generator(this, function (_a) {
                if (limit) {
                    limitNumber = Number(limit);
                    this._validateNumber(limitNumber, "limit", "getRecentShifts");
                    clampedLimit = Math.min(Math.max(limitNumber || 10, 1), 100);
                    queryParams = new URLSearchParams({ limit: clampedLimit.toString() });
                    return [2 /*return*/, this._request("".concat(this.BASE_URL, "/recent-shifts?").concat(queryParams), this.requestHeader)];
                }
                else {
                    return [2 /*return*/, this._request("".concat(this.BASE_URL, "/recent-shifts"), this.requestHeader)];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get XAI statistics
     * @returns {Promise<Object>} XAI stats data from API
     */
    SideshiftAPI.prototype.getXaiStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._request("".concat(this.BASE_URL, "/xai/stats"), this.requestHeader)];
            });
        });
    };
    /**
     * Get your Sideshift account information
     * @returns {Promise<Object>} Account data from API
     */
    SideshiftAPI.prototype.getAccount = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this._request("".concat(this.BASE_URL, "/account"), this.requestHeaderWithToken)];
            });
        });
    };
    /**
     * Get checkout information
     * @param {string} checkoutId - Checkout ID
     * @returns {Promise<Object>} Checkout data from API
     */
    SideshiftAPI.prototype.getCheckout = function (checkoutId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this._validateString(checkoutId, "checkoutId", "getCheckout");
                return [2 /*return*/, this._request("".concat(this.BASE_URL, "/checkout/").concat(checkoutId), this.requestHeaderWithToken)];
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
     * @returns {Promise<Object>} Quote data from API
     */
    SideshiftAPI.prototype.requestQuote = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var quoteBody;
            var depositCoin = _b.depositCoin, depositNetwork = _b.depositNetwork, settleCoin = _b.settleCoin, settleNetwork = _b.settleNetwork, depositAmount = _b.depositAmount, settleAmount = _b.settleAmount, userIp = _b.userIp;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this._validateString(depositCoin, "depositCoin", "requestQuote");
                        this._validateString(depositNetwork, "depositNetwork", "requestQuote");
                        this._validateString(settleCoin, "settleCoin", "requestQuote");
                        this._validateString(settleNetwork, "settleNetwork", "requestQuote");
                        this._validateNumber(depositAmount, "depositAmount", "requestQuote");
                        this._validateNumber(settleAmount, "settleAmount", "requestQuote");
                        this._validateOptinalString(userIp, "userIp", "requestQuote");
                        quoteBody = {
                            "depositCoin": depositCoin,
                            "depositNetwork": depositNetwork,
                            "settleCoin": settleCoin,
                            "settleNetwork": settleNetwork,
                            "depositAmount": depositAmount,
                            "settleAmount": settleAmount,
                            "affiliateId": this.SIDESHIFT_ID
                        };
                        return [4 /*yield*/, this._post("".concat(this.BASE_URL, "/quotes"), this._getSpecialHeader(userIp), quoteBody)];
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
     * @returns {Promise<Object>} Created shift data from API
     */
    SideshiftAPI.prototype.createFixedShift = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var fixedShiftBody;
            var settleAddress = _b.settleAddress, quoteId = _b.quoteId, settleMemo = _b.settleMemo, refundAddress = _b.refundAddress, refundMemo = _b.refundMemo, externalId = _b.externalId, userIp = _b.userIp;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this._validateString(settleAddress, "settleAddress", "createFixedShift");
                        this._validateString(quoteId, "quoteId", "createFixedShift");
                        this._validateOptinalString(settleMemo, "settleMemo", "createFixedShift");
                        this._validateOptinalString(refundAddress, "refundAddress", "createFixedShift");
                        this._validateOptinalString(refundMemo, "refundMemo", "createFixedShift");
                        this._validateOptinalString(externalId, "externalId", "createFixedShift");
                        this._validateOptinalString(userIp, "userIp", "createFixedShift");
                        fixedShiftBody = __assign(__assign(__assign(__assign({ settleAddress: settleAddress, affiliateId: this.SIDESHIFT_ID, quoteId: quoteId }, (settleMemo && { settleMemo: settleMemo })), (refundAddress && { refundAddress: refundAddress })), (refundMemo && { refundMemo: refundMemo })), (externalId && { externalId: externalId }));
                        return [4 /*yield*/, this._post("".concat(this.BASE_URL, "/shifts/fixed"), this._getSpecialHeader(userIp), fixedShiftBody)];
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
     * @returns {Promise<Object>} Created shift data from API
     */
    SideshiftAPI.prototype.createVariableShift = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var variableShiftBody;
            var settleAddress = _b.settleAddress, settleCoin = _b.settleCoin, settleNetwork = _b.settleNetwork, depositCoin = _b.depositCoin, depositNetwork = _b.depositNetwork, refundAddress = _b.refundAddress, settleMemo = _b.settleMemo, refundMemo = _b.refundMemo, externalId = _b.externalId, userIp = _b.userIp;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
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
                        variableShiftBody = __assign(__assign(__assign(__assign({ settleAddress: settleAddress, settleCoin: settleCoin, settleNetwork: settleNetwork, depositCoin: depositCoin, depositNetwork: depositNetwork, affiliateId: this.SIDESHIFT_ID }, (settleMemo && { settleMemo: settleMemo })), (refundAddress && { refundAddress: refundAddress })), (refundMemo && { refundMemo: refundMemo })), (externalId && { externalId: externalId }));
                        return [4 /*yield*/, this._post("".concat(this.BASE_URL, "/shifts/variable"), this._getSpecialHeader(userIp), variableShiftBody)];
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
     * @returns {Promise<Object>} Update result from API
     */
    SideshiftAPI.prototype.setRefundAddress = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var bodyObj;
            var shiftId = _b.shiftId, refundAddress = _b.refundAddress, refundMemo = _b.refundMemo;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this._validateString(shiftId, "shiftId", "setRefundAddress");
                        this._validateString(refundAddress, "refundAddress", "setRefundAddress");
                        this._validateOptinalString(refundMemo, "refundMemo", "setRefundAddress");
                        bodyObj = __assign({ "address": refundAddress }, (refundMemo && { "memo": refundMemo }));
                        return [4 /*yield*/, this._post("".concat(this.BASE_URL, "/shifts/").concat(shiftId, "/set-refund-address"), this.HEADER_WITH_TOKEN, bodyObj)];
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
                        this._validateString(orderId, "orderId", "cancelOrder");
                        bodyObj = {
                            "orderId": orderId
                        };
                        return [4 /*yield*/, this._post("".concat(this.BASE_URL, "/cancel-order"), this.HEADER_WITH_TOKEN, bodyObj)];
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
    * @returns {Promise<Object>} Checkout data from API
    */
    SideshiftAPI.prototype.createCheckout = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var checkoutBody;
            var settleCoin = _b.settleCoin, settleNetwork = _b.settleNetwork, settleAmount = _b.settleAmount, settleAddress = _b.settleAddress, successUrl = _b.successUrl, cancelUrl = _b.cancelUrl, settleMemo = _b.settleMemo, userIp = _b.userIp;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this._validateString(settleCoin, "settleCoin", "createCheckout");
                        this._validateString(settleNetwork, "settleNetwork", "createCheckout");
                        this._validateNumber(settleAmount, "settleAmount", "createCheckout");
                        this._validateString(settleAddress, "settleAddress", "createCheckout");
                        this._validateString(successUrl, "successUrl", "createCheckout");
                        this._validateString(cancelUrl, "cancelUrl", "createCheckout");
                        this._validateOptinalString(settleMemo, "settleMemo", "createCheckout");
                        this._validateOptinalString(userIp, "userIp", "createCheckout");
                        checkoutBody = __assign({ settleCoin: settleCoin, settleNetwork: settleNetwork, settleAmount: settleAmount, settleAddress: settleAddress, successUrl: successUrl, cancelUrl: cancelUrl, affiliateId: this.SIDESHIFT_ID }, (settleMemo && { settleMemo: settleMemo }));
                        return [4 /*yield*/, this._post("".concat(this.BASE_URL, "/checkout"), this._getSpecialHeader(userIp), checkoutBody)];
                    case 1: return [2 /*return*/, _c.sent()];
                }
            });
        });
    };
    return SideshiftAPI;
}());
exports.SideshiftAPI = SideshiftAPI;
module.exports = SideshiftAPI;
