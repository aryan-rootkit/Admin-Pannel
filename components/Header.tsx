'use client';

import { useSession } from 'next-auth/react';
import { Bell, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatINR } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';

interface Notification {
  id: string;
  type: 'new_client' | 'target_achieved' | 'sale_processed' | 'deadline_coming' | 'project_complete' | 'payment_received';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

/**
 * Light Mode Header Component
 * Fixed height 64px, white background
 * Notification dropdown with real notifications
 */
export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navLinks: { href: string; label: string }[] = [];

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isNotificationOpen && !target.closest('.notification-dropdown')) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isNotificationOpen]);

  const fetchNotifications = async () => {
    try {
      if (typeof window !== 'undefined') {
        const [revenueRes, clientsRes, projectsRes, eventsRes] = await Promise.all([
          fetch('/api/revenue'),
          fetch('/api/clients'),
          fetch('/api/projects'),
          fetch('/api/events'),
        ]);

        const [revenue, clients, projects, events] = await Promise.all([
          revenueRes.json(),
          clientsRes.json(),
          projectsRes.json(),
          eventsRes.json(),
        ]);

        const newNotifications: Notification[] = [];
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // New clients (last 24 hours)
        clients
          .filter((c: any) => {
            const createdAt = c.createdAt ? new Date(c.createdAt) : null;
            return createdAt && createdAt >= last24Hours;
          })
          .forEach((c: any) => {
            newNotifications.push({
              id: `client_${c._id}`,
              type: 'new_client',
              title: 'New Client Added',
              message: `${c.name} has been added as ${c.status || 'Lead'}`,
              timestamp: c.createdAt ? new Date(c.createdAt) : new Date(),
              read: false,
              link: '/clients',
            });
          });

        // Recent payments/revenue (last 24 hours)
        revenue.forEach((r: any) => {
          const recordDate = r.date ? new Date(r.date) : null;
          if (!recordDate || recordDate < last24Hours) return;

          // Best-effort: treat income records with status=paid as payments.
          const status = (r.status || '').toLowerCase();
          if (r.type !== 'income' || status !== 'paid') return;

          const [clientName, projectName] = String(r.description || '').split(' - ');
          newNotifications.push({
            id: `payment_${r._id}_${String(r.date)}`,
            type: 'sale_processed',
            title: 'Payment Received',
            message: `Received ${formatINR(r.amount || 0)} for ${projectName || r.description || 'Project'}`,
            timestamp: recordDate,
            read: false,
            link: '/revenue',
          });
        });

        // Completed projects (last 24 hours)
        projects
          .filter((p: any) => {
            if (p.status !== 'Completed') return false;
            const updatedAt = p.updatedAt ? new Date(p.updatedAt) : null;
            return updatedAt && updatedAt >= last24Hours;
          })
          .forEach((p: any) => {
            newNotifications.push({
              id: `project_complete_${p._id}`,
              type: 'project_complete',
              title: 'Project Completed',
              message: `${p.name} has been marked as completed`,
              timestamp: p.updatedAt ? new Date(p.updatedAt) : new Date(),
              read: false,
              link: '/projects',
            });
          });

        // Upcoming deadlines (next 7 days)
        events
          .filter((e: any) => {
            if (e.type !== 'deadline') return false;
            const deadlineDate = e.end ? new Date(e.end) : e.start ? new Date(e.start) : null;
            return deadlineDate && deadlineDate >= now && deadlineDate <= next7Days;
          })
          .forEach((e: any) => {
            const deadlineDate = e.end ? new Date(e.end) : new Date(e.start);
            newNotifications.push({
              id: `deadline_${e._id}`,
              type: 'deadline_coming',
              title: 'Deadline Approaching',
              message: `Deadline for "${e.title || 'Event'}" is on ${formatDate(deadlineDate)}`,
              timestamp: deadlineDate,
              read: false,
              link: '/calendar',
            });
          });

        // Target achieved (revenue milestones - simplified)
        const totalRevenue = revenue.reduce((sum: number, r: any) => sum + ((r.type === 'income' && r.amount) ? r.amount : 0), 0);
        if (totalRevenue >= 100000) {
          // Check if we've hit a milestone (every 1L)
          const milestone = Math.floor(totalRevenue / 100000) * 100000;
          const lastMilestone = localStorage.getItem('lastRevenueMilestone');
          if (!lastMilestone || parseInt(lastMilestone) < milestone) {
            localStorage.setItem('lastRevenueMilestone', milestone.toString());
            newNotifications.push({
              id: `milestone_${milestone}`,
              type: 'target_achieved',
              title: 'Revenue Milestone Achieved',
              message: `Congratulations! Total revenue reached ${formatINR(milestone)}`,
              timestamp: new Date(),
              read: false,
              link: '/revenue',
            });
          }
        }

        // Sort by timestamp (newest first)
        newNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        // Load read status from localStorage
        const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
        newNotifications.forEach(n => {
          n.read = readNotifications.includes(n.id);
        });

        setNotifications(newNotifications.slice(0, 20)); // Limit to 20 most recent
        setUnreadCount(newNotifications.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = (id: string) => {
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '[]');
    if (!readNotifications.includes(id)) {
      readNotifications.push(id);
      localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('readNotifications', JSON.stringify(allIds));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_client':
        return '👤';
      case 'target_achieved':
        return '🎯';
      case 'sale_processed':
        return '💰';
      case 'deadline_coming':
        return '⏰';
      case 'project_complete':
        return '✅';
      case 'payment_received':
        return '💵';
      default:
        return '🔔';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800">
      <div className="flex items-center justify-between px-6 h-full">
        {/* Left Side - App title */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-400 flex items-center justify-center shadow-sm">
            <span className="text-slate-900 font-bold text-sm">R</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-semibold text-slate-100">Rootkit Admin</span>
            <span className="text-xs text-slate-400">
              {pathname === '/dashboard' ? 'Dashboard overview' : 'Admin workspace'}
            </span>
          </div>
          
          {/* Hamburger Menu (Mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Right Side - Notifications & User */}
        <div className="flex items-center gap-4">
          
          {/* Notifications Dropdown */}
          <div className="relative notification-dropdown">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-semibold border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {isNotificationOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden flex flex-col notification-dropdown"
                >
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <Link
                          key={notification.id}
                          href={notification.link || '#'}
                          onClick={() => {
                            markAsRead(notification.id);
                            setIsNotificationOpen(false);
                          }}
                          className={`block p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                            !notification.read ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-xl flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold text-slate-900">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mb-1">{notification.message}</p>
                              <p className="text-xs text-slate-400">
                                {formatDate(notification.timestamp)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User avatar (profile access lives on Dashboard via button) */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center text-slate-900 font-semibold shadow-sm">
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
