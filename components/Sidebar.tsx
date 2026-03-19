'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
 * Light Mode Sidebar Navigation
 * White background, blue active states
 * All links functional
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

  // Group items by section
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-lg z-40"
      style={{ width: '256px' }}
    >
      {/* Logo/Brand */}
      <div className="p-6 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-50 truncate font-display">Rootkit Admin</h1>
            <p className="text-xs text-slate-400 truncate">Development Agency</p>
          </div>
        </div>
      </div>

      {/* Navigation - Left rail */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Features Section */}
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 px-2">Features</p>
          <div className="space-y-1">
            {groupedItems['Features']?.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-sky-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-200'}`} />
                  <span className="text-sm whitespace-nowrap font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Projects Section */}
        {groupedItems['Projects'] && (
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 px-2">Projects</p>
            <div className="space-y-1">
              {groupedItems['Projects'].map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                
                return (
                  <Link
                    key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-sky-200'
                  }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}`} />
                    <span className="text-sm whitespace-nowrap font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Finance Section */}
        {groupedItems['Finance'] && (
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 px-2">Finance</p>
            <div className="space-y-1">
              {groupedItems['Finance'].map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                
                return (
                  <Link
                    key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-sky-200'
                  }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}`} />
                    <span className="text-sm whitespace-nowrap font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Organization Section */}
        {groupedItems['Organization'] && (
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3 px-2">Organization</p>
            <div className="space-y-1">
              {groupedItems['Organization'].map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                
                return (
                  <Link
                    key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-sky-200'
                  }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}`} />
                    <span className="text-sm whitespace-nowrap font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-800 flex-shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg transition-all duration-300 font-medium"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm whitespace-nowrap">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
