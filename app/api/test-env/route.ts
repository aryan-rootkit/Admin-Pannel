import { NextResponse } from 'next/server';

/**
 * Test endpoint to check if environment variables are loaded
 * Visit: http://localhost:3000/api/test-env
 */
export async function GET() {
  const hasSecret = !!process.env.NEXTAUTH_SECRET;
  const hasUrl = !!process.env.NEXTAUTH_URL;
  const secretLength = process.env.NEXTAUTH_SECRET?.length || 0;
  
  return NextResponse.json({
    NEXTAUTH_SECRET: hasSecret ? `✅ Set (${secretLength} chars)` : '❌ Not set',
    NEXTAUTH_URL: hasUrl ? `✅ ${process.env.NEXTAUTH_URL}` : '❌ Not set',
    MONGODB_URI: process.env.MONGODB_URI ? '✅ Set' : '❌ Not set',
    allGood: hasSecret && hasUrl,
  });
}
