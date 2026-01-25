/**
 * API Authentication Middleware
 * Protects API routes from unauthorized access
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Check if user is authenticated
 */
export async function requireAuth(request: NextRequest): Promise<{ authorized: boolean; response?: NextResponse }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Unauthorized. Please log in.' },
          { status: 401 }
        ),
      };
    }
    
    return { authorized: true };
  } catch (error: any) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Wrapper for API routes that require authentication
 */
export function withAuth(handler: (req: NextRequest, context?: any) => Promise<NextResponse>) {
  return async (req: NextRequest, context?: any) => {
    const authCheck = await requireAuth(req);
    if (!authCheck.authorized) {
      return authCheck.response!;
    }
    return handler(req, context);
  };
}
