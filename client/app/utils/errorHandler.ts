export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 'SYSTEM_ERROR', {
      originalError: error.name,
      stack: error.stack,
    });
  }

  return new AppError(
    typeof error === 'string' ? error : 'An unknown error occurred',
    'UNKNOWN_ERROR',
    { originalError: error }
  );
}

export function isNetworkError(error: unknown): boolean {
  const err = handleError(error);
  return (
    err.message.includes('Network request failed') ||
    err.message.includes('Network Error') ||
    err.message.includes('Connection failed')
  );
}

export function formatErrorMessage(error: unknown): string {
  const err = handleError(error);
  return err.message.charAt(0).toUpperCase() + err.message.slice(1);
} 