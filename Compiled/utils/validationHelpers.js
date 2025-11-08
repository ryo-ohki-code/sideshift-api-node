"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._validateString = _validateString;
exports._validateOptionalString = _validateOptionalString;
exports._validateNumber = _validateNumber;
exports._validateArray = _validateArray;
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
        throw new Error("Invalid ".concat(paramName, " in ").concat(functionName));
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
        throw new Error("Error from ".concat(functionName, ": Missing or invalid ").concat(paramName, " parameter"));
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
        throw new Error("Error from ".concat(functionName, ": Missing or invalid ").concat(paramName, " parameter"));
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
function _validateArray(value, paramName, functionName, elementType) {
    if (elementType === void 0) { elementType = 'string'; }
    if (!Array.isArray(value)) {
        throw new Error("Error from ".concat(functionName, ": Missing or invalid ").concat(paramName, " parameter - must be an array"));
    }
    if (value.length === 0) {
        throw new Error("Error from ".concat(functionName, ": Missing or invalid ").concat(paramName, " parameter - must be a non-empty array"));
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
function _validateArrayElements(value, paramName, functionName, elementType) {
    if (elementType === void 0) { elementType = 'string'; }
    for (var i = 0; i < value.length; i++) {
        if (!value[i] || typeof value[i] !== elementType ||
            (elementType === 'string' && !value[i].trim())) {
            throw new Error("Error from ".concat(functionName, ": Missing or invalid ").concat(paramName, "[").concat(i, "] parameter - each element must be a non-empty ").concat(elementType));
        }
    }
    return value;
}
