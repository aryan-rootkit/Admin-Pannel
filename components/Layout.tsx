'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
import Sidebar from './Sidebar';
import { ToastContainer } from './ui/Toast';

/**
 * Premium Enterprise Layout Component
 * Fixed header (64px), sidebar (256px), content area with proper spacing
 * NO OVERLAPS - Perfect alignment
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <p className="mt-4 text-slate-700 font-medium">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-100 overflow-hidden">
      {/* Left Navigation */}
      <Sidebar />

      {/* Main Content Area (shifted to the right of sidebar) */}
      <div className="pl-64 flex flex-col min-h-screen">
        {/* Header - fixed height top bar */}
        <Header />

        {/* Main Content - scrollable, pastel-tinted surface */}
        <motion.main
          key={typeof window !== 'undefined' ? window.location.pathname : 'main'}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="flex-1 overflow-y-auto"
        >
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            {children}
          </div>
        </motion.main>
      </div>

      <ToastContainer />
    </div>
  );
}
