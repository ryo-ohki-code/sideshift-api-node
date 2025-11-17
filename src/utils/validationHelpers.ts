import { _errorMsg } from './error';

/**
 * Validate that a value is a non-empty string
 * @param {*} value - The value to validate
 * @param {string} paramName - The name of the parameter being validated
 * @param {string} functionName - The name of the function where validation occurred
 * @returns {string} The trimmed valid string value
 * @throws {Error} If the value is invalid
 */
export function _validateString(value: any, paramName: string, functionName: string): string {
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
export function _validateOptionalString(value: any, paramName: string, functionName: string): string | null | undefined {
    if (value && typeof value !== 'string') {
        throw new Error(`Error from ${functionName}: Missing or invalid ${paramName} parameter`);
    }
    if (value === null || value === undefined) {
        return value;
    } else {
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
export function _validateNumber(value: any, paramName: string, functionName: string): number | null {
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
export function _validateArray(value: any, paramName: string, functionName: string, elementType: string = 'string'): Array<any> {
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
function _validateArrayElements(value: Array<any>, paramName: string, functionName: string, elementType: string = 'string'): Array<any> {
    for (let i = 0; i < value.length; i++) {
        if (!value[i] || typeof value[i] !== elementType ||
            (elementType === 'string' && !value[i].trim())) {
            throw new Error(`Error from ${functionName}: Missing or invalid ${paramName}[${i}] parameter - each element must be a non-empty ${elementType}`);
        }
    }
    return value;
}