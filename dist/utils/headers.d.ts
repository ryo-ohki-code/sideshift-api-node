/**
 * Filter API key from the log
 * @param {Object} headers - The headers object to filter
 * @returns {string} The filtered headers as a JSON string
 */
export declare function _filterHeaders(headers: Record<string, any>): string;
export declare const DEFAULT_HEADERS: {
    "Content-Type": string;
};
export declare const HEADER_WITH_TOKEN: (secret: string) => {
    "x-sideshift-secret": string;
    "Content-Type": string;
};
export declare const HEADER_COMMISSION: (secret: string, commissionRate: string) => {
    commissionRate?: string | undefined;
    "x-sideshift-secret": string;
    "Content-Type": string;
};
//# sourceMappingURL=headers.d.ts.map