'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { DollarSign, FolderKanban, Users, TrendingUp, Wallet, AlertCircle, UserPlus, TrendingDown, CheckCircle, Activity, ArrowRight, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import { formatINR } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  normalizeRevenueFromMongo,
  buildDashboardPayload,
  type ActivityItem,
  type MonthlyRevenuePoint,
} from '@/lib/dashboard/analytics';
import HolidaysWidget from '@/components/dashboard/HolidaysWidget';

/**
 * Home Page - Agency Command Center
 * Executive overview with charts, financial snapshot, team pulse, and recent activity
 */

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    teamEarnings: 0,
    expenses: 0,
    profit: 0,
    profitMargin: 0,
    totalProjects: 0,
    totalClients: 0,
    cashPosition: 0,
    monthGrowth: 0,
    overdueInvoices: 0,
    utilizationRate: 0,
    billableCount: 0,
    topEarner: { name: 'N/A', amount: 0 },
    availableDevs: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenuePoint[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [revenueRes, projectsRes, clientsRes, teamRes] = await Promise.all([
          fetch('/api/revenue'),
          fetch('/api/projects'),
          fetch('/api/clients'),
          fetch('/api/team'),
        ]);

        if (!revenueRes.ok || !projectsRes.ok || !clientsRes.ok || !teamRes.ok) {
          throw new Error('Failed to fetch dashboard dependencies');
        }

        const revenueAll = (await revenueRes.json()) as any[];
        const projectsData = (await projectsRes.json()) as any[];
        const clientsData = (await clientsRes.json()) as any[];
        const teamData = (await teamRes.json()) as any[];

        const { revenueData, expensesData } = normalizeRevenueFromMongo(revenueAll);
        const { stats, monthlyRevenue: monthlySeries, recentActivity } = buildDashboardPayload(
          revenueData,
          projectsData,
          clientsData,
          teamData,
          expensesData,
          formatINR
        );

        if (cancelled) return;

        setStats(stats);
        setTeamMembers(Array.isArray(teamData) ? teamData : []);
        setMonthlyRevenue(monthlySeries);
        setRecentActivity(recentActivity);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome + profile access */}
        <div className="mb-2 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">
              {getGreeting()}, {session?.user?.name?.split(' ')[0] || 'Admin'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">Overview of your agency finances and team.</p>
          </div>
          <Link
            href="/settings/profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/20 text-sky-100 border border-sky-400/50 text-sm font-medium hover:bg-sky-500/30 transition-colors"
          >
            <UserCircle2 className="w-5 h-5" />
            <span>View profile</span>
          </Link>
        </div>

        {/* Top row: 7 key metric cards (Cash, Month Growth, etc.) */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Cash Position */}
          <div className="bg-sky-50/80 rounded-xl p-4 border border-sky-100 shadow-sm transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/revenue')}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-sky-200 rounded-xl flex-shrink-0 shadow-sm">
                <Wallet className="w-5 h-5 text-sky-800" />
              </div>
              <div>
                <p className="text-xs font-semibold text-sky-900/80 uppercase tracking-wide">Cash Position</p>
                <p className="text-[11px] text-sky-900/60">Available funds after expenses</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">{formatINR(stats.cashPosition)}</p>
          </div>

          {/* Month Growth */}
          <div className="bg-emerald-50/80 rounded-xl p-4 border border-emerald-100 shadow-sm transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/revenue')}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-xl flex-shrink-0 shadow-sm ${stats.monthGrowth >= 0 ? 'bg-emerald-200' : 'bg-rose-200'}`}>
                {stats.monthGrowth >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-800" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-rose-700" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-900/80 uppercase tracking-wide">Month Growth</p>
                <p className="text-[11px] text-emerald-900/60">Revenue vs last month</p>
              </div>
            </div>
            <p className={`text-2xl font-bold mb-1 ${stats.monthGrowth >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {stats.monthGrowth >= 0 ? '+' : ''}{stats.monthGrowth}%
            </p>
          </div>

          {/* Action Items */}
          <div className="bg-rose-50/80 rounded-xl p-4 border border-rose-100 shadow-sm transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/revenue?status=Overdue')}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-rose-200 rounded-xl flex-shrink-0 shadow-sm">
                <AlertCircle className="w-5 h-5 text-rose-700" />
              </div>
              <div>
                <p className="text-xs font-semibold text-rose-900/80 uppercase tracking-wide">Action Items</p>
                <p className="text-[11px] text-rose-900/60">Overdue invoices</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-700 mb-1">{stats.overdueInvoices}</p>
          </div>

          {/* Utilization */}
          <div className="bg-indigo-50/80 rounded-xl p-4 border border-indigo-100 shadow-sm transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/team')}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-indigo-200 rounded-xl flex-shrink-0 shadow-sm">
                <Users className="w-5 h-5 text-indigo-800" />
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-900/80 uppercase tracking-wide">Utilization</p>
                <p className="text-[11px] text-indigo-900/60">Team capacity</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">{stats.utilizationRate}%</p>
            <p className="text-[11px] text-slate-600">{stats.billableCount}/{teamMembers.length} people billable</p>
          </div>

          {/* Top Earner */}
          <div className="bg-violet-50/80 rounded-xl p-4 border border-violet-100 shadow-sm transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/team')}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-violet-200 rounded-xl flex-shrink-0 shadow-sm">
                <TrendingUp className="w-5 h-5 text-violet-800" />
              </div>
              <div>
                <p className="text-xs font-semibold text-violet-900/80 uppercase tracking-wide">Top Earner</p>
                <p className="text-[11px] text-violet-900/60">This period</p>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-900 mb-1">{stats.topEarner.name}</p>
            <p className="text-[11px] text-slate-600">{formatINR(stats.topEarner.amount)}</p>
          </div>

          {/* Available */}
          <div className="bg-teal-50/80 rounded-xl p-4 border border-teal-100 shadow-sm transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/team?availability=Available')}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-teal-200 rounded-xl flex-shrink-0 shadow-sm">
                <CheckCircle className="w-5 h-5 text-teal-800" />
              </div>
              <div>
                <p className="text-xs font-semibold text-teal-900/80 uppercase tracking-wide">Available</p>
                <p className="text-[11px] text-teal-900/60">Ready to start</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">{stats.availableDevs}</p>
          </div>

          {/* View People */}
          <Link
            href="/team"
            className="bg-amber-50/80 rounded-xl p-4 border border-amber-100 shadow-sm transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-200 rounded-xl flex-shrink-0 shadow-sm">
                <UserPlus className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-900/80 uppercase tracking-wide">View People</p>
                <p className="text-[11px] text-amber-900/60">Manage team members</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-700" />
          </Link>
        </div>

        {/* KPI Cards - secondary metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          {/* Today's Revenue - Prominent Blue Card */}
          <div className="bg-blue-600 rounded-xl p-6 border border-blue-700 shadow-lg cursor-pointer hover:shadow-xl transition-all" onClick={() => router.push('/revenue')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-white opacity-80" />
            </div>
            <p className="text-sm font-semibold text-blue-100 mb-2 uppercase tracking-wide">Today's Revenue</p>
            <p className="text-3xl font-bold text-white mb-1">{formatINR(stats.totalRevenue)}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-300" />
              <span className="text-xs text-blue-100">+12% from yesterday</span>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => router.push('/revenue')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-slate-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Total Revenue</p>
            <p className="text-3xl font-bold text-slate-900 mb-1">{formatINR(stats.totalRevenue)}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-xs text-slate-500">-2.3% from last month</span>
            </div>
          </div>

          {/* Total Projects */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => router.push('/projects')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <FolderKanban className="w-5 h-5 text-slate-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Total Projects</p>
            <p className="text-3xl font-bold text-slate-900 mb-1">{stats.totalProjects}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-slate-500">+5 this month</span>
            </div>
          </div>

          {/* Total Clients */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => router.push('/clients')}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Total Clients</p>
            <p className="text-3xl font-bold text-slate-900 mb-1">{stats.totalClients}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-slate-500">+3 this month</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
          {/* Total Customers Chart */}
          <div className="bg-slate-900/40 rounded-xl p-6 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Total Customers</h3>
                <p className="text-xs text-slate-500 mt-1">These companies have purchased in the last year.</p>
              </div>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => formatINR(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-600">Total per week: {stats.totalClients}</span>
              </div>
              <span className="text-xs font-semibold text-green-600">+22%</span>
            </div>
          </div>

          {/* Total Sales Chart */}
          <div className="bg-slate-900/40 rounded-xl p-6 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Total Sales</h3>
                <p className="text-xs text-slate-500 mt-1">vs yesterday</p>
              </div>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>
            <div className="mb-4">
              <span className="text-2xl font-bold text-slate-900">+33%</span>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={[{ name: 'This Week', value: stats.totalRevenue }, { name: 'Last Week', value: stats.totalRevenue * 0.75 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => formatINR(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4">
              <span className="text-xs text-slate-600">Total per week: {formatINR(stats.totalRevenue)}</span>
            </div>
          </div>

          {/* Pipeline Deals Chart */}
          <div className="bg-slate-900/40 rounded-xl p-6 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Pipeline Deals</h3>
                <p className="text-xs text-slate-500 mt-1">vs yesterday</p>
              </div>
              <TrendingUp className="w-5 h-5 text-slate-400" />
            </div>
            <div className="mb-4">
              <span className="text-2xl font-bold text-red-600">-23%</span>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={[{ name: 'This Week', value: stats.totalProjects }, { name: 'Last Week', value: stats.totalProjects * 1.3 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4">
              <span className="text-xs text-slate-600">Total per week: {stats.totalProjects}</span>
            </div>
          </div>

        </div>

        {/* Recent Activity (Feed) */}
        <div className="bg-slate-900/40 rounded-xl p-6 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-50 mb-1">Recent Activity</h2>
              <p className="text-sm text-slate-400">Last 24 hours</p>
            </div>
            <Link href="/revenue" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {activity.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No recent activity</p>
                <p className="text-xs mt-1">Activity will appear here as things happen</p>
              </div>
            )}
            </div>
          </div>

          {/* Public Holidays */}
          <HolidaysWidget />
      </div>
    </Layout>
  );
}
