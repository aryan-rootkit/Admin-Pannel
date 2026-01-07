import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Validate that required environment variables are set
if (!process.env.NEXTAUTH_SECRET) {
  console.warn('⚠️  NEXTAUTH_SECRET is not set. Using fallback secret. Please set it in .env.local');
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
