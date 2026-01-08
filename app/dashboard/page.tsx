'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { DollarSign, FolderKanban, Users, Calendar, ArrowUpRight, ArrowDownRight, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

/**
 * Light Mode Dashboard
 * Clean layout, readable colors, proper spacing
 */
export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProjects: 0,
    totalClients: 0,
    activeDeadlines: 0,
    newClients: 0,
    growth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // In mock mode, use localStorage directly
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        
        const revenue = localStorageUtils.getRevenue();
        const projects = localStorageUtils.getProjects();
        const clients = localStorageUtils.getClients();
        const events = localStorageUtils.getEvents();
        
        // Calculate stats from localStorage data
        // Total Revenue = sum of all revenue.totalContractValue
        const totalRevenue = Array.isArray(revenue) 
          ? revenue.reduce((sum: number, r: any) => sum + (Number(r.totalContractValue) || 0), 0)
          : 0;
        const totalProjects = Array.isArray(projects) ? projects.length : 0;
        const totalClients = Array.isArray(clients) ? clients.length : 0;
        const activeDeadlines = Array.isArray(events) 
          ? events.filter((e: any) => {
              if (!e.deadline) return false;
              const deadline = new Date(e.deadline);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return deadline >= today;
            }).length
          : 0;
        
        // Calculate new clients (this month)
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const newClients = Array.isArray(clients)
          ? clients.filter((c: any) => {
              if (!c.createdAt) return false;
              const created = new Date(c.createdAt);
              return created.getMonth() === thisMonth && created.getFullYear() === thisYear;
            }).length
          : 0;
        
        setStats({
          totalRevenue,
          totalProjects,
          totalClients,
          activeDeadlines,
          newClients,
          growth: totalClients > 0 ? Math.round((newClients / totalClients) * 100) : 0,
        });
        setLoading(false);
        return;
      }
      
      // Fallback to API
      const [revenueRes, projectsRes, clientsRes, deadlinesRes] = await Promise.all([
        fetch('/api/revenue/stats'),
        fetch('/api/projects/stats'),
        fetch('/api/clients/stats'),
        fetch('/api/events/deadlines'),
      ]);

      const revenue = await revenueRes.json();
      const projects = await projectsRes.json();
      const clients = await clientsRes.json();
      const deadlines = await deadlinesRes.json();

      setStats({
        totalRevenue: revenue.total || 0,
        totalProjects: projects.total || 0,
        totalClients: clients.total || 0,
        activeDeadlines: deadlines.count || 0,
        newClients: clients.leads || 0,
        growth: clients.total > 0 ? Math.round((clients.leads / clients.total) * 100) : 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
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
        {/* Header Card - Matching Revenue Page Design */}
        <div className="card-premium py-4 px-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <LayoutDashboard className="w-5 h-5 text-primary-500" />
                <h1 className="text-xl font-bold text-text-primary font-display leading-tight">Dashboard</h1>
              </div>
              <p className="text-xs text-text-secondary leading-tight">Welcome back! Here's what's happening today.</p>
            </div>
          </div>
        </div>

        {/* KPI Cards Grid - Light Mode Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue Card */}
          <div className="card-premium card-premium-hover p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-500 rounded-xl shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" />
                <span>+32%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-slate-900 mb-1">
              ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-2">From last period</p>
          </div>

          {/* Total Projects Card */}
          <div className="card-premium card-premium-hover p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-slate-700 rounded-xl shadow-md">
                <FolderKanban className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" />
                <span>+7%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-2">Total Projects</p>
            <p className="text-3xl font-bold text-slate-900 mb-1">{stats.totalProjects}</p>
            <p className="text-xs text-slate-500 mt-2">Active and completed</p>
          </div>

          {/* Total Customers Card */}
          <div className="card-premium card-premium-hover p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-xl shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" />
                <span>+{stats.growth}%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-2">Total Customers</p>
            <p className="text-3xl font-bold text-slate-900 mb-1">{stats.totalClients.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-2">vs Last Month</p>
          </div>

          {/* Active Deadlines Card */}
          <div className="card-premium card-premium-hover p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-orange-500 rounded-xl shadow-md">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
                <ArrowDownRight className="w-4 h-4" />
                <span>-2%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-2">Active Deadlines</p>
            <p className="text-3xl font-bold text-slate-900 mb-1">{stats.activeDeadlines}</p>
            <p className="text-xs text-slate-500 mt-2">Requires attention</p>
          </div>
        </div>

        {/* Customer Overview Section - Light Mode */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1 font-display">Customer Overview</h2>
              <p className="text-sm text-slate-600">All time statistics</p>
            </div>
            <select className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
              <option>Month</option>
              <option>Week</option>
              <option>Year</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-medium text-slate-600 mb-1">New Customer</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-slate-900">{stats.newClients}</p>
                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+7%</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">vs Last Month</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-medium text-slate-600 mb-1">Total Customer</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-slate-900">{stats.totalClients.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+2%</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">vs Last Year</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-medium text-slate-600 mb-1">Total Order</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-slate-900">{stats.totalProjects}</p>
                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+21%</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">vs Last Month</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-medium text-slate-600 mb-1">Total Value</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-slate-900">${stats.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+51%</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1">vs Last Month</p>
            </div>
          </div>

          {/* Chart Placeholder - Light Mode */}
          <div className="h-64 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-slate-600 font-medium">Monthly Revenue Chart</p>
              <p className="text-xs text-slate-500 mt-1">Coming soon</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid - Light Mode */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/projects"
            className="group card-premium card-premium-hover p-6"
          >
            <div className="p-4 bg-blue-500 rounded-xl w-fit mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
              <FolderKanban className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">Projects</h3>
            <p className="text-slate-600 text-sm">Manage all your projects and track progress</p>
            <div className="mt-4 flex items-center text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
              <span>View Projects</span>
              <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/clients"
            className="group card-premium card-premium-hover p-6"
          >
            <div className="p-4 bg-green-500 rounded-xl w-fit mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">Clients</h3>
            <p className="text-slate-600 text-sm">Manage your clients and relationships</p>
            <div className="mt-4 flex items-center text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
              <span>View Clients</span>
              <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/team"
            className="group card-premium card-premium-hover p-6"
          >
            <div className="p-4 bg-orange-500 rounded-xl w-fit mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">Team</h3>
            <p className="text-slate-600 text-sm">View and manage team members</p>
            <div className="mt-4 flex items-center text-blue-600 text-sm font-medium group-hover:gap-2 transition-all">
              <span>View Team</span>
              <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
