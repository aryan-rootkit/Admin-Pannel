'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  FolderKanban,
  DollarSign,
  Users,
  Settings,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

/**
 * Modern Sidebar Navigation Component
 * Hover expand with Framer Motion animation
 */
const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Features' },
  { href: '/calendar', label: 'Calendar', icon: Calendar, section: 'Features' },
  { href: '/projects', label: 'Projects', icon: FolderKanban, section: 'Projects' },
  { href: '/clients', label: 'Clients', icon: UserCheck, section: 'Projects' },
  { href: '/revenue', label: 'Revenue', icon: DollarSign, section: 'Finance' },
  { href: '/team', label: 'Team', icon: Users, section: 'Organization' },
  { href: '/settings', label: 'Settings', icon: Settings, section: 'Organization' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isHovered, setIsHovered] = useState(false);

  // Group items by section
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <motion.aside
      className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col shadow-lg z-40"
      initial={{ width: 256 }}
      animate={{ width: isHovered ? 280 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-gray-700 font-bold text-lg">R</span>
          </div>
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: isHovered ? 1 : 1 }}
            className="min-w-0"
          >
            <h1 className="text-lg font-bold text-gray-800 truncate">Rootkit Admin</h1>
            <p className="text-xs text-gray-500 truncate">Development Agency</p>
          </motion.div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md flex-shrink-0">
            {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{session?.user?.name || 'Admin User'}</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Features Section */}
        <div>
          <p className="text-blue-600 text-xs font-semibold uppercase tracking-wider mb-3 px-2">Features</p>
          <div className="space-y-1">
            {groupedItems['Features']?.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-semibold'
                      : 'text-blue-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-blue-600'}`} />
                  <span className="text-sm whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Projects Section */}
        {groupedItems['Projects'] && (
          <div>
            <p className="text-blue-600 text-xs font-semibold uppercase tracking-wider mb-3 px-2">Projects</p>
            <div className="space-y-1">
              {groupedItems['Projects'].map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-blue-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-blue-600'}`} />
                    <span className="text-sm whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Finance Section */}
        {groupedItems['Finance'] && (
          <div>
            <p className="text-blue-600 text-xs font-semibold uppercase tracking-wider mb-3 px-2">Finance</p>
            <div className="space-y-1">
              {groupedItems['Finance'].map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-blue-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-blue-600'}`} />
                    <span className="text-sm whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Organization Section */}
        {groupedItems['Organization'] && (
          <div>
            <p className="text-blue-600 text-xs font-semibold uppercase tracking-wider mb-3 px-2">Organization</p>
            <div className="space-y-1">
              {groupedItems['Organization'].map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-blue-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-gray-900' : 'text-blue-600'}`} />
                    <span className="text-sm whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 font-medium shadow-md"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm whitespace-nowrap">Log Out</span>
        </button>
      </div>
    </motion.aside>
  );
}
