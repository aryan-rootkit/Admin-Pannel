import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * NextAuth configuration
 * MOCK MODE: Uses hardcoded credentials (no database required)
 * 
 * To enable real database authentication later:
 * 1. Uncomment the MongoDB imports
 * 2. Replace the authorize function with database lookup
 * 3. Set USE_MOCK_AUTH=false in .env.local
 */
const USE_MOCK_AUTH = process.env.USE_MOCK_AUTH !== 'false'; // Default to true

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide email and password');
        }

        // MOCK MODE: Hardcoded admin credentials (no database needed)
        if (USE_MOCK_AUTH) {
          // Mock admin credentials
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

          const user = mockUsers.find(
            (u) => u.email.toLowerCase().trim() === credentials.email.toLowerCase().trim() && u.password === credentials.password
          );

          if (user) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }

          throw new Error('Invalid email or password');
        }

        // REAL MODE: Database authentication (uncomment when ready)
        /*
        const { connectDB } = await import('./mongodb');
        const User = (await import('@/models/User')).default;
        
        await connectDB();
        const user = await User.findOne({ email: credentials.email }).select('+password');
        
        if (!user) {
          throw new Error('No user found with this email');
        }
        
        const isPasswordValid = await user.comparePassword(credentials.password);
        
        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }
        
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
        */
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production',
  debug: false,
};
