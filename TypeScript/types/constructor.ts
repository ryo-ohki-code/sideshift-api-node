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
    }; // ? add to allow null for no retries || null; 
}
