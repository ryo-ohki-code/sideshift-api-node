/**
 * Filter API key from the log
 * @param {Object} headers - The headers object to filter
 * @returns {string} The filtered headers as a JSON string
 */
export function _filterHeaders(headers: Record<string, any>): string {
    if (!headers || typeof headers !== 'object') {
        return 'None';
    }

    try {
        const filtered = { ...headers };
        const sensitiveKeys = ['x-sideshift-secret']; // Array, if need to add more filter

        for (const key of sensitiveKeys) {
            if (filtered[key]) {
                filtered[key] = '[FILTERED]';
            }
        }

        return JSON.stringify(filtered, null, 2);
    } catch (error) {
        console.error('Error filtering headers:', error);
        return JSON.stringify({ error: 'Failed to filter headers' }, null, 2);
    }
}


export const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
};

export const HEADER_WITH_TOKEN = (secret: string) => ({
    ...DEFAULT_HEADERS,
    "x-sideshift-secret": secret
});