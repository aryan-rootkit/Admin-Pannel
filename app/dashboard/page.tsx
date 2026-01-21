'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Layout from '@/components/Layout';
import { DollarSign, FolderKanban, Users, TrendingUp, Wallet, AlertCircle, UserPlus, TrendingDown, CheckCircle, Receipt, Activity, ArrowRight } from 'lucide-react';
import StatsWidget from '@/components/ui/stats-widget';
import Link from 'next/link';
import { formatINR } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { useApp } from '@/lib/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Home Page - Agency Command Center
 * Executive overview with charts, financial snapshot, team pulse, and recent activity
 */

interface ActivityItem {
  id: string;
  type: 'project_complete' | 'new_client' | 'payment' | 'project_created' | 'client_updated' | 'revenue_added';
  message: string;
  timestamp: Date;
  icon: string;
  color: string;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#14B8A6', '#6366F1', '#EC4899'];

export default function HomePage() {
  const router = useRouter();
  const { projects, clients } = useApp();
  const [revenue, setRevenue] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
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

  // Chart data
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [projectStatusData, setProjectStatusData] = useState<any[]>([]);
  const [expenseCategoryData, setExpenseCategoryData] = useState<any[]>([]);
  const [revenueVsExpenses, setRevenueVsExpenses] = useState<any[]>([]);
  const [clientStatusData, setClientStatusData] = useState<any[]>([]);

  // Chart + stats helpers
  const calculateChartData = useCallback((revenueData: any[], projectsData: any[], clientsData: any[], expensesData: any[]) => {
    // Monthly Revenue (Last 6 months)
    const monthlyData: Record<string, number> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      monthlyData[key] = 0;
    }
    revenueData.forEach((r: any) => {
      const date = r.createdAt ? new Date(r.createdAt) : new Date();
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      if (monthlyData.hasOwnProperty(key)) {
        monthlyData[key] += r.totalContractValue || 0;
      }
    });
    setMonthlyRevenue(Object.entries(monthlyData).map(([name, value]) => ({ name, revenue: value })));

    // Project Status Distribution
    const statusCounts: Record<string, number> = {};
    projectsData.forEach((p: any) => {
      const status = p.status || 'Pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    setProjectStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));

    // Expense Categories
    const categoryCounts: Record<string, number> = {};
    expensesData.forEach((e: any) => {
      const category = e.category || 'Miscellaneous';
      categoryCounts[category] = (categoryCounts[category] || 0) + (e.amount || 0);
    });
    setExpenseCategoryData(Object.entries(categoryCounts).map(([name, value]) => ({ name, value })));

    // Revenue vs Expenses (Last 6 months)
    const revenueExpenseData: Record<string, { revenue: number; expenses: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      revenueExpenseData[key] = { revenue: 0, expenses: 0 };
    }
    revenueData.forEach((r: any) => {
      const date = r.createdAt ? new Date(r.createdAt) : new Date();
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      if (revenueExpenseData[key]) {
        revenueExpenseData[key].revenue += r.totalContractValue || 0;
      }
    });
    expensesData.forEach((e: any) => {
      const date = e.date ? new Date(e.date) : new Date();
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      if (revenueExpenseData[key]) {
        revenueExpenseData[key].expenses += e.amount || 0;
      }
    });
    setRevenueVsExpenses(Object.entries(revenueExpenseData).map(([name, data]) => ({ name, ...data })));

    // Client Status Distribution
    const clientStatusCounts: Record<string, number> = {};
    clientsData.forEach((c: any) => {
      const status = c.status || 'Lead';
      clientStatusCounts[status] = (clientStatusCounts[status] || 0) + 1;
    });
    setClientStatusData(Object.entries(clientStatusCounts).map(([name, value]) => ({ name, value })));
  }, []);

  // Define calculation functions before fetchAllData
  const calculateStats = useCallback((revenueData: any[], projectsData: any[], clientsData: any[], teamData: any[], expensesData: any[]) => {
    // Total Revenue
    const totalRevenue = revenueData.reduce((sum, r) => sum + (r.totalContractValue || 0), 0);
    
    // Total Expenses
    const totalExpenses = expensesData.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // Team Earnings (from expenses with category "Developer Payout")
    const teamEarnings = expensesData
      .filter((e: any) => e.category === 'Developer Payout')
      .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
    
    // Profit = Revenue - Expenses
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;
    
    // Cash Position = Received Amount - Expenses
    const receivedAmount = revenueData.reduce((sum, r) => {
      const advance = r.advanceAmount || 0;
      const payments = (r.paymentsReceived || []).reduce((pSum: number, p: any) => {
        const paymentDate = p.date ? new Date(p.date) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (paymentDate && paymentDate <= today) {
          return pSum + (p.amount || 0);
        }
        return pSum;
      }, 0);
      return sum + advance + payments;
    }, 0);
    const cashPosition = receivedAmount - totalExpenses;
    
    // Month Growth
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const thisMonthRevenue = revenueData
      .filter((r: any) => {
        const date = r.createdAt ? new Date(r.createdAt) : new Date();
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      })
      .reduce((sum: number, r: any) => sum + (r.totalContractValue || 0), 0);
    const lastMonthRevenue = revenueData
      .filter((r: any) => {
        const date = r.createdAt ? new Date(r.createdAt) : new Date();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      })
      .reduce((sum: number, r: any) => sum + (r.totalContractValue || 0), 0);
    const monthGrowth = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;
    
    // Overdue Invoices
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueInvoices = revenueData.filter((r: any) => {
      if (r.paymentStatus === 'Paid') return false;
      const dueDate = r.expectedPaymentDate ? new Date(r.expectedPaymentDate) : null;
      return dueDate && dueDate < today;
    }).length;
    
    // Team Utilization
    const billableCount = teamData.filter((t: any) => 
      t.availability === 'Available' || t.availability === 'Busy'
    ).length;
    const totalTeamCount = teamData.length;
    const utilizationRate = totalTeamCount > 0 ? Math.round((billableCount / totalTeamCount) * 100) : 0;
    
    // Top Earner
    const earnerMap: Record<string, number> = {};
    expensesData
      .filter((e: any) => e.category === 'Developer Payout' && e.developerPaid)
      .forEach((e: any) => {
        const name = e.developerPaid;
        earnerMap[name] = (earnerMap[name] || 0) + (e.amount || 0);
      });
    const topEarnerEntry = Object.entries(earnerMap).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
    const topEarner = topEarnerEntry 
      ? { name: topEarnerEntry[0], amount: topEarnerEntry[1] as number }
      : { name: 'N/A', amount: 0 };
    
    // Available Devs
    const availableDevs = teamData.filter((t: any) => 
      t.availability === 'Available'
    ).length;
    
    setStats({
      totalRevenue,
      teamEarnings,
      expenses: totalExpenses,
      profit,
      profitMargin,
      totalProjects: projectsData.length,
      totalClients: clientsData.length,
      cashPosition,
      monthGrowth,
      overdueInvoices,
      utilizationRate,
      billableCount,
      topEarner,
      availableDevs,
    });
    
    setTeamMembers(Array.isArray(teamData) ? teamData : []);

    // Calculate chart data
    calculateChartData(revenueData, projectsData, clientsData, expensesData);
  }, [calculateChartData]);

  const calculateRecentActivity = useCallback((projectsData: any[], clientsData: any[], revenueData: any[]) => {
    const activities: ActivityItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    projectsData
      .filter((p: any) => {
        if (p.status !== 'Completed') return false;
        const updatedAt = p.updatedAt ? new Date(p.updatedAt) : null;
        return updatedAt && updatedAt >= yesterday;
      })
      .forEach((p: any) => {
        activities.push({
          id: `project_${p._id}`,
          type: 'project_complete',
          message: `${p.name} marked complete`,
          timestamp: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          icon: '✅',
          color: 'text-green-600',
        });
      });
    
    clientsData
      .filter((c: any) => {
        const createdAt = c.createdAt ? new Date(c.createdAt) : null;
        return createdAt && createdAt >= yesterday;
      })
      .forEach((c: any) => {
        activities.push({
          id: `client_${c._id}`,
          type: 'new_client',
          message: `New client ${c.name} (${c.status || 'Lead'})`,
          timestamp: c.createdAt ? new Date(c.createdAt) : new Date(),
          icon: '➕',
          color: 'text-blue-600',
        });
      });
    
    revenueData.forEach((r: any) => {
      if (r.paymentsReceived && Array.isArray(r.paymentsReceived)) {
        r.paymentsReceived.forEach((payment: any) => {
          const paymentDate = payment.date ? new Date(payment.date) : null;
          if (paymentDate && paymentDate >= yesterday && paymentDate < new Date()) {
            activities.push({
              id: `payment_${r._id}_${payment.date}`,
              type: 'payment',
              message: `Paid ${formatINR(payment.amount)} for ${r.project}`,
              timestamp: paymentDate,
              icon: '💰',
              color: 'text-emerald-600',
            });
          }
        });
      }
    });
    
    projectsData
      .filter((p: any) => {
        const createdAt = p.createdAt ? new Date(p.createdAt) : null;
        return createdAt && createdAt >= yesterday;
      })
      .forEach((p: any) => {
        activities.push({
          id: `project_new_${p._id}`,
          type: 'project_created',
          message: `New project ${p.name} created`,
          timestamp: p.createdAt ? new Date(p.createdAt) : new Date(),
          icon: '📋',
          color: 'text-purple-600',
        });
      });
    
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setRecentActivity(activities.slice(0, 10));
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        
        const revenueData = localStorageUtils.getRevenue() || [];
        const projectsData = localStorageUtils.getProjects() || [];
        const clientsData = localStorageUtils.getClients() || [];
        const teamData = localStorageUtils.getTeam() || [];
        const expensesData = JSON.parse(localStorage.getItem('rootkit_expenses') || '[]');

        setRevenue(Array.isArray(revenueData) ? revenueData : []);
        setExpenses(Array.isArray(expensesData) ? expensesData : []);

        calculateStats(revenueData, projectsData, clientsData, teamData, expensesData);
        calculateRecentActivity(projectsData, clientsData, revenueData);
        
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  }, [calculateStats, calculateRecentActivity]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

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
        {/* Hero Banner Section - Inspired by Reference Design */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-xl">
          <div className="relative z-10">
            <div className="mb-2">
              <span className="text-sm font-semibold uppercase tracking-wider opacity-90">AGENCY DASHBOARD</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {getGreeting()}, Admin 👋
            </h1>
            <p className="text-lg opacity-90 mb-6">
              Continue Your Journey And Achieve Your Target
            </p>
            <button
              onClick={() => router.push('/revenue')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-full font-semibold hover:bg-purple-50 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              View Revenue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
        </div>

        {/* Interactive Stats Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StatsWidget />
        </div>

        {/* Section 1: Quick Stats Cards - Compact Design */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Revenue */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/revenue')}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 mb-1">Revenue</p>
            <p className="text-xl font-bold text-slate-900 leading-tight">{formatINR(stats.totalRevenue)}</p>
            <p className="text-xs text-slate-400 mt-1">All time</p>
          </div>

          {/* Team Earnings */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/team')}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 mb-1">Team</p>
            <p className="text-xl font-bold text-slate-900 leading-tight">{formatINR(stats.teamEarnings)}</p>
            <p className="text-xs text-slate-400 mt-1">Payouts</p>
          </div>

          {/* Expenses */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/revenue')}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Receipt className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 mb-1">Expenses</p>
            <p className="text-xl font-bold text-slate-900 leading-tight">{formatINR(stats.expenses)}</p>
            <p className="text-xs text-slate-400 mt-1">Total</p>
          </div>

          {/* Profit */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/revenue')}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 mb-1">Profit</p>
            <p className="text-xl font-bold text-slate-900 leading-tight">{stats.profitMargin}%</p>
            <p className="text-xs text-slate-400 mt-1">{formatINR(stats.profit)}</p>
          </div>

          {/* Projects */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/projects')}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FolderKanban className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 mb-1">Projects</p>
            <p className="text-xl font-bold text-slate-900 leading-tight">{stats.totalProjects}</p>
            <p className="text-xs text-slate-400 mt-1">Active</p>
          </div>

          {/* Clients */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/clients')}>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Users className="w-4 h-4 text-teal-600" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 mb-1">Clients</p>
            <p className="text-xl font-bold text-slate-900 leading-tight">{stats.totalClients}</p>
            <p className="text-xs text-slate-400 mt-1">Total</p>
          </div>
        </div>

        {/* Section 2: Charts Grid - Clean Design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Chart */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  formatter={(value: number) => formatINR(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Project Status Distribution */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Project Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue vs Expenses */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue vs Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  formatter={(value: number) => formatINR(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#F59E0B" strokeWidth={2} name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Expense Categories */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Expense Categories</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatINR(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Client Status Distribution */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Client Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clientStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#14B8A6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 3: Financial Snapshot (3 Key Metrics) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cash Position */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/revenue')}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-100 rounded-xl flex-shrink-0 shadow-sm">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Cash Position</p>
                <p className="text-xs text-slate-500">Available funds</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-2">{formatINR(stats.cashPosition)}</p>
            <p className="text-xs text-slate-500">After expenses</p>
          </div>

          {/* Month Growth */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/revenue')}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl flex-shrink-0 shadow-sm ${stats.monthGrowth >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {stats.monthGrowth >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Month Growth</p>
                <p className="text-xs text-slate-500">Revenue change</p>
              </div>
            </div>
            <p className={`text-3xl font-bold mb-2 ${stats.monthGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.monthGrowth >= 0 ? '+' : ''}{stats.monthGrowth}%
            </p>
            <p className="text-xs text-slate-500">vs Last month</p>
          </div>

          {/* Action Items */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/revenue?status=Overdue')}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-xl flex-shrink-0 shadow-sm">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Action Items</p>
                <p className="text-xs text-slate-500">Requires attention</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-2">{stats.overdueInvoices}</p>
            <p className="text-xs text-slate-500">Overdue invoices</p>
          </div>
        </div>

        {/* Section 4: Team Pulse (People Overview) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Utilization */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/team')}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-100 rounded-xl flex-shrink-0 shadow-sm">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Utilization</p>
                <p className="text-xs text-slate-500">Team capacity</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-2">{stats.utilizationRate}%</p>
            <p className="text-xs text-slate-500">{stats.billableCount}/{teamMembers.length} people billable</p>
          </div>

          {/* Top Earner */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/team')}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-purple-100 rounded-xl flex-shrink-0 shadow-sm">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Top Earner</p>
                <p className="text-xs text-slate-500">This period</p>
              </div>
            </div>
            <p className="text-lg font-bold text-slate-900 mb-1">{stats.topEarner.name}</p>
            <p className="text-xs text-slate-500">{formatINR(stats.topEarner.amount)}</p>
          </div>

          {/* Available */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1" onClick={() => router.push('/team?availability=Available')}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-green-100 rounded-xl flex-shrink-0 shadow-sm">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Available</p>
                <p className="text-xs text-slate-500">Ready to work</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-2">{stats.availableDevs}</p>
            <p className="text-xs text-slate-500">Devs free next week</p>
          </div>

          {/* View People Link */}
          <Link href="/team" className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm transition-all duration-300 ease-out cursor-pointer hover:shadow-lg hover:-translate-y-1 flex items-center justify-center flex-col">
            <div className="p-2.5 bg-teal-100 rounded-xl flex-shrink-0 shadow-sm mb-4">
              <UserPlus className="w-6 h-6 text-teal-600" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-2">View People</p>
            <p className="text-xs text-slate-500 text-center">Manage team members</p>
            <ArrowRight className="w-5 h-5 text-teal-600 mt-2" />
          </Link>
        </div>

        {/* Section 5: Recent Activity (Feed) */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Recent Activity</h2>
              <p className="text-sm text-slate-500">Last 24 hours</p>
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
      </div>
    </Layout>
  );
}
