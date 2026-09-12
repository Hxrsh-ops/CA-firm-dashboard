import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  // Input Validation Error (Zod)
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload format.',
        details: err.flatten().fieldErrors
      }
    });
    return;
  }

  // Known Business Logic Errors
  if (err.message && (
    err.message.includes('not found') || 
    err.message.includes('Cannot send reminder') || 
    err.message.includes('already been sent')
  )) {
    const isNotFound = err.message.includes('not found');
    res.status(isNotFound ? 404 : 400).json({
      error: {
        code: isNotFound ? 'RESOURCE_NOT_FOUND' : 'BUSINESS_RULE_VIOLATION',
        message: err.message
      }
    });
    return;
  }

  console.error('[UnhandledError]', err);
  
  // Generic Server Error (Preserving security: never expose raw stack traces)
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred while processing your request.'
    }
  });
}
