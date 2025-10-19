/**
 * Filter API key from the log
 * @param {Object} headers - The headers object to filter
 * @returns {string} The filtered headers as a JSON string
 */
export function _filterHeaders(headers: Record<string, any>): string {
    if (!headers) return 'None';

    const filtered = { ...headers };
    const sensitiveKeys = ['x-sideshift-secret']; // Array, if need to add more filter

    for (const key of sensitiveKeys) {
        if (filtered[key]) {
            filtered[key] = '[FILTERED]';
        }
    }

    return JSON.stringify(filtered, null, 2);
}


export const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
};

export const HEADER_WITH_TOKEN = (secret: string) => ({
    ...DEFAULT_HEADERS,
    "x-sideshift-secret": secret
});

export const HEADER_COMMISSION = (secret: string, commissionRate: string) => ({
    ...HEADER_WITH_TOKEN(secret),
    ...(commissionRate !== "0.5" && { commissionRate })
});
