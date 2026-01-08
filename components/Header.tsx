'use client';

import { useSession } from 'next-auth/react';
import { Bell, Search, Settings, Mail, Menu } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Light Mode Header Component
 * Fixed height 64px, white background
 * Blue accent links, fully functional navigation
 */
export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/projects', label: 'Projects' },
    { href: '/clients', label: 'Clients' },
    { href: '/revenue', label: 'Revenue' },
    { href: '/team', label: 'Team' },
    { href: '/settings', label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm h-16">
      <div className="flex items-center justify-between px-6 h-full">
        {/* Left Side - Menu & Search */}
        <div className="flex items-center gap-4 flex-1">
          {/* Hamburger Menu (Mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Search Bar - Light Mode */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search here..."
                className="input-premium w-full pl-10 pr-4 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Right Side - Notifications & User */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300 hover:scale-105">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Settings */}
          <Link href="/settings">
            <button className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300 hover:scale-105">
              <Settings className="w-5 h-5" />
            </button>
          </Link>

          {/* Messages */}
          <button className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300 hover:scale-105">
            <Mail className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* User Info - Light Mode */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{session?.user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-500">{session?.user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-md cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300">
              {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay - Functional Links */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-slate-200"
          >
            <div className="p-4 space-y-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
