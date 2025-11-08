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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HEADER_COMMISSION = exports.HEADER_WITH_TOKEN = exports.DEFAULT_HEADERS = void 0;
exports._filterHeaders = _filterHeaders;
/**
 * Filter API key from the log
 * @param {Object} headers - The headers object to filter
 * @returns {string} The filtered headers as a JSON string
 */
function _filterHeaders(headers) {
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
}
exports.DEFAULT_HEADERS = {
    "Content-Type": "application/json",
};
var HEADER_WITH_TOKEN = function (secret) { return (__assign(__assign({}, exports.DEFAULT_HEADERS), { "x-sideshift-secret": secret })); };
exports.HEADER_WITH_TOKEN = HEADER_WITH_TOKEN;
var HEADER_COMMISSION = function (secret, commissionRate) { return (__assign(__assign({}, (0, exports.HEADER_WITH_TOKEN)(secret)), (commissionRate !== "0.5" && { commissionRate: commissionRate }))); };
exports.HEADER_COMMISSION = HEADER_COMMISSION;
