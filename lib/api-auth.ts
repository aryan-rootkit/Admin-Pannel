import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Utility to verify authentication in API routes
 * Returns session if authenticated, or error response if not
 */
export async function verifyAuth() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return {
        error: NextResponse.json(
          { error: 'Unauthorized: Authentication required' },
          { status: 401 }
        ),
        session: null,
      };
    }
    
    return { error: null, session };
  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      ),
      session: null,
    };
  }
}
