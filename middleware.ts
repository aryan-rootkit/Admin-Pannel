import { withAuth } from 'next-auth/middleware';

/**
 * Middleware to protect routes
 * Redirects unauthenticated users to login page
 */
export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/calendar/:path*',
    '/projects/:path*',
    '/clients/:path*',
    '/revenue/:path*',
    '/team/:path*',
    '/settings/:path*',
  ],
};
