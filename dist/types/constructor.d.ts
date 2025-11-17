export interface SideshiftAPIOptions {
    secret: string;
    id: string;
    commissionRate?: string;
    verbose?: boolean;
    retries?: {
        maxRetries?: number;
        retryDelay?: number;
        retryBackoff?: number;
        retryCappedDelay?: number;
    };
}
//# sourceMappingURL=constructor.d.ts.map