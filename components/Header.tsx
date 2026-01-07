'use client';

import { useSession } from 'next-auth/react';
import { Bell, Search, Settings, Mail, Menu } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modern Header Component
 * Fixed height 64px, hamburger menu for mobile
 */
export default function Header() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-50 to-gray-50 border-b border-gray-200 shadow-sm h-16">
      <div className="flex items-center justify-between px-6 h-full">
        {/* Left Side - Menu & Search */}
        <div className="flex items-center gap-4 flex-1">
          {/* Hamburger Menu (Mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search here..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Right Side - Notifications & User */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          {/* Messages */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Mail className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* User Info */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-300">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{session?.user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{session?.user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-md cursor-pointer hover:shadow-lg transition-shadow">
              {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-200"
          >
            <div className="p-4 space-y-2">
              <a href="/dashboard" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Dashboard</a>
              <a href="/projects" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Projects</a>
              <a href="/clients" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Clients</a>
              <a href="/revenue" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Revenue</a>
              <a href="/team" className="block px-3 py-2 rounded-lg hover:bg-gray-50">Team</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
