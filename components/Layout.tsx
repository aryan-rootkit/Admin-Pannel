'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from './Header';
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

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Main Content Area - Full Width */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Fixed 64px height with horizontal navigation */}
        <Header />
        
        {/* Main Content - Scrollable, proper padding */}
        <motion.main
          key={typeof window !== 'undefined' ? window.location.pathname : 'main'}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="flex-1 overflow-y-auto bg-slate-50"
          style={{ paddingTop: '0' }}
        >
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </motion.main>
      </div>
      <ToastContainer />
    </div>
  );
}
