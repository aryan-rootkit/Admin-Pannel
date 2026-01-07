import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Validate that required environment variables are set
if (!process.env.NEXTAUTH_SECRET) {
  console.error('❌ ERROR: NEXTAUTH_SECRET is not set in .env.local');
  console.error('Please run: openssl rand -base64 32');
  console.error('Then add NEXTAUTH_SECRET=<generated-secret> to .env.local');
  throw new Error('NEXTAUTH_SECRET is required');
}

if (!process.env.NEXTAUTH_URL) {
  console.warn('⚠️  NEXTAUTH_URL is not set. Defaulting to http://localhost:3000');
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
