"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._errorMsg = _errorMsg;
exports._createError = _createError;
/**
 * Generate an error message for missing or invalid parameters
 * @private
 * @param {string} fieldName - The name of the field that caused the error
 * @param {string} source - The source where the error occurred
 * @returns {string} The formatted error message
 */
function _errorMsg(fieldName, source) {
    var error = "Error from ".concat(source, ": Missing or invalid ").concat(fieldName, " parameter");
    return error;
}
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
    var error = new Error(message);
    // Add additional properties to the error for better debugging
    error.status = response === null || response === void 0 ? void 0 : response.status;
    error.statusText = response === null || response === void 0 ? void 0 : response.statusText;
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
