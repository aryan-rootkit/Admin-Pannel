import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Set default NEXTAUTH_URL if not provided
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
}

// Set a default secret for development if not provided
if (!process.env.NEXTAUTH_SECRET) {
  console.warn('⚠️  NEXTAUTH_SECRET is not set. Using a default secret for development.');
  console.warn('⚠️  For production, run: openssl rand -base64 32');
  process.env.NEXTAUTH_SECRET = 'dev-secret-change-in-production-' + Date.now();
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
