import { View } from 'react-native';

// Export a default component to satisfy the router requirement
export default View;

// Custom error class for application-specific errors
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

// Comprehensive error handler that handles different error types
export function handleError(error: unknown): AppError {
  // If it's already an AppError, return it as is
  if (error instanceof AppError) {
    return error;
  }

  // If it's a standard Error, convert to AppError with additional metadata
  if (error instanceof Error) {
    return new AppError(error.message, 'SYSTEM_ERROR', {
      originalError: error.name,
      stack: error.stack,
    });
  }

  // For any other type of error, create a new AppError
  return new AppError(
    typeof error === 'string' ? error : 'An unknown error occurred',
    'UNKNOWN_ERROR',
    { originalError: error }
  );
}

// Check if an error is network-related
export function isNetworkError(error: unknown): boolean {
  const err = handleError(error);
  return (
    err.message.toLowerCase().includes('network') ||
    err.message.toLowerCase().includes('connection failed') ||
    err.message.includes('Network request failed') ||
    err.message.includes('Network Error')
  );
}

// Format error message for display
export function formatErrorMessage(error: unknown): string {
  const err = handleError(error);
  return err.message.charAt(0).toUpperCase() + err.message.slice(1);
} 