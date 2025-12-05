export interface BaseError {
  name: string;
  message: string;
  code?: string;
  status?: number;
  statusText?: string;
  url?: string;
  options?: any;
  error?: Error;
  response?: any | null;
  stack?: string;
  timestamp?: string;
}

// For HTTP-specific errors
export interface HttpError extends BaseError {
  status: number;
  code: string;
}
