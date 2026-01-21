import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * NextAuth configuration
 * MONGODB MODE: Uses MongoDB for authentication
 * 
 * To use mock authentication (no database):
 * Set USE_MOCK_AUTH=true in .env.local
 */
const USE_MOCK_AUTH = process.env.USE_MOCK_AUTH === 'true'; // Default to false (use MongoDB)

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error('Missing credentials');
            return null;
          }

          // MOCK MODE: Hardcoded admin credentials (for development/testing)
          if (USE_MOCK_AUTH) {
            const mockUsers = [
              {
                email: 'admin@rootkit.dev',
                password: 'admin123',
                id: '1',
                name: 'Rootkit Admin',
                role: 'admin',
              },
              {
                email: 'admin@rootkit.com',
                password: 'admin123',
                id: '2',
                name: 'Admin User',
                role: 'admin',
              },
            ];

            const email = credentials.email.toLowerCase().trim();
            const password = credentials.password.trim();

            const user = mockUsers.find(
              (u) => u.email.toLowerCase().trim() === email && u.password === password
            );

            if (user) {
              console.log('✅ Mock login successful for:', user.email);
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              };
            }

            console.error('❌ Invalid mock credentials:', email);
            return null;
          }

          // MONGODB MODE: Database authentication (production)
          const connectDB = (await import('./mongodb')).default;
          const User = (await import('@/models/User')).default;
          
          await connectDB();
          
          const email = credentials.email.toLowerCase().trim();
          const user = await User.findOne({ email }).select('+password');
          
          if (!user) {
            console.error('❌ User not found:', email);
            return null;
          }
          
          const isPasswordValid = await user.comparePassword(credentials.password);
          
          if (!isPasswordValid) {
            console.error('❌ Invalid password for:', email);
            return null;
          }
          
          console.log('✅ MongoDB login successful for:', user.email);
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle callbackUrl from query params
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || (() => {
    // Fallback secret (set NEXTAUTH_SECRET in Vercel for production)
    const fallback = process.env.VERCEL_URL 
      ? `nextauth-secret-${process.env.VERCEL_URL.replace(/[^a-zA-Z0-9]/g, '')}` 
      : 'dev-secret-key-change-in-production';
    console.warn('⚠️  NEXTAUTH_SECRET not set. Using fallback. Add NEXTAUTH_SECRET in Vercel environment variables.');
    return fallback;
  })(),
  debug: false,
  events: {
    async signIn({ user }) {
      console.log('✅ User signed in:', user.email);
    },
    async signOut() {
      console.log('👋 User signed out');
    },
  },
};
