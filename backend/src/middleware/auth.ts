import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

// Extend Express Request type with firm_id
declare global {
  namespace Express {
    interface Request {
      firm_id: string;
      user_identity?: string;
    }
  }
}

/**
 * Multi-tenancy Firm Scoping Middleware
 * Extracts firm_id from header x-firm-id, or falls back to env DEFAULT_FIRM_ID in development.
 */
export function firmScopingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const firmIdHeader = req.headers['x-firm-id'];
  const firm_id = typeof firmIdHeader === 'string' && firmIdHeader.trim() ? firmIdHeader.trim() : env.DEFAULT_FIRM_ID;

  if (!firm_id) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED_FIRM_CONTEXT',
        message: 'No active firm tenant context provided.'
      }
    });
    return;
  }

  req.firm_id = firm_id;
  req.user_identity = (req.headers['x-user-name'] as string) || 'CA Partner';
  next();
}

/**
 * Webhook Secret Authentication Middleware
 * Validates x-webhook-secret header for inbound Make.com / automation events.
 */
export function webhookAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const secretHeader = req.headers['x-webhook-secret'];
  
  if (!secretHeader || secretHeader !== env.WEBHOOK_SECRET) {
    res.status(401).json({
      error: {
        code: 'INVALID_WEBHOOK_SECRET',
        message: 'Unauthorized webhook request. Invalid or missing secret token.'
      }
    });
    return;
  }

  next();
}
