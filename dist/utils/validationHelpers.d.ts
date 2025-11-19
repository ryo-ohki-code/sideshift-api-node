/**
 * Validate that a value is a non-empty string
 * @param {*} value - The value to validate
 * @param {string} paramName - The name of the parameter being validated
 * @param {string} functionName - The name of the function where validation occurred
 * @returns {string} The trimmed valid string value
 * @throws {Error} If the value is invalid
 */
export declare function _validateString(value: any, paramName: string, functionName: string): string;
/**
 * Validate that a value is an optional string
 * @param {*} value - The value to validate
 * @param {string} paramName - The name of the parameter being validated
 * @param {string} functionName - The name of the function where validation occurred
 * @returns {string|null|undefined} The trimmed valid string value, or null/undefined if not provided
 * @throws {Error} If the value is provided but not a string
 */
export declare function _validateOptionalString(value: any, paramName: string, functionName: string): string | null | undefined;
/**
 * Validate that a value is a non-negative finite number
 * @param {*} value - The value to validate
 * @param {string} paramName - The name of the parameter being validated
 * @param {string} functionName - The name of the function where validation occurred
 * @returns {number|null} The valid number value, or null if not provided
 * @throws {Error} If the value is invalid
 */
export declare function _validateNumber(value: any, paramName: string, functionName: string): number | null;
/**
 * Validate that a value is a non-empty array with specified element type
 * @param {*} value - The value to validate
 * @param {string} paramName - The name of the parameter being validated
 * @param {string} functionName - The name of the function where validation occurred
 * @param {string} elementType - The expected type of array elements (default: 'string')
 * @returns {Array} The valid array value
 * @throws {Error} If the value is invalid
 */
export declare function _validateArray(value: any, paramName: string, functionName: string, elementType?: string): Array<any>;
