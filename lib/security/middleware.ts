/**
 * API Security Middleware
 * Combines rate limiting and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRateLimit, writeRateLimit } from './rate-limit';
import { sanitizeMongoQuery } from './validation';

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: NextRequest): string {
  // Use IP address or user ID if available
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options?: { isWrite?: boolean }
) {
  return async (req: NextRequest, context?: any) => {
    const clientId = getClientId(req);
    const limiter = options?.isWrite ? writeRateLimit : apiRateLimit;
    const result = limiter(clientId);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
          },
        }
      );
    }

    // Add rate limit headers
    const response = await handler(req, context);
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());

    return response;
  };
}

/**
 * Sanitize request body
 */
export function sanitizeBody(body: any): any {
  return sanitizeMongoQuery(body);
}

/**
 * Safe error response (no stack traces in production)
 */
export function safeErrorResponse(error: any, status: number = 500): NextResponse {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return NextResponse.json(
    {
      error: error.message || 'An error occurred',
      ...(isDevelopment && { details: error.stack }),
    },
    { status }
  );
}
