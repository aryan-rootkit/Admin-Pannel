'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { Plus, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from '@/components/ui/Toast';

/**
 * Revenue & Finance Page
 * Tracks revenue, expenses, and invoices with charts and export functionality
 */

const revenueSchema = z.object({
  type: z.enum(['income', 'expense', 'invoice']),
  amount: z.number().min(0, 'Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  status: z.enum(['pending', 'paid', 'overdue']).optional(),
  invoiceNumber: z.string().optional(),
});

type RevenueFormData = z.infer<typeof revenueSchema>;

interface Revenue {
  _id: string;
  type: 'income' | 'expense' | 'invoice';
  amount: number;
  description: string;
  date: string;
  status?: 'pending' | 'paid' | 'overdue';
  invoiceNumber?: string;
}

export default function RevenuePage() {
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingInvoices: 0,
    totalExpenses: 0,
    netRevenue: 0,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<RevenueFormData>({
    resolver: zodResolver(revenueSchema),
    defaultValues: {
      type: 'income',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    fetchRevenue();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [revenue]);

  const fetchRevenue = async () => {
    try {
      const res = await fetch('/api/revenue');
      const data = await res.json();
      // Ensure data is always an array
      setRevenue(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching revenue:', error);
      setRevenue([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    // Ensure revenue is an array
    const revenueArray = Array.isArray(revenue) ? revenue : [];
    
    const totalEarnings = revenueArray
      .filter((r) => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const pendingInvoices = revenueArray
      .filter((r) => r.type === 'invoice' && r.status === 'pending')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const totalExpenses = revenueArray
      .filter((r) => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const netRevenue = totalEarnings - totalExpenses;

    setStats({ totalEarnings, pendingInvoices, totalExpenses, netRevenue });
  };

  const onSubmit = async (data: RevenueFormData) => {
    try {
      const url = selectedRevenue ? `/api/revenue/${selectedRevenue._id}` : '/api/revenue';
      const method = selectedRevenue ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          date: data.date, // Keep as string, MongoDB will handle it
        }),
      });

      if (res.ok) {
        const savedRevenue = await res.json();
        await fetchRevenue();
        setIsModalOpen(false);
        reset();
        setSelectedRevenue(null);
        toast(
          selectedRevenue 
            ? 'Revenue record updated successfully!' 
            : 'Revenue record created successfully!',
          'success'
        );
      } else {
        const errorData = await res.json();
        const errorMessage = errorData.error || 'Failed to save record. Please try again.';
        toast(errorMessage, 'error');
        console.error('API Error:', errorData);
      }
    } catch (error: any) {
      console.error('Error saving revenue:', error);
      toast(error?.message || 'An error occurred. Please try again.', 'error');
    }
  };

  const handleEdit = (item: Revenue) => {
    setSelectedRevenue(item);
    setValue('type', item.type);
    setValue('amount', item.amount);
    setValue('description', item.description);
    setValue('date', new Date(item.date).toISOString().split('T')[0]);
    setValue('status', item.status || 'pending');
    setValue('invoiceNumber', item.invoiceNumber || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (item: Revenue) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const res = await fetch(`/api/revenue/${item._id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchRevenue();
        toast('Revenue record deleted successfully!', 'success');
      } else {
        const errorData = await res.json();
        toast(errorData.error || 'Failed to delete record.', 'error');
      }
    } catch (error: any) {
      console.error('Error deleting revenue:', error);
      toast('An error occurred while deleting.', 'error');
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Revenue Report', 14, 20);
    
    const tableData = revenue.map((r) => [
      r.type,
      r.description,
      `$${r.amount.toLocaleString()}`,
      new Date(r.date).toLocaleDateString(),
      r.status || '-',
    ]);

    (doc as any).autoTable({
      head: [['Type', 'Description', 'Amount', 'Date', 'Status']],
      body: tableData,
      startY: 30,
    });

    doc.save('revenue-report.pdf');
  };

  const exportToCSV = () => {
    const headers = ['Type', 'Description', 'Amount', 'Date', 'Status'];
    const rows = revenue.map((r) => [
      r.type,
      r.description,
      r.amount,
      new Date(r.date).toLocaleDateString(),
      r.status || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'revenue-report.csv';
    a.click();
  };

  // Prepare chart data
  const monthlyData = revenue.reduce((acc: any, r) => {
    const month = new Date(r.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = { month, income: 0, expenses: 0 };
    }
    if (r.type === 'income') acc[month].income += r.amount;
    if (r.type === 'expense') acc[month].expenses += r.amount;
    return acc;
  }, {});

  const chartData = Object.values(monthlyData);

  const columns = [
    { key: 'type', header: 'Type' },
    { key: 'description', header: 'Description' },
    {
      key: 'amount',
      header: 'Amount',
      render: (row: Revenue) => (
        <span className={row.type === 'expense' ? 'text-red-600' : 'text-green-600'}>
          {row.type === 'expense' ? '-' : '+'}${row.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (row: Revenue) => new Date(row.date).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Revenue) =>
        row.status ? (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              row.status === 'paid'
                ? 'bg-green-100 text-green-800'
                : row.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {row.status}
          </span>
        ) : (
          '-'
        ),
    },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Revenue & Finance</h1>
            <p className="text-gray-600 text-lg">Track income, expenses, and invoices</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button
              onClick={() => {
                reset();
                setSelectedRevenue(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              New Record
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900">${stats.totalEarnings.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
                <p className="text-3xl font-bold text-gray-900">${stats.pendingInvoices.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-3xl font-bold text-gray-900">${stats.totalExpenses.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${stats.netRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" name="Income" />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Table */}
        <DataTable data={revenue} columns={columns} onEdit={handleEdit} onDelete={handleDelete} />

        {/* Add/Edit Revenue Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            reset();
            setSelectedRevenue(null);
          }}
          title={selectedRevenue ? 'Edit Record' : 'New Record'}
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                {...register('type')}
                className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="invoice">Invoice</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                {...register('description')}
                className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter description"
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
                {errors.amount && <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <div className="relative">
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>}
              </div>
            </div>

            {watch('type') === 'invoice' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
                  <input
                    {...register('invoiceNumber')}
                    className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="INV-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    {...register('status')}
                    className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                  setSelectedRevenue(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                {selectedRevenue ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
