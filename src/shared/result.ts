export type AuthErrorCode =
  | 'invalid_credentials'
  | 'network_unavailable'
  | 'account_not_found'
  | 'account_locked';

export interface AuthError {
  readonly code: AuthErrorCode;
  readonly message: string;
  readonly lockoutRemainingSeconds?: number;
}

export type AppError =
  | { readonly type: 'validation'; readonly field: string; readonly message: string }
  | { readonly type: 'auth'; readonly code: AuthErrorCode; readonly message: string; readonly lockoutSeconds?: number }
  | { readonly type: 'storage'; readonly operation: string; readonly retryable: boolean }
  | { readonly type: 'sync'; readonly attempt: number; readonly maxAttempts: number; readonly nextRetry?: Date }
  | { readonly type: 'capacity'; readonly resource: 'garden' | 'greenhouse'; readonly current: number; readonly max: number };

export type Result<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: AppError };
