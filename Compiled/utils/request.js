"use strict";
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
exports._updateRequestConfig = _updateRequestConfig;
exports._request = _request;
exports._requestImage = _requestImage;
exports._post = _post;
var responseHandler_1 = require("./responseHandler");
var retries_1 = require("./retries");
var error_1 = require("./error");
var _retryDelay;
var _retryBackoff;
var _retryCappedDelay;
var _maxRetries;
var _defaultTimeOut;
var _verbose;
var _BASE_URL;
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
function _request(url_1) {
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
                    }, _defaultTimeOut);
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
                    return [4 /*yield*/, (0, responseHandler_1._handleResponse)(response, url, options, _verbose)];
                case 3:
                    handledResponse = _b.sent();
                    if (url === "".concat(_BASE_URL, "/cancel-order") && handledResponse.status === 204) {
                        orderId = null;
                        if ((options === null || options === void 0 ? void 0 : options.body) && typeof (options === null || options === void 0 ? void 0 : options.body) === 'string') {
                            try {
                                parsedBody = JSON.parse(options.body);
                                orderId = parsedBody.orderId;
                            }
                            catch (e) {
                                if (_verbose)
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
                    if (retries > _maxRetries) {
                        throw new Error('Max retry timeout exceeded');
                    }
                    shouldRetry = retries < _maxRetries && (0, retries_1._shouldRetry)(err_1);
                    if (!shouldRetry) return [3 /*break*/, 7];
                    delay = (0, retries_1._calculateBackoffDelay)(retries, _retryDelay, _retryBackoff, _maxRetries, _retryCappedDelay);
                    if (_verbose)
                        console.warn("Request failed ".concat(retries, "/").concat(_maxRetries, ", retrying in ").concat(delay, "ms..."), err_1.message);
                    return [4 /*yield*/, (0, retries_1._delay)(delay)];
                case 6:
                    _b.sent();
                    return [2 /*return*/, _request(url, options, retries + 1)];
                case 7:
                    error = (0, error_1._createError)("Fetch API error: ".concat(((_a = err_1.error) === null || _a === void 0 ? void 0 : _a.message) || err_1.message || err_1), null, url, options, err_1);
                    throw error;
                case 8: return [2 /*return*/];
            }
        });
    });
}
/**
 * Make an image API request
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Blob|Object>} Image blob or error object
 */
function _requestImage(url_1) {
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
                    }, _defaultTimeOut);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 8, , 11]);
                    return [4 /*yield*/, fetch(url, __assign(__assign({}, options), { signal: controller.signal }))];
                case 2:
                    response = _b.sent();
                    clearTimeout(timeoutId);
                    return [4 /*yield*/, (0, responseHandler_1._handleResponse)(response, url, options, _verbose)];
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
                    error = (0, error_1._createError)("Failed to process image response: ".concat(e_1.message || e_1), response, url, options, e_1);
                    throw error;
                case 7: return [3 /*break*/, 11];
                case 8:
                    err_2 = _b.sent();
                    clearTimeout(timeoutId);
                    if (!controller.signal.aborted) {
                        controller.abort();
                    }
                    shouldRetry = retries < _maxRetries && (0, retries_1._shouldRetry)(err_2);
                    if (!shouldRetry) return [3 /*break*/, 10];
                    delay = (0, retries_1._calculateBackoffDelay)(retries, _retryDelay, _retryBackoff, _maxRetries, _retryCappedDelay);
                    if (_verbose)
                        console.warn("Image request failed ".concat(retries, "/").concat(_maxRetries, ", retrying in ").concat(delay, "ms..."), err_2.message);
                    return [4 /*yield*/, (0, retries_1._delay)(delay)];
                case 9:
                    _b.sent();
                    return [2 /*return*/, _requestImage(url, options, retries + 1)];
                case 10:
                    error = (0, error_1._createError)("Fetch API image error: ".concat(((_a = err_2.error) === null || _a === void 0 ? void 0 : _a.message) || err_2.message || err_2), null, url, options, err_2);
                    throw error;
                case 11: return [2 /*return*/];
            }
        });
    });
}
/**
 * Sends a POST request to the specified URL with the given body and headers
 * @param {string} url - The API endpoint URL
 * @param {Object} headers - The headers to include in the request
 * @param {Object} body - The request body to send
 * @returns {Promise<Response>} The fetch response object
 */
function _post(url, headers, body) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, _request(url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(body)
                })];
        });
    });
}
