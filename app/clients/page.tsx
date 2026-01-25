'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { Plus, Mail, Phone, MapPin, TrendingUp, AlertCircle, UserPlus, Users, CheckSquare, Send, Tag, Download, X, Calendar, DollarSign, FileText, UserCircle, Edit, Trash2, Crown, Award, Medal, Circle, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/components/ui/Toast';
import { useApp } from '@/lib/contexts/AppContext';
import { formatINR } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';

/**
 * Clients Management Page
 * CRUD operations for clients with Revenue and Assigned Developers
 */

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company name is required').or(z.string().optional()), // Allow optional for migration
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['Lead', 'Proposal', 'Active', 'Overdue', 'Won', 'Lost', 'Inactive']).default('Lead'),
  revenue: z.number().min(0, 'Revenue must be positive').optional(),
  assignedDevelopers: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  contactPerson?: string;
  address?: string;
  status?: 'Lead' | 'Proposal' | 'Active' | 'Overdue' | 'Won' | 'Lost' | 'Inactive';
  clientTier?: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  revenue?: number;
  assignedDevelopers?: string[];
  notes?: string;
}

export default function ClientsPage() {
  const { clients, team, addClient, updateClient, deleteClient, setClients } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      status: 'Lead',
      assignedDevelopers: [],
    },
  });

  const selectedDevelopers = watch('assignedDevelopers') || [];

  const fetchProjects = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        const data = localStorageUtils.getProjects();
        setProjects(Array.isArray(data) ? data : []);
        return;
      }
      
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  }, []);

  const fetchRevenue = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        const data = localStorageUtils.getRevenue();
        setRevenue(Array.isArray(data) ? data : []);
        return;
      }
      
      const res = await fetch('/api/revenue');
      const data = await res.json();
      setRevenue(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching revenue:', error);
      setRevenue([]);
    }
  }, []);

  // Calculate pending amount for a client
  // Formula: Total Contract Value - Advance Amount - (Past Payments Only)
  // Future payments are NOT subtracted because they're still pending
  const calculatePendingAmount = (clientName: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const clientRevenue = revenue.filter(r => r.client === clientName);
    return clientRevenue.reduce((sum, r) => {
      const totalValue = r.totalContractValue || 0;
      const advanceAmount = r.advanceAmount || 0;
      
      // Only count past payments (received payments with date <= today)
      // Future payments are NOT subtracted because they're still pending
      const pastPayments = (r.paymentsReceived || []).filter((payment: { amount: number; date: string }) => {
        if (!payment.date) return false;
        const paymentDate = new Date(payment.date);
        paymentDate.setHours(0, 0, 0, 0);
        return paymentDate <= today;
      });
      
      const pastPaymentsSum = pastPayments.reduce((s: number, p: { amount: number; date: string }) => s + (p.amount || 0), 0);
      
      // Pending = Total - Advance - Past Payments Only
      // Future payments remain in pending amount
      return sum + (totalValue - advanceAmount - pastPaymentsSum);
    }, 0);
  };

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      // Use API route (fetches from MongoDB)
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch clients from API');
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [setClients]);

  useEffect(() => {
    fetchClients();
    fetchRevenue();
    fetchProjects();
  }, [fetchClients, fetchRevenue, fetchProjects]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      // Use API route (saves to MongoDB)
      const url = selectedClient ? `/api/clients/${selectedClient._id}` : '/api/clients';
      const method = selectedClient ? 'PUT' : 'POST';

      // Ensure company is set (use name if company is empty for backward compatibility)
      const companyName = data.company || data.name || '';
      
      const clientData = {
        ...data,
        company: companyName,
        status: data.status || 'Lead',
        assignedDevelopers: data.assignedDevelopers || [],
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });

      if (res.ok) {
        const savedClient = await res.json();
        if (selectedClient) {
          updateClient(selectedClient._id, savedClient);
          toast('Client updated successfully!', 'success');
        } else {
          addClient(savedClient);
          toast('Client added successfully!', 'success');
        }
        await fetchClients();
        setIsModalOpen(false);
        reset();
        setSelectedClient(null);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to save client' }));
        toast(errorData.error || 'Failed to save client. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error saving client:', error);
      toast('An error occurred. Please try again.', 'error');
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setValue('name', client.name);
    setValue('email', client.email);
    setValue('phone', client.phone || '');
    setValue('company', client.company || '');
    setValue('contactPerson', client.contactPerson || '');
    setValue('address', client.address || '');
    setValue('revenue', client.revenue || 0);
    setValue('assignedDevelopers', client.assignedDevelopers || []);
    setValue('notes', client.notes || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (client: Client) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      // In mock mode, use localStorage directly
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        localStorageUtils.deleteClient(client._id);
        deleteClient(client._id);
        await fetchClients();
        toast('Client deleted successfully!', 'success');
        return;
      }
      
      // Fallback to API
      const res = await fetch(`/api/clients/${client._id}`, { method: 'DELETE' });
      if (res.ok) {
        deleteClient(client._id);
        toast('Client deleted successfully!', 'success');
        await fetchClients();
      } else {
        toast('Failed to delete client.', 'error');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast('An error occurred while deleting.', 'error');
    }
  };

  // Calculate KPI metrics
  const kpiMetrics = useMemo(() => {
    // Top Client (by revenue)
    const clientRevenue = clients.map(client => {
      const clientRev = revenue.filter(r => r.client === client.name);
      const totalRevenue = clientRev.reduce((sum, r) => sum + (r.totalContractValue || 0), 0);
      return { name: client.name, revenue: totalRevenue };
    });
    const topClient = clientRevenue.sort((a, b) => b.revenue - a.revenue)[0];

    // Overdue Amount (revenue with overdue status)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueRevenue = revenue.filter(r => {
      if (r.paymentStatus === 'Overdue') return true;
      if (r.expectedPaymentDate) {
        const expectedDate = new Date(r.expectedPaymentDate);
        expectedDate.setHours(0, 0, 0, 0);
        return expectedDate < today && r.paymentStatus !== 'Paid';
      }
      return false;
    });
    const overdueAmount = overdueRevenue.reduce((sum, r) => sum + (r.balanceDue || 0), 0);
    const overdueCount = overdueRevenue.length;

    // New Clients (this month)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const newClients = clients.filter(client => {
      if (!client._id) return false;
      // Check if client was created this month (mock: check if it's in recent clients list)
      // For now, we'll use a simple heuristic
      return true; // Simplified - in real app, check createdAt
    }).length;
    const newClientsThisMonth = Math.min(newClients, clients.length); // Placeholder

    // Retention % (Active clients / Total clients)
    const activeClients = clients.filter(c => c.status === 'Active').length;
    const retentionRate = clients.length > 0 ? Math.round((activeClients / clients.length) * 100) : 0;

    return {
      topClient: topClient || { name: 'N/A', revenue: 0 },
      overdueAmount,
      overdueCount,
      newClients: newClientsThisMonth,
      retentionRate,
    };
  }, [clients, revenue]);

  // Status pipeline counts
  const statusCounts = useMemo(() => {
    const leads = clients.filter((c: Client) => c.status === 'Lead').length;
    const proposal = clients.filter((c: Client) => c.status === 'Proposal').length;
    const active = clients.filter((c: Client) => c.status === 'Active').length;
    const overdue = clients.filter((c: Client) => c.status === 'Overdue').length;
    const won = clients.filter((c: Client) => c.status === 'Won').length;
    const lost = clients.filter((c: Client) => c.status === 'Lost').length;
    const inactive = clients.filter((c: Client) => c.status === 'Inactive').length;
    return { leads, proposal, active, overdue, won, lost, inactive };
  }, [clients]);

  // Handle row click for detail modal
  const handleRowClick = (client: Client) => {
    setDetailClient(client);
    setIsDetailModalOpen(true);
  };

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map(c => c._id)));
    }
  };

  const handleBulkSendReminder = () => {
    if (selectedClients.size === 0) {
      toast('Please select clients first', 'error');
      return;
    }
    toast(`Reminder sent to ${selectedClients.size} client(s)`, 'success');
  };

  const handleBulkTagVIP = () => {
    if (selectedClients.size === 0) {
      toast('Please select clients first', 'error');
      return;
    }
    // In a real app, this would update the client records
    toast(`${selectedClients.size} client(s) tagged as VIP`, 'success');
  };

  const handleBulkExport = () => {
    if (selectedClients.size === 0) {
      toast('Please select clients first', 'error');
      return;
    }
    // Export logic would go here
    toast(`Exporting ${selectedClients.size} client(s)...`, 'success');
  };

  const columns = [
    {
      key: 'select',
      header: '',
      render: (row: Client) => (
        <input
          type="checkbox"
          checked={selectedClients.has(row._id)}
          onChange={(e) => {
            const newSelected = new Set(selectedClients);
            if (e.target.checked) {
              newSelected.add(row._id);
            } else {
              newSelected.delete(row._id);
            }
            setSelectedClients(newSelected);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
      ),
    },
    { 
      key: 'name', 
      header: 'Name',
      render: (row: Client) => (
        <button
          onClick={() => handleRowClick(row)}
          className="text-left text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          {row.name}
        </button>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'company', header: 'Company' },
    {
      key: 'pendingAmount',
      header: 'Pending Amount',
      render: (row: Client) => {
        const pendingAmount = calculatePendingAmount(row.name);
        return (
          <div className="text-sm font-semibold text-text-primary">
            {pendingAmount > 0 ? formatINR(pendingAmount) : '₹0'}
          </div>
        );
      },
    },
  ];

  // Filter clients by status and search
  const filteredClients = useMemo(() => {
    let filtered = clients;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c: Client) => c.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((c: Client) =>
        c.name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.company?.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [clients, statusFilter, searchTerm]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // Get client details for modal
  const getClientDetails = (client: Client) => {
    const clientProjects = projects.filter(p => p.client === client.name);
    const clientRevenue = revenue.filter(r => r.client === client.name);
    const totalRevenue = clientRevenue.reduce((sum, r) => sum + (r.totalContractValue || 0), 0);
    const pendingAmount = calculatePendingAmount(client.name);
    
    // Last contact date (from revenue payments or project updates)
    let lastContactDate: Date | null = null;
    clientRevenue.forEach(r => {
      if (r.paymentsReceived && r.paymentsReceived.length > 0) {
        r.paymentsReceived.forEach((p: any) => {
          if (p.date) {
            const date = new Date(p.date);
            if (!lastContactDate || date > lastContactDate) {
              lastContactDate = date;
            }
          }
        });
      }
    });

    return {
      projects: clientProjects,
      totalRevenue,
      pendingAmount,
      lastContactDate,
    };
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Card - Matching Revenue Page Design */}
        <div className="bg-white rounded-xl py-4 px-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="p-1.5 bg-teal-100 rounded-lg">
                  <UserCircle className="w-5 h-5 text-teal-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 font-display leading-tight">Clients</h1>
              </div>
              <p className="text-xs text-slate-500 leading-tight">Manage your clients and customers</p>
            </div>
            <button
              onClick={() => {
                reset();
                setSelectedClient(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Client
            </button>
          </div>
        </div>

        {/* 4 KPI Cards - Matching Revenue Page Design */}
        <div
          className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          style={{ minHeight: '140px', scrollbarWidth: 'thin' }}
        >
          {/* Card 1 - Top Client */}
          <div
            className="bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-300 ease-out relative z-10 flex-1 cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] active:translate-y-0 p-4"
            style={{ display: 'flex', flexDirection: 'column', minWidth: '200px' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-100 rounded-xl flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-slate-500">Top Client</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-3 leading-tight">{kpiMetrics.topClient.name}</p>
            <p className="text-xs text-slate-500 truncate">{formatINR(kpiMetrics.topClient.revenue)}</p>
          </div>

          {/* Card 2 - Overdue Amount */}
          <div
            className="bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-300 ease-out relative z-10 flex-1 cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] active:translate-y-0 p-4"
            style={{ display: 'flex', flexDirection: 'column', minWidth: '200px' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-xl flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-sm font-semibold text-slate-500">Overdue Amount</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-3 leading-tight">{formatINR(kpiMetrics.overdueAmount)}</p>
            <p className="text-xs text-slate-500 truncate">{kpiMetrics.overdueCount} invoices</p>
          </div>

          {/* Card 3 - New Clients */}
          <div
            className="bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-300 ease-out relative z-10 flex-1 cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] active:translate-y-0 p-4"
            style={{ display: 'flex', flexDirection: 'column', minWidth: '200px' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-green-100 rounded-xl flex-shrink-0">
                <UserPlus className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-semibold text-slate-500">New Clients</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-3 leading-tight">+{kpiMetrics.newClients}</p>
            <p className="text-xs text-slate-500 truncate">This month</p>
          </div>

          {/* Card 4 - Retention %} */}
          <div
            className="bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-300 ease-out relative z-10 flex-1 cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] active:translate-y-0 p-4"
            style={{ display: 'flex', flexDirection: 'column', minWidth: '200px' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-purple-100 rounded-xl flex-shrink-0">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm font-semibold text-slate-500">Retention %</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-3 leading-tight">{kpiMetrics.retentionRate}%</p>
            <p className="text-xs text-slate-500 truncate">Active clients</p>
          </div>
        </div>

        {/* Status Pipeline - Simple Design */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Client Status Pipeline</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({clients.length})
            </button>
            <button
              onClick={() => setStatusFilter('lead')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'lead'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Lead ({statusCounts.leads})
            </button>
            <button
              onClick={() => setStatusFilter('proposal')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'proposal'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Proposal ({statusCounts.proposal})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active ({statusCounts.active})
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'overdue'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overdue ({statusCounts.overdue})
            </button>
            <button
              onClick={() => setStatusFilter('won')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'won'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Won ({statusCounts.won})
            </button>
            <button
              onClick={() => setStatusFilter('lost')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'lost'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Lost ({statusCounts.lost})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactive ({statusCounts.inactive})
            </button>
          </div>
        </div>

        {/* DataTable with Custom Search Bar (includes Select All) */}
        <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          {/* Custom Search Bar with Select All */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-3">
            {selectedClients.size > 0 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClients.size === filteredClients.length && filteredClients.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-blue-900 whitespace-nowrap">
                    {selectedClients.size} selected
                  </span>
                </label>
                <div className="h-6 w-px bg-slate-300"></div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkSendReminder}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                    title="Send Reminder"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Reminder
                  </button>
                  <button
                    onClick={handleBulkTagVIP}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                    title="Tag VIP"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    VIP
                  </button>
                  <button
                    onClick={handleBulkExport}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                    title="Export"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                  <button
                    onClick={() => setSelectedClients(new Set())}
                    className="px-2 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                    title="Clear Selection"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="h-6 w-px bg-slate-300"></div>
              </div>
            )}
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium flex-1"
            />
          </div>

          {/* Table - Matching Revenue Page Design */}
          <div className="overflow-x-auto">
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <thead className="bg-background border-b border-border">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={String(col.key)}
                      className="px-2 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider"
                    >
                      {col.header}
                    </th>
                  ))}
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-text-secondary">
                      <div className="flex flex-col items-center gap-2">
                        <UserCircle className="w-12 h-12 text-text-secondary opacity-50" />
                        <p className="text-sm font-medium">No clients found</p>
                        <p className="text-xs">Click &quot;New Client&quot; to create your first client</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((row) => (
                    <tr
                      key={row._id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {columns.map((col) => (
                        <td key={String(col.key)} className="px-2 py-2 text-sm text-text-primary">
                          <div className="truncate" title={col.render ? String(col.render(row)) : String(row[col.key as keyof typeof row] || '')}>
                            {col.render ? col.render(row) : String(row[col.key as keyof typeof row] || '')}
                          </div>
                        </td>
                      ))}
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(row)}
                            className="p-1 text-primary-500 hover:bg-primary-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client Detail Modal */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setDetailClient(null);
          }}
          title={detailClient ? `Client Details: ${detailClient.name}` : 'Client Details'}
          size="lg"
        >
          {detailClient && (() => {
            const details = getClientDetails(detailClient);
            return (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {detailClient.email}
                    </div>
                  </div>
                  {detailClient.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Phone className="w-4 h-4 text-gray-500" />
                        {detailClient.phone}
                      </div>
                    </div>
                  )}
                </div>

                {detailClient.company && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <div className="text-gray-900">{detailClient.company}</div>
                  </div>
                )}

                {detailClient.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <div className="flex items-start gap-2 text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      {detailClient.address}
                    </div>
                  </div>
                )}

                {/* Projects List */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Projects ({details.projects.length})
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {details.projects.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {details.projects.map((project: any) => (
                          <li key={project._id} className="p-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{project.name}</span>
                              <span className="text-sm text-gray-600">{project.status}</span>
                            </div>
                            {project.budget && (
                              <div className="text-sm text-gray-500 mt-1">
                                Budget: {formatINR(project.budget)}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">No projects assigned</div>
                    )}
                  </div>
                </div>

                {/* Revenue & Pending */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-green-700 mb-1 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Total Revenue
                    </label>
                    <div className="text-2xl font-bold text-green-900">{formatINR(details.totalRevenue)}</div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-orange-700 mb-1">Pending Amount</label>
                    <div className="text-2xl font-bold text-orange-900">{formatINR(details.pendingAmount)}</div>
                  </div>
                </div>

                {/* Last Contact */}
                {details.lastContactDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Last Contact
                    </label>
                    <div className="text-gray-900">{formatDate(details.lastContactDate)}</div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleEdit(detailClient);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Edit Client
                  </button>
                  <button
                    onClick={() => {
                      if (detailClient.email) {
                        window.location.href = `mailto:${detailClient.email}`;
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Send Email
                  </button>
                  {detailClient.phone && (
                    <button
                      onClick={() => {
                        window.location.href = `tel:${detailClient.phone}`;
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Call
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>

        {/* Add/Edit Client Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            reset();
            setSelectedClient(null);
          }}
          title={selectedClient ? 'Edit Client' : 'New Client'}
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Contact Person <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="John Doe"
                    className="w-full"
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company"
                    {...register('company')}
                    placeholder="Company Inc."
                    className="w-full"
                  />
                  {errors.company && <p className="text-xs text-red-600 mt-1">{errors.company.message}</p>}
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="email@company.com"
                    className="w-full"
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    type="tel"
                    placeholder="+1 234 567 8900"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                  Address
                </Label>
                <Textarea
                  id="address"
                  {...register('address')}
                  rows={2}
                  placeholder="Street address, City, State, ZIP"
                  className="w-full"
                />
              </div>
            </div>

            <Separator />

            {/* Status Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Status</h3>
              
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Client Status
                </Label>
                <Select
                  value={watch('status') || 'Lead'}
                  onValueChange={(value) => setValue('status', value as any)}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lead">Lead</SelectItem>
                    <SelectItem value="Proposal">Proposal</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                    <SelectItem value="Won">Won</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Assigned Developers Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Team Assignment</h3>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Assigned Developers
                </Label>
                <div className="rounded-md border border-gray-300 bg-white p-3 max-h-48 overflow-y-auto">
                  {team.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No team members available</p>
                  ) : (
                    <div className="space-y-2">
                      {team.map((member) => {
                        const isSelected = selectedDevelopers.includes(member._id);
                        return (
                          <label
                            key={member._id}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const current = selectedDevelopers || [];
                                if (e.target.checked) {
                                  setValue('assignedDevelopers', [...current, member._id]);
                                } else {
                                  setValue('assignedDevelopers', current.filter((id: string) => id !== member._id));
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">{member.name}</span>
                              <span className="text-xs text-gray-500 ml-2">({member.role})</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">Select team members assigned to this client</p>
              </div>
            </div>

            <Separator />

            {/* Notes Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Additional Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  rows={4}
                  placeholder="Add any additional notes or information about this client..."
                  className="w-full"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                  setSelectedClient(null);
                }}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-6"
              >
                {selectedClient ? 'Update Client' : 'Create Client'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
