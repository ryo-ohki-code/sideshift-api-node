import { BaseError } from './../types/error';

/**
 * Generate an error message for missing or invalid parameters
 * @private
 * @param {string} fieldName - The name of the field that caused the error
 * @param {string} source - The source where the error occurred
 * @returns {string} The formatted error message
 */
export function _errorMsg(fieldName: string, source: string): string {
    const error = `Error from ${source}: Missing or invalid ${fieldName} parameter`;
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
export function _createError(
    message: string,
    response: Response | null,
    url: string,
    options: any,
    errorData: any
): BaseError {
    const error = new Error(message);
    
    // Add additional properties to the error for better debugging
    (error as BaseError).status = response?.status;
    (error as BaseError).statusText = response?.statusText;
    (error as BaseError).url = url;
    (error as BaseError).options = options;
    (error as BaseError).error = errorData;
    (error as BaseError).response = response;
    
    return error;
}
