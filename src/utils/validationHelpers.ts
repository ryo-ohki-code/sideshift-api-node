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
        const error = _errorMsg(functionName, paramName)
        throw new Error(`${error}`);
    }
    if (value === null || value === undefined) {
        return value;
    } else {
        return value.trim();
    }
}

/**
 * Sanitize a value to a number, returning null if conversion fails
 * @param {number | string | null | undefined} input - The value to sanitize
 * @returns {number | null} The sanitized number value, or null if conversion fails
 */
function sanitizeNumber(input: number | string | null | undefined): number | null {
    if (!input) {
        return null;
    }

    if (typeof input !== 'number') {
        input = Number(input);
    }

    if (isNaN(input) || !isFinite(input)) {
        return null;
    }
    return input;
}

/**
 * Validate that a value is a non-negative finite number
 * @param {*} value - The value to validate
 * @param {string} paramName - The name of the parameter being validated
 * @param {string} functionName - The name of the function where validation occurred
 * @returns {number} The valid number value, or null if not provided
 * @throws {Error} If the value is invalid
 */
export function _validateNumber(value: number | string | null | undefined, paramName: string, functionName: string, isOptional: boolean = false): number | null {
    if (!value) {
        if(isOptional){
            return null;
        }else{
        const error = _errorMsg(functionName, paramName)
        throw new Error(`${error}`);

        }
    }

    const sanitizedValue = sanitizeNumber(value);

    if (!sanitizedValue) {
        return null;
    }

    if (sanitizedValue < 0) {
        throw new Error(`Error from ${functionName}: ${paramName} parameter must be > 0`);
    }

    return sanitizedValue;
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