/**
 * Generate an error message for missing or invalid parameters
 * @private
 * @param {string} fieldName - The name of the field that caused the error
 * @param {string} source - The source where the error occurred
 * @returns {string} The formatted error message
 */
export declare function _errorMsg(fieldName: string, source: string): string;
/**
 * Create a formatted error object
 * @param {string} message - Error message
 * @param {Response|null} response - Response object if available
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {any} errorData - Additional error data
 * @returns {Error} Formatted error object
 */
export declare function _createError(message: string, response: Response | null, url: string, options: any, errorData: any): Error;
//# sourceMappingURL=error.d.ts.map