import { _filterHeaders } from './headers';
import { _createError } from './error';

/**
 * Handle the API request
 * @private
 * @param {Object} response - Fetch response object
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Resolves with the response object if successful
 * @throws {Error} Throws an error with HTTP status details and error data when response is not ok
 */
export async function _handleResponse(response: Response, url: string, options: any, verbose: boolean): Promise<Response> {
    if (verbose) {
        console.log('\n=== DEBUG REQUEST ===');
        console.log('URL:', url);
        console.log('Method:', options?.method);
        console.log('Headers:', options?.headers ? _filterHeaders(options.headers) : 'None');
        console.log('Body:', options?.body ? typeof options.body === 'string' ? options.body : JSON.stringify(options.body, null, 2) : 'No body');
        console.log('=====================');
    }
    
    if (!response.ok) {
        let errorData = {};

        try {
            errorData = await response.json() as any;
        } catch {
            try {
                errorData = await response.text();
            } catch {
                errorData = { message: 'Failed to parse error details' };
            }
        }

        const error = _createError(`HTTP ${response?.status} ${response?.statusText}`,
            response,
            url,
            options,
            (errorData as any).error || errorData
        );

        throw error;
    }

    return response;
}
