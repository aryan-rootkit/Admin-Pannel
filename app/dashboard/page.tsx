'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import { DollarSign, FolderKanban, Users, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

/**
 * Modern Dashboard Page
 * Inspired by reference designs with enhanced metrics and visualizations
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <p className="text-gray-600 text-lg ml-4">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <FolderKanban className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Projects</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
            <p className="text-xs text-gray-500 mt-2">Active and completed</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <FolderKanban className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Side Projects</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
            <p className="text-xs text-gray-500 mt-2">Additional projects</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Visitors</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalClients.toLocaleString()}</p>
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Investment</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalProjects}</p>
            <p className="text-xs text-gray-500 mt-2">Total investments</p>
          </div>
        </div>

        {/* Customer Overview Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer Overview</h2>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalClients.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">New Users</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">{stats.newClients}</p>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Growth</p>
                  <p className="text-2xl font-bold text-green-600">+{stats.growth}%</p>
                </div>
                <div>
                  <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>Month</option>
                    <option>Week</option>
                    <option>Year</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          {/* Placeholder for monthly chart */}
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Monthly Chart - Coming Soon</p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/projects"
            className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl w-fit mb-4 shadow-md group-hover:scale-110 transition-transform">
              <FolderKanban className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Projects</h3>
            <p className="text-gray-600 text-sm">Manage all your projects</p>
          </Link>

          <Link
            href="/clients"
            className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl w-fit mb-4 shadow-md group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Clients</h3>
            <p className="text-gray-600 text-sm">Manage your clients</p>
          </Link>

          <Link
            href="/team"
            className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl w-fit mb-4 shadow-md group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Team</h3>
            <p className="text-gray-600 text-sm">View and manage team members</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
