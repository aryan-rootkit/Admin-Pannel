'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { Plus, Download, ChevronDown, ChevronUp, Edit, Trash2, Search, TrendingUp, TrendingDown, DollarSign, FileText, Mail, Send, Calculator, Users, Target } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from '@/components/ui/Toast';
import { inrToUsd, usdToInr, formatUSD, formatINR } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { useApp } from '@/lib/contexts/AppContext';

/**
 * Revenue & Finance Page - Complete Overhaul
 * Payment tracking with Project linking, Advance payments, and Collapsible graphs
 */

const revenueSchema = z.object({
  project: z.string().min(1, 'Project is required'),
  client: z.string().min(1, 'Client is required'),
  totalContractValue: z.number().min(0, 'Total contract value must be positive'),
  advanceAmount: z.number().min(0, 'Advance amount must be positive').optional(),
  advanceDate: z.string().optional(),
  paymentsReceived: z.array(z.object({
    amount: z.number().min(0, 'Payment amount must be positive'),
    date: z.string().min(1, 'Payment date is required'),
  })).optional(),
  expectedPaymentDate: z.string().min(1, 'Expected payment date is required'),
  notes: z.string().optional(),
});

const expenseSchema = z.object({
  amount: z.number().min(0, 'Amount must be positive'),
  category: z.enum(['Developer Payout', 'Software Purchase', 'Office Expenses', 'Hardware', 'Marketing Cost', 'UI/UX Design Cost', 'Miscellaneous']),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  receipt: z.string().optional(),
  // Dynamic fields based on category
  developerPaid: z.string().optional(),
  uiuxDesignerPaid: z.string().optional(),
  project: z.string().optional(),
  softwareName: z.string().optional(),
  hardwareFor: z.string().optional(),
  campaignName: z.string().optional(),
  designerName: z.string().optional(),
  notes: z.string().optional(),
});

type RevenueFormData = z.infer<typeof revenueSchema>;
type ExpenseFormData = z.infer<typeof expenseSchema>;

interface Revenue {
  _id: string;
  project: string;
  client: string;
  totalContractValue: number; // In INR
  advanceAmount?: number; // In INR
  advanceDate?: string;
  paymentsReceived?: Array<{ amount: number; date: string }>; // In INR
  balanceDue: number; // In INR (auto-calculated)
  paymentStatus: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
  expectedPaymentDate: string;
  dueDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

const EXCHANGE_RATE = 83; // 1 USD = ₹83

interface Expense {
  _id: string;
  amount: number;
  category: 'Developer Payout' | 'Software Purchase' | 'Office Expenses' | 'Hardware' | 'Marketing Cost' | 'UI/UX Design Cost' | 'Miscellaneous';
  date: string;
  description: string;
  receipt?: string;
  developerPaid?: string;
  uiuxDesignerPaid?: string;
  project?: string;
  softwareName?: string;
  hardwareFor?: string;
  campaignName?: string;
  designerName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function RevenuePage() {
  const { projects, clients } = useApp();
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalRevenueTrend: 0,
    pendingInvoices: 0,
    overdueCount: 0,
    totalAdvances: 0,
    avgAdvance: 0,
    balanceDue: 0,
    collectionRate: 0,
    totalExpenses: 0,
    netRevenue: 0,
    profitMargin: 0,
    profitMarginTrend: 0,
    teamEarnings: 0,
    teamEarningsDev: 0,
    teamEarningsUIUX: 0,
    teamEarningsDevams: 0,
    totalEarnings: 0,
    totalCollected: 0,
    upcomingAdvancesThisMonth: 0,
    upcomingAdvancesNextMonth: 0,
    futurePayments: 0,
    receivedAmount: 0,
  });
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [tableFilter, setTableFilter] = useState<string | null>(null);
  const [showMonthlyChart, setShowMonthlyChart] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'quarter' | 'ytd' | 'custom'>('month');
  const [showIncomeExpenseChart, setShowIncomeExpenseChart] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [developerSearchQuery, setDeveloperSearchQuery] = useState('');
  const [uiuxSearchQuery, setUiuxSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'revenue' | 'payouts' | 'expenses'>('revenue');
  const [developerPayouts, setDeveloperPayouts] = useState<any[]>([]);
  const [expenseFilter, setExpenseFilter] = useState<string>('all');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [expenseSortBy, setExpenseSortBy] = useState<'date' | 'amount'>('date');
  const [revenueSearchQuery, setRevenueSearchQuery] = useState('');
  const [revenueStatusFilter, setRevenueStatusFilter] = useState<string>('all');
  const [revenueClientFilter, setRevenueClientFilter] = useState<string>('all');
  const [revenueSortBy, setRevenueSortBy] = useState<'amount' | 'date'>('date');
  const [revenueSortDirection, setRevenueSortDirection] = useState<'asc' | 'desc'>('desc');
  const [revenuePaymentFilter, setRevenuePaymentFilter] = useState<'all' | 'today' | 'future' | 'overdue' | 'paid'>('all');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<RevenueFormData>({
    resolver: zodResolver(revenueSchema),
    defaultValues: {
      paymentsReceived: [],
      expectedPaymentDate: new Date().toISOString().split('T')[0],
    },
  });

  const {
    register: registerExpense,
    handleSubmit: handleSubmitExpense,
    formState: { errors: expenseErrors },
    reset: resetExpense,
    setValue: setValueExpense,
    watch: watchExpense,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'Miscellaneous',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const expenseCategory = watchExpense('category');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'paymentsReceived',
  });

  const selectedProject = watch('project');
  const totalContractValue = watch('totalContractValue') || 0;
  const advanceAmount = watch('advanceAmount') || 0;
  const paymentsReceived = watch('paymentsReceived') || [];

  // Auto-calculate balance
  const balanceDue = totalContractValue - advanceAmount - (paymentsReceived.reduce((sum, p) => sum + (p.amount || 0), 0));

  // Auto-determine payment status
  const paymentStatus = balanceDue <= 0 ? 'Paid' : 
    (advanceAmount > 0 || paymentsReceived.length > 0) ? 'Partial' : 'Pending';

  // Handle delayed tooltip display (3 seconds)
  useEffect(() => {
    if (hoveredCard) {
      // Clear any existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      // Set new timeout for 3 seconds
      hoverTimeoutRef.current = setTimeout(() => {
        setShowTooltip(hoveredCard);
      }, 3000);
    } else {
      // Clear timeout and hide tooltip when mouse leaves
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setShowTooltip(null);
    }

    // Cleanup on unmount
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [hoveredCard]);

  useEffect(() => {
    fetchRevenue();
    fetchProjects();
    fetchClients();
    fetchExpenses();
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    calculateStats();
    calculateDeveloperPayouts();
  }, [revenue, expenses, teamMembers, projects, timeFilter]);

  // Auto-fill client when project is selected
  useEffect(() => {
    if (selectedProject && projects.length > 0) {
      const project = projects.find(p => p.name === selectedProject || p._id === selectedProject);
      if (project) {
        setValue('client', project.client);
      }
    }
  }, [selectedProject, projects, setValue]);

  const fetchRevenue = async () => {
    try {
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        const data = localStorageUtils.getRevenue();
        setRevenue(Array.isArray(data) ? data : []);
        setLoading(false);
        return;
      }
      
      const res = await fetch('/api/revenue');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : [];
      } catch (e) {
        console.error('Error parsing JSON:', e);
        data = [];
      }
      setRevenue(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching revenue:', error);
      setRevenue([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        const data = localStorageUtils.getProjects();
        // Update context if needed
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchClients = async () => {
    try {
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        const data = localStorageUtils.getClients();
        // Update context if needed
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem('rootkit_expenses');
        if (data) {
          const parsed = JSON.parse(data);
          setExpenses(Array.isArray(parsed) ? parsed : []);
        } else {
          setExpenses([]);
        }
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        const data = localStorageUtils.getTeam();
        setTeamMembers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    }
  };

  // Helper function to get date range based on time filter
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeFilter) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return { start: weekStart, end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return { start: monthStart, end: monthEnd };
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 1);
        return { start: quarterStart, end: quarterEnd };
      case 'ytd':
        const ytdStart = new Date(now.getFullYear(), 0, 1);
        const ytdEnd = new Date(now.getFullYear() + 1, 0, 1);
        return { start: ytdStart, end: ytdEnd };
      default:
        return { start: null, end: null };
    }
  };

  const calculateStats = () => {
    const dateRange = getDateRange();
    let revenueArray = Array.isArray(revenue) ? revenue : [];
    let expensesArray = Array.isArray(expenses) ? expenses : [];
    
    // Filter by date range if specified (for the 6 cards)
    // Use expectedPaymentDate or advanceDate for revenue filtering
    if (dateRange.start && dateRange.end) {
      revenueArray = revenueArray.filter(r => {
        // Use expectedPaymentDate as primary, fallback to advanceDate, then createdAt
        const revenueDate = r.expectedPaymentDate 
          ? new Date(r.expectedPaymentDate)
          : r.advanceDate 
          ? new Date(r.advanceDate)
          : r.createdAt 
          ? new Date(r.createdAt)
          : null;
        
        if (!revenueDate) return false;
        return revenueDate >= dateRange.start! && revenueDate < dateRange.end!;
      });
      expensesArray = expensesArray.filter(e => {
        if (!e.date) return false;
        const expenseDate = new Date(e.date);
        return expenseDate >= dateRange.start! && expenseDate < dateRange.end!;
      });
    }
    
    // TODAY for date comparisons
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Card 1: Total Revenue = sum(all revenue amounts) - includes ALL (past + future)
    const totalRevenue = revenueArray.reduce((sum, r) => sum + (r.totalContractValue || 0), 0);
    
    // Calculate trend (mock: +12% for now, can be calculated from previous month)
    const totalRevenueTrend = 12; // Mock trend percentage
    
    // CORE FUTURE PAYMENTS LOGIC
    // Received Amount = sum(payments WHERE payment.date <= TODAY AND status = "Paid")
    const receivedAmount = revenueArray.reduce((sum, r) => {
      let received = 0;
      
      // Advance amount (if date <= today or no date)
      if (r.advanceAmount && r.advanceAmount > 0) {
        if (!r.advanceDate) {
          // No date = assume received
          received += r.advanceAmount;
        } else {
          const advanceDate = new Date(r.advanceDate);
          advanceDate.setHours(0, 0, 0, 0);
          if (advanceDate <= today) {
            received += r.advanceAmount;
          }
        }
      }
      
      // Payments received (only past payments with date <= today)
      if (r.paymentsReceived && r.paymentsReceived.length > 0) {
        const pastPayments = r.paymentsReceived.filter((p: { amount: number; date: string }) => {
          if (!p.date) return false;
          const paymentDate = new Date(p.date);
          paymentDate.setHours(0, 0, 0, 0);
          return paymentDate <= today;
        });
        received += pastPayments.reduce((s: number, p: { amount: number; date: string }) => s + (p.amount || 0), 0);
      }
      
      // Only count as received if status is "Paid"
      if (r.paymentStatus === 'Paid') {
        return sum + received;
      }
      
      return sum;
    }, 0);
    
    // Future Payments = sum(payments WHERE payment.date > TODAY)
    const futurePayments = revenueArray.reduce((sum, r) => {
      let future = 0;
      
      // Future advance amounts
      if (r.advanceAmount && r.advanceAmount > 0 && r.advanceDate) {
        const advanceDate = new Date(r.advanceDate);
        advanceDate.setHours(0, 0, 0, 0);
        if (advanceDate > today) {
          future += r.advanceAmount;
        }
      }
      
      // Future payments received
      if (r.paymentsReceived && r.paymentsReceived.length > 0) {
        const futurePaymentsList = r.paymentsReceived.filter((p: { amount: number; date: string }) => {
          if (!p.date) return false;
          const paymentDate = new Date(p.date);
          paymentDate.setHours(0, 0, 0, 0);
          return paymentDate > today;
        });
        future += futurePaymentsList.reduce((s: number, p: { amount: number; date: string }) => s + (p.amount || 0), 0);
      }
      
      // Also include balance due if expected payment date is in future
      if (r.expectedPaymentDate) {
        const expectedDate = new Date(r.expectedPaymentDate);
        expectedDate.setHours(0, 0, 0, 0);
        if (expectedDate > today && r.balanceDue > 0) {
          future += r.balanceDue;
        }
      }
      
      return sum + future;
    }, 0);
    
    // Pending Amount = sum(ALL payments WHERE: payment.date > TODAY OR (payment.date <= TODAY AND status != "Paid"))
    const pendingAmount = revenueArray.reduce((sum, r) => {
      const totalValue = r.totalContractValue || 0;
      const advanceAmount = r.advanceAmount || 0;
      
      // Calculate past payments received (date <= today)
      const pastPaymentsReceived = (r.paymentsReceived || []).filter((p: { amount: number; date: string }) => {
        if (!p.date) return false;
        const paymentDate = new Date(p.date);
        paymentDate.setHours(0, 0, 0, 0);
        return paymentDate <= today;
      }).reduce((s: number, p: { amount: number; date: string }) => s + (p.amount || 0), 0);
      
      // Past advance (if date <= today)
      let pastAdvance = 0;
      if (advanceAmount > 0) {
        if (!r.advanceDate) {
          pastAdvance = advanceAmount; // No date = assume past
        } else {
          const advanceDate = new Date(r.advanceDate);
          advanceDate.setHours(0, 0, 0, 0);
          if (advanceDate <= today) {
            pastAdvance = advanceAmount;
          }
        }
      }
      
      // If status is "Paid", nothing is pending
      if (r.paymentStatus === 'Paid') {
        return sum;
      }
      
      // Pending = Total - Past Advance - Past Payments
      const pending = totalValue - pastAdvance - pastPaymentsReceived;
      return sum + Math.max(0, pending);
    }, 0);
    
    // Overdue count
    const overdueCount = revenueArray.filter((r) => r.paymentStatus === 'Overdue').length;
    
    // Card 2: Total Advances = sum(advance column)
    const totalAdvances = revenueArray.reduce((sum, r) => sum + (r.advanceAmount || 0), 0);
    const avgAdvance = revenueArray.length > 0 ? totalAdvances / revenueArray.length : 0;
    
    // Card 3: Balance Due = Pending Amount
    const balanceDue = pendingAmount;
    
    // Collection Rate (based on received vs total)
    const collectionRate = totalRevenue > 0 ? Math.round((receivedAmount / totalRevenue) * 100) : 0;
    
    // Total Collected = Received Amount (for display)
    const totalCollected = receivedAmount;
    
    // Card 5: Total Expenses = sum(ALL expenses, not filtered by date)
    const allExpenses = Array.isArray(expenses) ? expenses : [];
    const totalExpenses = allExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    // Total Earnings = Total Revenue - Total Expenses
    const totalEarnings = totalRevenue - totalExpenses;
    
    // Net Revenue
    const netRevenue = totalEarnings;
    
    // Card 6: Profit = Received - Expenses (ONLY actual cash)
    const profitAmount = receivedAmount - totalExpenses;
    const profitMargin = receivedAmount > 0 ? Math.round((profitAmount / receivedAmount) * 100) : 0;
    const profitMarginTrend = 8; // Mock trend

    // Card 4: Team Earnings = Developer/UIUX/Devams payouts only (ALL expenses, not filtered by date)
    const teamEarningsDev = allExpenses
      .filter(e => e.category === 'Developer Payout')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const teamEarningsUIUX = allExpenses
      .filter(e => e.category === 'UI/UX Design Cost')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const teamEarningsDevams = allExpenses
      .filter(e => e.category === 'Marketing Cost' && e.campaignName === 'Call Out/Devams')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const teamEarnings = teamEarningsDev + teamEarningsUIUX + teamEarningsDevams;
    
    // Calculate upcoming advances (future-dated advance dates)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    
    const upcomingAdvancesThisMonth = revenueArray
      .filter(r => {
        if (!r.advanceDate || !r.advanceAmount || r.advanceAmount <= 0) return false;
        const advanceDate = new Date(r.advanceDate);
        advanceDate.setHours(0, 0, 0, 0);
        return advanceDate >= today && advanceDate <= endOfMonth;
      })
      .reduce((sum, r) => sum + (r.advanceAmount || 0), 0);
    
    const upcomingAdvancesNextMonth = revenueArray
      .filter(r => {
        if (!r.advanceDate || !r.advanceAmount || r.advanceAmount <= 0) return false;
        const advanceDate = new Date(r.advanceDate);
        advanceDate.setHours(0, 0, 0, 0);
        return advanceDate > endOfMonth && advanceDate <= endOfNextMonth;
      })
      .reduce((sum, r) => sum + (r.advanceAmount || 0), 0);

    setStats({ 
      totalRevenue, 
      totalRevenueTrend,
      pendingInvoices: pendingAmount, // Card 2: Pending = Future Payments + Overdue
      overdueCount,
      totalAdvances,
      avgAdvance,
      balanceDue, // Card 3: Balance Due = Pending Amount
      collectionRate,
      totalExpenses, 
      netRevenue: profitAmount, // Card 6: Profit = Received - Expenses
      profitMargin,
      profitMarginTrend,
      teamEarnings,
      teamEarningsDev,
      teamEarningsUIUX,
      teamEarningsDevams,
      totalEarnings: totalRevenue - totalExpenses, // Total Earnings = Total Revenue - Total Expenses
      totalCollected: receivedAmount, // Received Amount (actual cash)
      upcomingAdvancesThisMonth,
      upcomingAdvancesNextMonth,
      futurePayments, // New metric
      receivedAmount, // New metric
    });
  };

  const onSubmit = async (data: RevenueFormData) => {
    try {
      // Calculate balance and status
      const totalPayments = (data.paymentsReceived || []).reduce((sum, p) => sum + p.amount, 0);
      const calculatedBalance = data.totalContractValue - (data.advanceAmount || 0) - totalPayments;
      
      // Determine payment status
      let status: 'Paid' | 'Partial' | 'Pending' | 'Overdue' = 'Pending';
      if (calculatedBalance <= 0) {
        status = 'Paid';
      } else if ((data.advanceAmount || 0) > 0 || (data.paymentsReceived || []).length > 0) {
        status = 'Partial';
      } else {
        status = 'Pending';
      }

      // Check if overdue
      const dueDate = new Date(data.expectedPaymentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (status !== 'Paid' && dueDate < today) {
        status = 'Overdue';
      }

      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        
        const revenueData: any = {
          project: data.project,
          client: data.client,
          totalContractValue: Number(data.totalContractValue),
          advanceAmount: data.advanceAmount ? Number(data.advanceAmount) : 0,
          advanceDate: data.advanceDate || '',
          paymentsReceived: data.paymentsReceived || [],
          balanceDue: calculatedBalance,
          paymentStatus: status,
          expectedPaymentDate: data.expectedPaymentDate,
          dueDate: data.expectedPaymentDate,
          notes: data.notes || '',
          _id: selectedRevenue?._id || `revenue_${Date.now()}`,
          createdAt: selectedRevenue?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Edit mode: Update existing entry by ID
        if (selectedRevenue?._id) {
          // Preserve the original _id and createdAt
          revenueData._id = selectedRevenue._id;
          revenueData.createdAt = selectedRevenue.createdAt || new Date().toISOString();
          
          const existingRevenue = localStorageUtils.getRevenue();
          const updatedRevenue = existingRevenue.map((r: any) => 
            r._id === selectedRevenue._id ? revenueData : r
          );
          localStorage.setItem('rootkit_revenue', JSON.stringify(updatedRevenue));
        } else {
          // Create mode: Add new entry
          localStorageUtils.saveRevenue(revenueData);
        }
        
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
        return;
      }
    } catch (error: any) {
      console.error('Error saving revenue:', error);
      toast(error?.message || 'An error occurred. Please try again.', 'error');
    }
  };

  const handleEdit = (item: Revenue) => {
    setSelectedRevenue(item);
    setIsModalOpen(true);
    // Pre-fill ALL fields
    setValue('project', item.project);
    setValue('client', item.client);
    setValue('totalContractValue', item.totalContractValue);
    setValue('advanceAmount', item.advanceAmount || 0);
    setValue('advanceDate', item.advanceDate || '');
    setValue('paymentsReceived', item.paymentsReceived || []);
    setValue('expectedPaymentDate', item.expectedPaymentDate);
    setValue('notes', item.notes || '');
    setValue('notes', item.notes || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (item: Revenue) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        localStorageUtils.deleteRevenue(item._id);
        await fetchRevenue();
        toast('Revenue record deleted successfully!', 'success');
        return;
      }
    } catch (error: any) {
      console.error('Error deleting revenue:', error);
      toast('An error occurred while deleting.', 'error');
    }
  };

  const onSubmitExpense = async (data: ExpenseFormData) => {
    try {
      if (typeof window !== 'undefined') {
        const expenseData: Expense = {
          _id: selectedExpense?._id || `expense_${Date.now()}`,
          amount: Number(data.amount),
          category: data.category,
          date: data.date,
          description: data.description,
          receipt: data.receipt || undefined,
          developerPaid: data.developerPaid || undefined,
          uiuxDesignerPaid: data.uiuxDesignerPaid || undefined,
          project: data.project || undefined,
          softwareName: data.softwareName || undefined,
          hardwareFor: data.hardwareFor || undefined,
          campaignName: data.campaignName || undefined,
          designerName: data.designerName || undefined,
          notes: data.notes || undefined,
          createdAt: selectedExpense?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Edit mode: Update existing entry by ID
        if (selectedExpense?._id) {
          // Preserve the original _id and createdAt
          expenseData._id = selectedExpense._id;
          expenseData.createdAt = selectedExpense.createdAt || new Date().toISOString();
          
          const existing = expenses;
          const updated = existing.map((e: Expense) => 
            e._id === selectedExpense._id ? expenseData : e
          );
          localStorage.setItem('rootkit_expenses', JSON.stringify(updated));
        } else {
          // Create mode: Add new entry
          const existing = expenses;
          const updated = [...existing, expenseData];
          localStorage.setItem('rootkit_expenses', JSON.stringify(updated));
        }
        
        await fetchExpenses();
        await fetchRevenue(); // Recalculate stats
        calculateDeveloperPayouts(); // Recalculate payouts
        setIsExpenseModalOpen(false);
        resetExpense();
        setSelectedExpense(null);
        toast(
          selectedExpense 
            ? 'Expense updated successfully!' 
            : 'Expense added successfully!',
          'success'
        );
        return;
      }
    } catch (error: any) {
      console.error('Error saving expense:', error);
      toast(error?.message || 'An error occurred. Please try again.', 'error');
    }
  };

  // Invoice Generator
  const generateInvoice = (revenue: Revenue) => {
    const invoiceNumber = `INV-${String(revenue._id).slice(-6).toUpperCase()}`;
    const invoiceDate = formatDate(new Date());
    const dueDate = formatDate(revenue.expectedPaymentDate);
    
    const doc = new jsPDF();
    
    // Header with branding
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246); // Blue
    doc.text('Rootkit Consultancy Pvt Ltd', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Gray
    doc.text('Software Development Agency', 20, 28);
    doc.text('Email: finance@rootkit.com | Phone: +91-XXXXXXXXXX', 20, 34);
    
    // Invoice details
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // Dark
    doc.text(`Invoice #${invoiceNumber}`, 150, 20);
    doc.setFontSize(10);
    doc.text(`Date: ${invoiceDate}`, 150, 28);
    doc.text(`Due Date: ${dueDate}`, 150, 34);
    
    // Bill To
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Bill To:', 20, 50);
    doc.setFontSize(10);
    doc.text(revenue.client, 20, 58);
    doc.text(`Project: ${revenue.project}`, 20, 64);
    
    // Invoice items table
    const tableData = [
      ['Description', 'Amount (₹)'],
      [revenue.project, formatINR(revenue.totalContractValue)],
    ];
    
    if (revenue.advanceAmount && revenue.advanceAmount > 0) {
      tableData.push(['Advance Paid', `-${formatINR(revenue.advanceAmount)}`]);
    }
    
    const totalPayments = (revenue.paymentsReceived || []).reduce((sum, p) => sum + p.amount, 0);
    if (totalPayments > 0) {
      tableData.push(['Payments Received', `-${formatINR(totalPayments)}`]);
    }
    
    tableData.push(['Balance Due', formatINR(revenue.balanceDue)]);
    
    (doc as any).autoTable({
      startY: 75,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    });
    
    // Status
    const statusY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Payment Status:', 20, statusY);
    const statusColor = revenue.paymentStatus === 'Paid' ? [34, 197, 94] : 
                        revenue.paymentStatus === 'Partial' ? [234, 179, 8] : [239, 68, 68];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(revenue.paymentStatus, 80, statusY);
    
    // Footer
    const footerY = 280;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Thank you for your business!', 20, footerY);
    doc.text('This is a computer-generated invoice.', 20, footerY + 6);
    
    // Save invoice
    doc.save(`Invoice-${invoiceNumber}.pdf`);
    
    // Save to invoices array
    const invoiceData = {
      invoiceNumber,
      revenueId: revenue._id,
      client: revenue.client,
      project: revenue.project,
      amount: revenue.totalContractValue,
      date: invoiceDate,
      status: revenue.paymentStatus,
      createdAt: new Date().toISOString(),
    };
    
    const existingInvoices = JSON.parse(localStorage.getItem('rootkit_invoices') || '[]');
    existingInvoices.push(invoiceData);
    localStorage.setItem('rootkit_invoices', JSON.stringify(existingInvoices));
    
    toast('Invoice generated successfully!', 'success');
  };

  // Payment Reminder
  const sendPaymentReminder = async (revenue: Revenue) => {
    try {
      const response = await fetch('/api/revenue/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: revenue.client,
          project: revenue.project,
          amount: revenue.balanceDue,
          dueDate: revenue.expectedPaymentDate,
          invoiceNumber: `INV-${String(revenue._id).slice(-6).toUpperCase()}`,
        }),
      });
      
      if (response.ok) {
        toast('Payment reminder sent successfully!', 'success');
      } else {
        toast('Failed to send reminder. Please check email configuration.', 'error');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast('Error sending reminder. Please try again.', 'error');
    }
  };

  // Calculate Developer Payouts
  const calculateDeveloperPayouts = () => {
    const payouts: any[] = [];
    const peopleMap = new Map<string, { 
      name: string; 
      role: string; 
      id: string; 
      totalEarned: number; 
      totalPaid: number; // Actually paid (past dates)
      upcomingPayments: number; // Future dated payments
      lastPayout: string; 
      expenseCount: number;
      upcomingCount: number;
    }>();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    // Calculate earnings directly from ALL expenses (not filtered by date)
    expenses.forEach(expense => {
      let personName: string | undefined;
      
      // Check Developer Payout category
      if (expense.category === 'Developer Payout' && expense.developerPaid) {
        personName = expense.developerPaid;
      }
      // Check UI/UX Design Cost category
      else if (expense.category === 'UI/UX Design Cost' && expense.uiuxDesignerPaid) {
        personName = expense.uiuxDesignerPaid;
      }
      // Check Marketing Cost - Call Out/Devams
      else if (expense.category === 'Marketing Cost' && expense.campaignName === 'Call Out/Devams') {
        personName = 'Devams';
      }
      
      if (personName) {
        const existing = peopleMap.get(personName);
        const teamMember = teamMembers.find(tm => tm.name === personName);
        
        const expenseDate = expense.date ? new Date(expense.date) : null;
        const isFutureDate = expenseDate && expenseDate >= today;
        const isThisMonth = expenseDate && expenseDate >= today && expenseDate <= endOfMonth;
        
        if (existing) {
          existing.totalEarned += expense.amount;
          existing.expenseCount += 1;
          
          // Track paid vs upcoming
          if (isFutureDate) {
            existing.upcomingPayments += expense.amount;
            if (isThisMonth) {
              existing.upcomingCount += 1;
            }
          } else {
            existing.totalPaid += expense.amount;
          }
          
          // Update last payout if this expense is more recent (only for past dates)
          if (expenseDate && !isFutureDate) {
            const lastPayoutDate = existing.lastPayout && existing.lastPayout !== 'Never' ? new Date(existing.lastPayout).getTime() : 0;
            if (expenseDate.getTime() > lastPayoutDate) {
              existing.lastPayout = expense.date;
            }
          }
        } else {
          peopleMap.set(personName, {
            name: personName,
            role: teamMember?.role || 'Unknown',
            id: teamMember?._id || `person_${personName}_${Date.now()}`,
            totalEarned: expense.amount,
            totalPaid: isFutureDate ? 0 : expense.amount,
            upcomingPayments: isFutureDate ? expense.amount : 0,
            lastPayout: isFutureDate ? 'Never' : expense.date,
            expenseCount: 1,
            upcomingCount: isThisMonth ? 1 : 0,
          });
        }
      }
    });
    
    // Convert map to array and sort by total earnings (highest first)
    const payoutsArray = Array.from(peopleMap.values())
      .map(person => ({
        developerId: person.id,
        developerName: person.name,
        role: person.role,
        projects: person.expenseCount, // Number of expense entries (payouts)
        totalEarned: person.totalEarned,
        totalPaid: person.totalPaid,
        upcomingPayments: person.upcomingPayments,
        lastPayout: person.lastPayout || 'Never',
        upcomingCount: person.upcomingCount,
      }))
      .sort((a, b) => b.totalEarned - a.totalEarned);
    
    setDeveloperPayouts(payoutsArray);
  };

  // GST Calculation
  const calculateGST = () => {
    const revenueArray = Array.isArray(revenue) ? revenue : [];
    const totalBillable = revenueArray.reduce((sum, r) => sum + r.totalContractValue, 0);
    const gstCollected = totalBillable * 0.18; // 18% GST
    
    // GST on expenses (input tax credit)
    const gstPaid = expenses.reduce((sum, e) => {
      // Only office/tools/server expenses have GST
      if (['Office', 'Tools', 'Server'].includes(e.category)) {
        return sum + (e.amount * 0.18);
      }
      return sum;
    }, 0);
    
    const netGST = gstCollected - gstPaid;
    
    return {
      totalBillable,
      gstCollected,
      gstPaid,
      netGST,
    };
  };

  // Export GST Report
  const exportGSTReport = (period: 'monthly' | 'quarterly' | 'gst') => {
    const gstData = calculateGST();
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`${period === 'monthly' ? 'Monthly' : period === 'quarterly' ? 'Quarterly' : 'GST'} Report`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Total Billable: ${formatINR(gstData.totalBillable)}`, 20, 40);
    doc.text(`GST Collected (18%): ${formatINR(gstData.gstCollected)}`, 20, 50);
    doc.text(`GST Paid (Input Tax Credit): ${formatINR(gstData.gstPaid)}`, 20, 60);
    doc.text(`Net GST Payable: ${formatINR(gstData.netGST)}`, 20, 70);
    
    doc.save(`${period}-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast(`${period} report exported successfully!`, 'success');
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pending':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Overdue':
        return 'bg-gray-100 text-gray-800 border-gray-200 animate-pulse';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Revenue Report', 14, 20);
    
    const revenueArray = Array.isArray(revenue) ? revenue : [];
    const tableData = revenueArray.map((r) => [
      r.project,
      r.client,
      formatINR(r.totalContractValue),
      formatINR(r.advanceAmount || 0),
      r.advanceDate ? formatDate(r.advanceDate) : '-',
      formatINR(r.balanceDue),
      r.paymentStatus,
      r.paymentsReceived && r.paymentsReceived.length > 0
        ? new Date(
            r.paymentsReceived
              .map(p => new Date(p.date).getTime())
              .reduce((a, b) => Math.max(a, b), 0)
          )
        : r.advanceDate
        ? formatDate(r.advanceDate)
        : 'No payments',
    ]);

    (doc as any).autoTable({
      head: [['Project', 'Client', 'Total ₹', 'Advance ₹', 'Advance Date', 'Balance ₹', 'Status', 'Last Payment Date']],
      body: tableData,
      startY: 30,
    });

    doc.save('revenue-report.pdf');
  };

  const exportToCSV = () => {
    const headers = ['Project', 'Client', 'Total ₹', 'Advance ₹', 'Advance Date', 'Balance ₹', 'Payment Status', 'Last Payment Date'];
    const revenueArrayForExport = Array.isArray(revenue) ? revenue : [];
    const rows = revenueArrayForExport.map((r) => [
      r.project,
      r.client,
      r.totalContractValue,
      r.advanceAmount || 0,
      r.advanceDate || '',
      r.balanceDue,
      r.paymentStatus,
      r.paymentsReceived && r.paymentsReceived.length > 0
        ? new Date(
            r.paymentsReceived
              .map(p => new Date(p.date).getTime())
              .reduce((a, b) => Math.max(a, b), 0)
          )
        : r.advanceDate
        ? formatDate(r.advanceDate)
        : 'No payments',
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
  const revenueArray = Array.isArray(revenue) ? revenue : [];
  const monthlyData = revenueArray.reduce((acc: any, r) => {
    const month = new Date(r.expectedPaymentDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = { month, received: 0, pending: 0 };
    }
    if (r.paymentStatus === 'Paid') {
      acc[month].received += r.totalContractValue;
    } else {
      acc[month].pending += r.balanceDue;
    }
    return acc;
  }, {});

  const chartData = Object.values(monthlyData);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
    p.client.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  // Helper function to get date range for filtering
  const getDateRangeForFilter = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeFilter) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return { start: weekStart, end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return { start: monthStart, end: monthEnd };
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        const quarterStart = new Date(now.getFullYear(), quarter * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 1);
        return { start: quarterStart, end: quarterEnd };
      case 'ytd':
        const ytdStart = new Date(now.getFullYear(), 0, 1);
        const ytdEnd = new Date(now.getFullYear() + 1, 0, 1);
        return { start: ytdStart, end: ytdEnd };
      default:
        return { start: null, end: null };
    }
  };

  // Filter revenue based on selected card, search, filters, sort (time filter only affects cards, not tables)
  const filteredRevenue = useMemo(() => {
    let revenueArray = Array.isArray(revenue) ? revenue : [];
    
    // Apply card filter
    if (tableFilter) {
      switch (tableFilter) {
        case 'totalRevenue':
          break; // Show all
        case 'pendingInvoices':
          revenueArray = revenueArray.filter(r => r.paymentStatus === 'Pending' || r.paymentStatus === 'Partial' || r.paymentStatus === 'Overdue');
          break;
        case 'totalAdvances':
          revenueArray = revenueArray.filter(r => (r.advanceAmount || 0) > 0);
          break;
        case 'balanceDue':
          revenueArray = revenueArray.filter(r => r.balanceDue > 0);
          break;
      }
    }
    
    // Apply status filter
    if (revenueStatusFilter !== 'all') {
      revenueArray = revenueArray.filter(r => r.paymentStatus === revenueStatusFilter);
    }
    
    // Apply client filter
    if (revenueClientFilter !== 'all') {
      revenueArray = revenueArray.filter(r => r.client === revenueClientFilter);
    }
    
    // Apply payment filter (All/Today/Future/Overdue/Paid)
    if (revenuePaymentFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      revenueArray = revenueArray.filter(r => {
        if (revenuePaymentFilter === 'paid') {
          return r.paymentStatus === 'Paid';
        } else if (revenuePaymentFilter === 'overdue') {
          return r.paymentStatus === 'Overdue';
        } else if (revenuePaymentFilter === 'future') {
          // Future: has future-dated payments or expected date in future
          const hasFutureAdvance = r.advanceDate && new Date(r.advanceDate) > today;
          const hasFuturePayments = r.paymentsReceived?.some((p: { amount: number; date: string }) => {
            if (!p.date) return false;
            return new Date(p.date) > today;
          });
          const hasFutureExpected = r.expectedPaymentDate && new Date(r.expectedPaymentDate) > today;
          return hasFutureAdvance || hasFuturePayments || hasFutureExpected;
        } else if (revenuePaymentFilter === 'today') {
          // Today: payments due today
          const todayAdvance = r.advanceDate && new Date(r.advanceDate).toDateString() === today.toDateString();
          const todayPayments = r.paymentsReceived?.some((p: { amount: number; date: string }) => {
            if (!p.date) return false;
            return new Date(p.date).toDateString() === today.toDateString();
          });
          const todayExpected = r.expectedPaymentDate && new Date(r.expectedPaymentDate).toDateString() === today.toDateString();
          return todayAdvance || todayPayments || todayExpected;
        }
        return true;
      });
    }
    
    // Apply search query
    if (revenueSearchQuery) {
      const query = revenueSearchQuery.toLowerCase();
      revenueArray = revenueArray.filter(r => 
        r.project?.toLowerCase().includes(query) ||
        r.client?.toLowerCase().includes(query) ||
        r.notes?.toLowerCase().includes(query)
      );
    }
    
    // Sort - Simplified to only Amount and Date
    revenueArray = [...revenueArray].sort((a, b) => {
      let comparison = 0;
      
      if (revenueSortBy === 'amount') {
        // Sort by total contract value (price/value)
        const amountA = a.totalContractValue || 0;
        const amountB = b.totalContractValue || 0;
        comparison = amountA - amountB; // Ascending: low to high
      } else {
        // Sort by date - use the most recent date available (advanceDate, lastPaymentDate, or expectedPaymentDate)
        const getMostRecentDate = (r: Revenue): number => {
          // Get last payment date if available
          if (r.paymentsReceived && r.paymentsReceived.length > 0) {
            const lastPayment = r.paymentsReceived
              .map(p => new Date(p.date).getTime())
              .sort((a, b) => b - a)[0]; // Get most recent payment
            if (lastPayment) return lastPayment;
          }
          // Fallback to advance date
          if (r.advanceDate) {
            return new Date(r.advanceDate).getTime();
          }
          // Fallback to expected payment date
          if (r.expectedPaymentDate) {
            return new Date(r.expectedPaymentDate).getTime();
          }
          return 0; // No date available
        };
        
        const dateA = getMostRecentDate(a);
        const dateB = getMostRecentDate(b);
        
        // Handle null/undefined dates - put them at the end
        if (dateA === 0 && dateB === 0) {
          comparison = 0;
        } else if (dateA === 0) {
          comparison = 1; // A has no date, put it after B
        } else if (dateB === 0) {
          comparison = -1; // B has no date, put it after A
        } else {
          // For descending: newer dates first (dateB - dateA)
          // For ascending: older dates first (dateA - dateB)
          comparison = revenueSortDirection === 'desc' 
            ? dateB - dateA  // Descending: newer dates first
            : dateA - dateB; // Ascending: older dates first
        }
      }
      
      // Return comparison (already adjusted for direction in date sorting)
      return comparison;
    });
    
    return revenueArray;
  }, [revenue, tableFilter, revenueStatusFilter, revenueClientFilter, revenuePaymentFilter, revenueSearchQuery, revenueSortBy, revenueSortDirection, timeFilter]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-5">
        {/* Header Card */}
        <div className="card-premium p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-6 h-6 text-primary-500" />
                <h1 className="text-2xl font-bold text-text-primary font-display">Revenue & Finance Overview</h1>
              </div>
              <p className="text-sm text-text-secondary">Track payments, advances, and invoices</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 border border-border text-text-secondary px-3 py-1.5 rounded-lg hover:bg-hover transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 border border-border text-text-secondary px-3 py-1.5 rounded-lg hover:bg-hover transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons + Time Filter */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                reset();
                setSelectedRevenue(null);
                setIsModalOpen(true);
                setIsExpenseModalOpen(false);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Revenue
            </button>
            <button
              onClick={() => {
                resetExpense();
                setSelectedExpense(null);
                setIsExpenseModalOpen(true);
                setIsModalOpen(false);
              }}
              className="btn-success flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Expense
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeFilter === 'month'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border border-border text-text-secondary hover:bg-hover'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeFilter === 'week'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border border-border text-text-secondary hover:bg-hover'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeFilter('ytd')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeFilter === 'ytd'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border border-border text-text-secondary hover:bg-hover'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Enhanced Metrics Cards - 3x2 Grid - Perfect Layout */}
        <div 
          className="grid cursor-pointer transition-all relative"
          style={{ 
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
            gridAutoRows: '1fr'
          }}
        >
          {/* Row 1: Card 1 - Revenue */}
          <div 
            onClick={() => setTableFilter(tableFilter === 'totalRevenue' ? null : 'totalRevenue')}
            onMouseEnter={() => setHoveredCard('revenue')}
            onMouseLeave={() => setHoveredCard(null)}
            className={`card-premium card-premium-hover transition-all hover:shadow-lg hover:-translate-y-1 relative z-10 ${
              tableFilter === 'totalRevenue' ? 'ring-2 ring-primary-500' : ''
            }`}
            style={{ padding: '24px', height: '100%' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-secondary-500 rounded-lg flex-shrink-0">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-secondary mb-1 truncate">Revenue</p>
                  <p className="text-2xl font-bold text-text-primary leading-tight break-words">{formatINR(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <TrendingUp className="w-3.5 h-3.5 text-secondary-500 flex-shrink-0" />
                <span className="text-secondary-500 font-medium truncate">+{stats.totalRevenueTrend}% MoM</span>
              </div>
            </div>
            {/* Enhanced Tooltip - Positioned below for first row */}
            {showTooltip === 'revenue' && (
              <div className="absolute z-[100] top-full left-1/2 transform -translate-x-1/2 mt-3 w-64 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
                <div className="bg-white border-2 border-primary-200 rounded-xl shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-white" />
                      <h3 className="font-bold text-white text-sm">Total Revenue Details</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-2.5 bg-white">
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Projects</span>
                      <span className="text-sm font-semibold text-text-primary">{revenue.length}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Pending Invoices</span>
                      <span className="text-sm font-semibold text-orange-600">{formatINR(stats.pendingInvoices)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Overdue</span>
                      <span className="text-sm font-semibold text-red-600">{stats.overdueCount} invoices</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-text-secondary">Collection Rate</span>
                      <span className="text-sm font-bold text-green-600">{stats.collectionRate}%</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-primary-200"></div>
                </div>
              </div>
            )}
          </div>

          {/* Row 1: Card 2 - Total Advances */}
          <div 
            onClick={() => setTableFilter(tableFilter === 'totalAdvances' ? null : 'totalAdvances')}
            onMouseEnter={() => setHoveredCard('advances')}
            onMouseLeave={() => setHoveredCard(null)}
            className={`card-premium card-premium-hover transition-all hover:shadow-lg hover:-translate-y-1 relative z-10 ${
              tableFilter === 'totalAdvances' ? 'ring-2 ring-primary-500' : ''
            }`}
            style={{ padding: '24px', height: '100%' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-primary-500 rounded-lg flex-shrink-0">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-secondary mb-1 truncate">Advances</p>
                  <p className="text-2xl font-bold text-text-primary leading-tight break-words">{formatINR(stats.totalAdvances)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-3">
              <div className="text-xs text-text-secondary truncate">
                {stats.upcomingAdvancesThisMonth > 0 && (
                  <div className="text-green-600 font-medium">
                    {formatINR(stats.upcomingAdvancesThisMonth)} this month
                  </div>
                )}
                {stats.upcomingAdvancesNextMonth > 0 && (
                  <div className="text-blue-600 font-medium">
                    {formatINR(stats.upcomingAdvancesNextMonth)} next month
                  </div>
                )}
                {stats.upcomingAdvancesThisMonth === 0 && stats.upcomingAdvancesNextMonth === 0 && (
                  <div>Avg: {formatINR(Math.round(stats.avgAdvance))} per project</div>
                )}
              </div>
            </div>
            {/* Enhanced Tooltip - Positioned below for first row */}
            {showTooltip === 'advances' && (
              <div className="absolute z-[100] top-full left-1/2 transform -translate-x-1/2 mt-3 w-72 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
                <div className="bg-white border-2 border-primary-200 rounded-xl shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-white" />
                      <h3 className="font-bold text-white text-sm">Advances Details</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-2.5 bg-white">
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Total Advances</span>
                      <span className="text-sm font-bold text-text-primary">{formatINR(stats.totalAdvances)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Average per Project</span>
                      <span className="text-sm font-semibold text-text-primary">{formatINR(Math.round(stats.avgAdvance))}</span>
                    </div>
                    {stats.upcomingAdvancesThisMonth > 0 && (
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                        <span className="text-xs text-text-secondary">This Month</span>
                        <span className="text-sm font-semibold text-green-600">{formatINR(stats.upcomingAdvancesThisMonth)}</span>
                      </div>
                    )}
                    {stats.upcomingAdvancesNextMonth > 0 && (
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                        <span className="text-xs text-text-secondary">Next Month</span>
                        <span className="text-sm font-semibold text-blue-600">{formatINR(stats.upcomingAdvancesNextMonth)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-text-secondary">Projects with Advances</span>
                      <span className="text-sm font-semibold text-text-primary">{revenue.filter(r => (r.advanceAmount || 0) > 0).length}</span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-primary-200"></div>
                </div>
              </div>
            )}
          </div>

          {/* Row 1: Card 3 - Balance Due */}
          <div 
            onClick={() => setTableFilter(tableFilter === 'balanceDue' ? null : 'balanceDue')}
            onMouseEnter={() => setHoveredCard('balance')}
            onMouseLeave={() => setHoveredCard(null)}
            className={`card-premium card-premium-hover transition-all hover:shadow-lg hover:-translate-y-1 relative z-10 ${
              tableFilter === 'balanceDue' ? 'ring-2 ring-primary-500' : ''
            }`}
            style={{ padding: '24px', height: '100%' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-purple-500 rounded-lg flex-shrink-0">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-secondary mb-1 truncate">Balance Due</p>
                  <p className="text-2xl font-bold text-text-primary leading-tight break-words">{formatINR(stats.balanceDue)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-text-secondary truncate">
                {stats.collectionRate}% collected
              </div>
            </div>
            {/* Enhanced Tooltip - Positioned below for first row */}
            {showTooltip === 'balance' && (
              <div className="absolute z-[100] top-full left-1/2 transform -translate-x-1/2 mt-3 w-72 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
                <div className="bg-white border-2 border-purple-200 rounded-xl shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-white" />
                      <h3 className="font-bold text-white text-sm">Balance Due Details</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-2.5 bg-white">
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Balance Due</span>
                      <span className="text-sm font-bold text-text-primary">{formatINR(stats.balanceDue)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Total Revenue</span>
                      <span className="text-sm font-semibold text-text-primary">{formatINR(stats.totalRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Received</span>
                      <span className="text-sm font-semibold text-green-600">{formatINR(stats.totalCollected)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Pending Amount</span>
                      <span className="text-sm font-semibold text-orange-600">{formatINR(stats.pendingInvoices)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Collection Rate</span>
                      <span className="text-sm font-bold text-green-600">{stats.collectionRate}%</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-text-secondary italic">Formula</span>
                      <span className="text-xs text-text-secondary">Balance Due = Pending Amount</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-purple-200"></div>
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Card 4 - Team Earnings */}
          <div 
            onMouseEnter={() => setHoveredCard('earnings')}
            onMouseLeave={() => setHoveredCard(null)}
            className="card-premium card-premium-hover transition-all hover:shadow-lg hover:-translate-y-1 relative z-0"
            style={{ padding: '24px', height: '100%' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-secondary mb-1 truncate">Team Earnings</p>
                  <p className="text-2xl font-bold text-text-primary leading-tight break-words">{formatINR(stats.teamEarnings)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-3">
              <div className="text-xs text-text-secondary">
                <div className="truncate">Dev: {formatINR(stats.teamEarningsDev)}</div>
                <div className="truncate">UIUX: {formatINR(stats.teamEarningsUIUX)}</div>
              </div>
            </div>
            {/* Enhanced Tooltip */}
            {/* Enhanced Tooltip - Positioned above for second row */}
            {showTooltip === 'earnings' && (
              <div className="absolute z-[100] bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
                <div className="bg-white border-2 border-blue-200 rounded-xl shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-white" />
                      <h3 className="font-bold text-white text-sm">Total Earnings Details</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-2.5 bg-white">
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Total Earnings</span>
                      <span className="text-sm font-bold text-text-primary">{formatINR(stats.totalEarnings)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Total Revenue</span>
                      <span className="text-sm font-semibold text-text-primary">{formatINR(stats.totalRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Total Expenses</span>
                      <span className="text-sm font-semibold text-red-600">{formatINR(stats.totalExpenses)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Cash Flow</span>
                      <span className={`text-sm font-semibold ${stats.totalEarnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.totalEarnings >= 0 ? 'Positive' : 'Negative'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Expense Count</span>
                      <span className="text-sm font-semibold text-text-primary">{expenses.length}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-text-secondary italic">Formula</span>
                      <span className="text-xs text-text-secondary">Total Revenue - Total Expenses</span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-blue-200"></div>
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Card 5 - Total Expenses */}
          <div 
            onMouseEnter={() => setHoveredCard('expenses')}
            onMouseLeave={() => setHoveredCard(null)}
            className="card-premium card-premium-hover transition-all hover:shadow-lg hover:-translate-y-1 relative z-0"
            style={{ padding: '24px', height: '100%' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-red-500 rounded-lg flex-shrink-0">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-secondary mb-1 truncate">Total Expenses</p>
                  <p className="text-2xl font-bold text-text-primary leading-tight break-words">{formatINR(stats.totalExpenses)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-text-secondary truncate">
                {expenses.length} expenses
              </div>
            </div>
            {/* Enhanced Tooltip - Positioned above for second row */}
            {showTooltip === 'expenses' && (
              <div className="absolute z-[100] bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
                <div className="bg-white border-2 border-red-200 rounded-xl shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-white" />
                      <h3 className="font-bold text-white text-sm">Expenses Breakdown</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-2.5 bg-white">
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Total Expenses</span>
                      <span className="text-sm font-bold text-text-primary">{formatINR(stats.totalExpenses)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Total Count</span>
                      <span className="text-sm font-semibold text-text-primary">{expenses.length}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Team Earnings</span>
                      <span className="text-sm font-semibold text-blue-600">{formatINR(stats.teamEarnings)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Dev Payouts</span>
                      <span className="text-sm font-semibold text-blue-600">{formatINR(stats.teamEarningsDev)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">UI/UX Costs</span>
                      <span className="text-sm font-semibold text-indigo-600">{formatINR(stats.teamEarningsUIUX)}</span>
                    </div>
                    {stats.teamEarningsDevams > 0 && (
                      <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                        <span className="text-xs text-text-secondary">Devams (Marketing)</span>
                        <span className="text-sm font-semibold text-pink-600">{formatINR(stats.teamEarningsDevams)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-text-secondary">Other Expenses</span>
                      <span className="text-sm font-semibold text-text-primary">{formatINR(stats.totalExpenses - stats.teamEarnings)}</span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-red-200"></div>
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Card 6 - Profit Margin */}
          <div 
            onMouseEnter={() => setHoveredCard('profit')}
            onMouseLeave={() => setHoveredCard(null)}
            className="card-premium card-premium-hover transition-all hover:shadow-lg hover:-translate-y-1 relative z-0"
            style={{ padding: '24px', height: '100%' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-secondary mb-1 truncate">Profit Margin</p>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className={`text-2xl font-bold leading-tight ${stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.profitMargin >= 0 ? '+' : ''}{stats.profitMargin}%
                    </p>
                    <p className="text-sm font-semibold text-text-secondary">
                      | {formatINR(stats.netRevenue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-3">
              <div className="text-xs text-text-secondary truncate">
                Revenue {formatINR(stats.totalRevenue)} - {formatINR(stats.totalExpenses)} costs
              </div>
            </div>
            {/* Enhanced Tooltip - Positioned above for second row */}
            {showTooltip === 'profit' && (
              <div className="absolute z-[100] bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
                <div className="bg-white border-2 border-green-200 rounded-xl shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-white" />
                      <h3 className="font-bold text-white text-sm">Profit Margin Details</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-2.5 bg-white">
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Profit Margin</span>
                      <span className="text-sm font-bold text-green-600">{stats.profitMargin}%</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Net Revenue</span>
                      <span className="text-sm font-semibold text-text-primary">{formatINR(stats.netRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Total Revenue</span>
                      <span className="text-sm font-semibold text-text-primary">{formatINR(stats.totalRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Total Expenses</span>
                      <span className="text-sm font-semibold text-red-600">{formatINR(stats.totalExpenses)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                      <span className="text-xs text-text-secondary">Trend</span>
                      <span className="text-sm font-semibold text-green-600">+{stats.profitMarginTrend}%</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-text-secondary italic">Formula</span>
                      <span className="text-xs text-text-secondary">(Revenue - Expenses) ÷ Revenue</span>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-green-200"></div>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Tabs for Revenue, Developer Payouts, and Expenses */}
        <div className="flex items-center gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'revenue' 
                ? 'text-primary-500 border-b-2 border-primary-500' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Revenue & Invoices
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'payouts' 
                ? 'text-primary-500 border-b-2 border-primary-500' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            People Earnings
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'expenses' 
                ? 'text-primary-500 border-b-2 border-primary-500' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Expenses
          </button>
        </div>

        {/* Collapsible Charts - Compact Header Only */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMonthlyChart(!showMonthlyChart)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover rounded-lg transition-colors border border-border"
          >
            <span>Monthly Overview</span>
            {showMonthlyChart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowIncomeExpenseChart(!showIncomeExpenseChart)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-hover rounded-lg transition-colors border border-border"
          >
            <span>Income vs Expenses</span>
            {showIncomeExpenseChart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Charts - Only show when expanded */}
        {(showMonthlyChart || showIncomeExpenseChart) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {showMonthlyChart && (
              <div className="card-premium p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Monthly Overview</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                    <YAxis stroke="#64748B" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }} 
                      itemStyle={{ color: '#1E293B', fontSize: '12px' }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="received" stroke="#10b981" strokeWidth={2} name="Received (₹)" />
                    <Line type="monotone" dataKey="pending" stroke="#ef4444" strokeWidth={2} name="Pending (₹)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {showIncomeExpenseChart && (
              <div className="card-premium p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Income vs Expenses</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                    <YAxis stroke="#64748B" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '12px' }} 
                      itemStyle={{ color: '#1E293B', fontSize: '12px' }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="received" fill="#10b981" name="Received (₹)" />
                    <Bar dataKey="pending" fill="#ef4444" name="Pending (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Revenue Table or Developer Payouts Table */}
        {activeTab === 'revenue' ? (
          <div className="space-y-4">
            {/* Revenue Table Filters - Professional Card Layout */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-primary">Revenue</h2>
              </div>
              
              {/* All Filters in One Line - Card-Based Layout */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* Search Card */}
                <div className="card-premium p-3 flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                    <input
                      type="text"
                      value={revenueSearchQuery}
                      onChange={(e) => setRevenueSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-secondary"
                      placeholder="Search revenue..."
                    />
                  </div>
                </div>

                {/* Status Filter Card */}
                <div className="card-premium p-3">
                  <select
                    value={revenueStatusFilter}
                    onChange={(e) => setRevenueStatusFilter(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm text-text-primary cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                {/* Client Filter Card */}
                <div className="card-premium p-3">
                  <select
                    value={revenueClientFilter}
                    onChange={(e) => setRevenueClientFilter(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm text-text-primary cursor-pointer min-w-[140px]"
                  >
                    <option value="all">All Clients</option>
                    {Array.from(new Set(revenue.map(r => r.client))).map(client => (
                      <option key={client} value={client}>{client}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Filter Card */}
                <div className="card-premium p-3">
                  <select
                    value={revenuePaymentFilter}
                    onChange={(e) => setRevenuePaymentFilter(e.target.value as 'all' | 'today' | 'future' | 'overdue' | 'paid')}
                    className="w-full bg-transparent border-none outline-none text-sm text-text-primary cursor-pointer min-w-[120px]"
                  >
                    <option value="all">All Payments</option>
                    <option value="today">Today</option>
                    <option value="future">Future</option>
                    <option value="overdue">Overdue</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                {/* Sort By Card */}
                <div className="card-premium p-3">
                  <select
                    value={revenueSortBy}
                    onChange={(e) => setRevenueSortBy(e.target.value as 'amount' | 'date')}
                    className="w-full bg-transparent border-none outline-none text-sm text-text-primary cursor-pointer min-w-[140px]"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="amount">Sort by Amount</option>
                  </select>
                </div>

                {/* Sort Direction Card */}
                <div className="card-premium p-3">
                  <button
                    onClick={() => setRevenueSortDirection(revenueSortDirection === 'asc' ? 'desc' : 'asc')}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      revenueSortDirection === 'asc' 
                        ? 'bg-primary-50 text-primary-600' 
                        : 'bg-hover text-text-primary'
                    }`}
                    title={revenueSortDirection === 'asc' ? 'Ascending (Low-High, Old-New)' : 'Descending (High-Low, New-Old)'}
                  >
                    {revenueSortDirection === 'asc' ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span className="text-xs font-medium">Asc</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span className="text-xs font-medium">Desc</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="card-premium overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Project</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Client</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Total ₹</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Advance ₹</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Advance Date</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Balance ₹</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Payment Status</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Last Payment Date</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                {filteredRevenue.length > 0 ? (
                  filteredRevenue.map((row: Revenue) => (
                    <tr key={row._id} className="hover:bg-hover transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-primary">{row.project}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-text-secondary">{row.client}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-text-primary">{formatINR(row.totalContractValue)}</div>
                        <div className="text-xs text-text-secondary">{formatUSD(inrToUsd(row.totalContractValue))}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-text-primary">{formatINR(row.advanceAmount || 0)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {row.advanceDate ? (
                            <>
                              <div className={`text-xs ${(() => {
                                const advanceDate = new Date(row.advanceDate);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                advanceDate.setHours(0, 0, 0, 0);
                                return advanceDate >= today ? 'text-blue-600 font-semibold' : 'text-text-secondary';
                              })()}`}>
                                {formatDate(row.advanceDate)}
                              </div>
                              {(() => {
                                const advanceDate = new Date(row.advanceDate);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                advanceDate.setHours(0, 0, 0, 0);
                                if (advanceDate >= today) {
                                  return (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                      Future
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </>
                          ) : (
                            <div className="text-xs text-text-secondary">-</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-semibold text-text-primary">{formatINR(row.balanceDue)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(row.paymentStatus)}`}>
                          {row.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {row.paymentsReceived && row.paymentsReceived.length > 0 ? (() => {
                            const lastPaymentDate = new Date(
                              row.paymentsReceived
                                .map((p: { amount: number; date: string }) => new Date(p.date).getTime())
                                .reduce((a: number, b: number) => Math.max(a, b), 0)
                            );
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            lastPaymentDate.setHours(0, 0, 0, 0);
                            const isFutureDate = lastPaymentDate >= today;
                            
                            return (
                              <>
                                <div className={`text-xs ${isFutureDate ? 'text-blue-600 font-semibold' : 'text-text-secondary'}`}>
                                  {formatDate(lastPaymentDate)}
                                </div>
                                {isFutureDate && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                    Future
                                  </span>
                                )}
                              </>
                            );
                          })() : row.advanceDate ? (() => {
                            const advanceDate = new Date(row.advanceDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            advanceDate.setHours(0, 0, 0, 0);
                            const isFutureDate = advanceDate >= today;
                            
                            return (
                              <>
                                <div className={`text-xs ${isFutureDate ? 'text-blue-600 font-semibold' : 'text-text-secondary'}`}>
                                  {formatDate(row.advanceDate)}
                                </div>
                                {isFutureDate && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                    Future
                                  </span>
                                )}
                              </>
                            );
                          })() : (
                            <div className="text-xs text-text-secondary">No payments</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => generateInvoice(row)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Generate Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {row.paymentStatus !== 'Paid' && new Date(row.expectedPaymentDate) < new Date() && (
                            <button
                              onClick={() => sendPaymentReminder(row)}
                              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                              title="Send Reminder"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(row)}
                            className="p-1.5 text-primary-500 hover:bg-primary-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-text-secondary">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="w-12 h-12 text-text-secondary opacity-50" />
                        <p className="text-sm font-medium">No revenue records found</p>
                        <p className="text-xs">Click "New Revenue" to create your first revenue record</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-background border-t border-border">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-text-primary">
                    Total Revenue:
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-text-primary">
                    {formatINR(filteredRevenue.reduce((sum, r) => sum + r.totalContractValue, 0))}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-text-primary">
                    {formatINR(filteredRevenue.reduce((sum, r) => sum + (r.advanceAmount || 0), 0))}
                  </td>
                  <td colSpan={2}></td>
                  <td className="px-4 py-3 text-sm font-semibold text-text-primary">
                    {formatINR(filteredRevenue.reduce((sum, r) => sum + r.balanceDue, 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
          </div>
        ) : activeTab === 'payouts' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary">People Earnings</h2>
            </div>
            <div className="card-premium overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Person</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Role</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Payouts</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Paid (₹)</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Upcoming (₹)</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Total Earnings (₹)</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Last Payout</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border">
                    {developerPayouts.length > 0 ? (
                      developerPayouts.map((payout) => (
                        <tr key={payout.developerId} className="hover:bg-hover transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-text-primary">{payout.developerName}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-text-secondary">{payout.role}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-text-primary">{payout.projects}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-semibold text-green-600">{formatINR(payout.totalPaid || 0)}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {payout.upcomingPayments > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-blue-600">{formatINR(payout.upcomingPayments)}</div>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                  Future
                                </span>
                                {payout.upcomingCount > 0 && (
                                  <span className="text-xs text-blue-500">({payout.upcomingCount} this month)</span>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-text-secondary">-</div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-bold text-text-primary">{formatINR(payout.totalEarned)}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`text-xs ${payout.lastPayout === 'Never' ? 'text-text-secondary' : 'text-text-primary'}`}>
                                {payout.lastPayout === 'Never' ? 'Never' : formatDate(payout.lastPayout)}
                              </div>
                              {payout.lastPayout !== 'Never' && (() => {
                                const lastPayoutDate = new Date(payout.lastPayout);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                lastPayoutDate.setHours(0, 0, 0, 0);
                                if (lastPayoutDate > today) {
                                  return (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                      Future
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="w-12 h-12 text-text-secondary opacity-50" />
                            <p className="text-sm font-medium">No earnings recorded</p>
                            <p className="text-xs">Add expenses with Developer Payout or UI/UX Design Cost to track earnings</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {developerPayouts.length > 0 && (
                    <tfoot className="bg-background border-t-2 border-border">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-text-primary">Total</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          {formatINR(developerPayouts.reduce((sum, p) => sum + (p.totalPaid || 0), 0))}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                          {formatINR(developerPayouts.reduce((sum, p) => sum + (p.upcomingPayments || 0), 0))}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-text-primary">
                          {formatINR(developerPayouts.reduce((sum, p) => sum + (p.totalEarned || 0), 0))}
                        </td>
                        <td colSpan={1}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'expenses' ? (
          /* Expenses Table Tab */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary">Expenses</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                  <input
                    type="text"
                    value={expenseSearchQuery}
                    onChange={(e) => setExpenseSearchQuery(e.target.value)}
                    className="input-premium pl-10 w-64"
                    placeholder="Search expenses..."
                  />
                </div>
                <select
                  value={expenseFilter}
                  onChange={(e) => setExpenseFilter(e.target.value)}
                  className="input-premium"
                >
                  <option value="all">All Categories</option>
                  <option value="Developer Payout">Developer Payout</option>
                  <option value="Software Purchase">Software Purchase</option>
                  <option value="Office Expenses">Office Expenses</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Marketing Cost">Marketing Cost</option>
                  <option value="UI/UX Design Cost">UI/UX Design Cost</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
                <select
                  value={expenseSortBy}
                  onChange={(e) => setExpenseSortBy(e.target.value as 'date' | 'amount')}
                  className="input-premium"
                >
                  <option value="date">Sort by Date</option>
                  <option value="amount">Sort by Amount</option>
                </select>
              </div>
            </div>

          <div className="card-premium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Category</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Project</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Developer/UIUX</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Amount (₹)</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Receipt</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {(() => {
                    let filteredExpenses = expenses;
                    
                    // Filter by category (time filter only affects cards, not tables)
                    if (expenseFilter !== 'all') {
                      filteredExpenses = filteredExpenses.filter(e => e.category === expenseFilter);
                    }
                    
                    // Filter by search query
                    if (expenseSearchQuery) {
                      const query = expenseSearchQuery.toLowerCase();
                      filteredExpenses = filteredExpenses.filter(e => 
                        e.description?.toLowerCase().includes(query) ||
                        e.developerPaid?.toLowerCase().includes(query) ||
                        e.uiuxDesignerPaid?.toLowerCase().includes(query) ||
                        e.softwareName?.toLowerCase().includes(query) ||
                        e.project?.toLowerCase().includes(query) ||
                        e.hardwareFor?.toLowerCase().includes(query) ||
                        e.campaignName?.toLowerCase().includes(query) ||
                        e.designerName?.toLowerCase().includes(query)
                      );
                    }
                    
                    // Sort expenses
                    filteredExpenses = [...filteredExpenses].sort((a, b) => {
                      if (expenseSortBy === 'amount') {
                        return b.amount - a.amount;
                      } else {
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                      }
                    });
                    
                    return filteredExpenses.length > 0 ? (
                      filteredExpenses.map((expense) => {
                        const expenseDate = new Date(expense.date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        expenseDate.setHours(0, 0, 0, 0);
                        const isFutureDate = expenseDate >= today;
                        
                        return (
                        <tr 
                          key={expense._id} 
                          className={`hover:bg-hover transition-colors ${
                            isFutureDate ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                              expense.category === 'Developer Payout' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              expense.category === 'Software Purchase' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                              expense.category === 'Office Expenses' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              expense.category === 'Hardware' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                              expense.category === 'Marketing Cost' ? 'bg-pink-100 text-pink-800 border-pink-200' :
                              expense.category === 'UI/UX Design Cost' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'
                            }`}>
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-text-secondary">
                              {expense.project || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-text-primary">
                              {expense.category === 'Developer Payout' && expense.developerPaid && (
                                <div className="font-medium">{expense.developerPaid}</div>
                              )}
                              {expense.category === 'UI/UX Design Cost' && expense.uiuxDesignerPaid && (
                                <div className="font-medium">{expense.uiuxDesignerPaid}</div>
                              )}
                              {expense.category === 'Software Purchase' && expense.softwareName && (
                                <div className="font-medium">{expense.softwareName}</div>
                              )}
                              {expense.category === 'Hardware' && expense.hardwareFor && (
                                <div className="font-medium">{expense.hardwareFor}</div>
                              )}
                              {expense.category === 'Marketing Cost' && expense.campaignName && (
                                <div className="font-medium">{expense.campaignName}</div>
                              )}
                              {expense.category === 'Office Expenses' && (
                                <div className="text-text-secondary">Office</div>
                              )}
                              {expense.category === 'Miscellaneous' && (
                                <div className="text-text-secondary">-</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-semibold text-text-primary">{formatINR(expense.amount)}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`text-sm ${isFutureDate ? 'text-blue-600 font-semibold' : 'text-text-secondary'}`}>
                                {formatDate(expense.date)}
                              </div>
                              {isFutureDate && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                  Future
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {expense.receipt ? (
                              <a
                                href={expense.receipt}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-text-secondary text-sm">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  // Handle edit expense - set selected expense and pre-fill form
                                  setSelectedExpense(expense);
                                  setValueExpense('amount', expense.amount);
                                  setValueExpense('category', expense.category);
                                  setValueExpense('date', expense.date);
                                  setValueExpense('description', expense.description);
                                  setValueExpense('developerPaid', expense.developerPaid || '');
                                  setValueExpense('uiuxDesignerPaid', expense.uiuxDesignerPaid || '');
                                  setValueExpense('project', expense.project || '');
                                  setValueExpense('softwareName', expense.softwareName || '');
                                  setValueExpense('hardwareFor', expense.hardwareFor || '');
                                  setValueExpense('campaignName', expense.campaignName || '');
                                  setValueExpense('designerName', expense.designerName || '');
                                  setValueExpense('notes', expense.notes || '');
                                  setValueExpense('receipt', expense.receipt || '');
                                  setIsExpenseModalOpen(true);
                                }}
                                className="p-1.5 text-primary-500 hover:bg-primary-50 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm('Are you sure you want to delete this expense?')) return;
                                  try {
                                    if (typeof window !== 'undefined') {
                                      const updated = expenses.filter(e => e._id !== expense._id);
                                      localStorage.setItem('rootkit_expenses', JSON.stringify(updated));
                                      await fetchExpenses();
                                      await fetchRevenue();
                                      calculateDeveloperPayouts();
                                      toast('Expense deleted successfully!', 'success');
                                    }
                                  } catch (error: any) {
                                    console.error('Error deleting expense:', error);
                                    toast('An error occurred while deleting.', 'error');
                                  }
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                          <div className="flex flex-col items-center gap-2">
                            <DollarSign className="w-12 h-12 text-text-secondary opacity-50" />
                            <p className="text-sm font-medium">No expenses found</p>
                            <p className="text-xs">Click "New Expense" to create your first expense record</p>
                          </div>
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
                <tfoot className="bg-background border-t border-border">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-text-primary">
                      Total Expenses:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-text-primary">
                      {formatINR(
                        expenses
                          .filter(e => {
                            if (expenseFilter !== 'all') {
                              return e.category === expenseFilter;
                            }
                            if (expenseSearchQuery) {
                              const query = expenseSearchQuery.toLowerCase();
                              return e.description?.toLowerCase().includes(query) ||
                                     e.developerPaid?.toLowerCase().includes(query) ||
                                     e.softwareName?.toLowerCase().includes(query) ||
                                     e.project?.toLowerCase().includes(query) ||
                                     e.hardwareFor?.toLowerCase().includes(query);
                            }
                            return true;
                          })
                          .reduce((sum, e) => sum + e.amount, 0)
                      )}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          </div>
        ) : null}

        {/* Add/Edit Revenue Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            reset();
            setSelectedRevenue(null);
            setProjectSearchQuery('');
          }}
          title={selectedRevenue ? 'Edit Revenue Entry' : 'New Revenue Entry'}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Project</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                <input
                  type="text"
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  onFocus={() => setProjectSearchQuery('')}
                  className="input-premium pl-10"
                  placeholder="Search projects..."
                />
              </div>
              <select
                {...register('project')}
                className="input-premium mt-2"
              >
                <option value="">Select a project</option>
                {filteredProjects.map(project => (
                  <option key={project._id} value={project.name}>{project.name} - {project.client}</option>
                ))}
              </select>
              {errors.project && <p className="text-red-600 text-sm mt-1">{errors.project.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Client</label>
              <input
                {...register('client')}
                className="input-premium"
                placeholder="Auto-filled from project"
                readOnly
              />
              {errors.client && <p className="text-red-600 text-sm mt-1">{errors.client.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Total Contract Value (₹)</label>
              <input
                type="number"
                step="0.01"
                {...register('totalContractValue', { valueAsNumber: true })}
                className="input-premium"
                placeholder="Enter total contract value in rupees"
              />
              {totalContractValue > 0 && (
                <p className="text-sm text-text-secondary mt-2">
                  ≈ {formatUSD(inrToUsd(totalContractValue))}
                </p>
              )}
              {errors.totalContractValue && <p className="text-red-600 text-sm mt-1">{errors.totalContractValue.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Advance Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('advanceAmount', { valueAsNumber: true })}
                  className="input-premium"
                  placeholder="0.00"
                />
                {errors.advanceAmount && <p className="text-red-600 text-sm mt-1">{errors.advanceAmount.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Advance Date</label>
                <input
                  type="date"
                  {...register('advanceDate')}
                  className="input-premium"
                />
                {errors.advanceDate && <p className="text-red-600 text-sm mt-1">{errors.advanceDate.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Payments Received</label>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-3 gap-2 mb-2">
                  <input
                    type="number"
                    step="0.01"
                    {...register(`paymentsReceived.${index}.amount`, { valueAsNumber: true })}
                    className="input-premium"
                    placeholder="Amount (₹)"
                  />
                  <input
                    type="date"
                    {...register(`paymentsReceived.${index}.date`)}
                    className="input-premium"
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => append({ amount: 0, date: new Date().toISOString().split('T')[0] })}
                className="text-sm text-primary-500 hover:text-primary-600 font-medium"
              >
                + Add Payment
              </button>
            </div>

            <div className="bg-background p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-secondary">Balance Due:</span>
                  <span className="ml-2 font-medium text-text-primary">{formatINR(balanceDue)}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Payment Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(paymentStatus)}`}>
                    {paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Expected Payment Date</label>
                <input
                  type="date"
                  {...register('expectedPaymentDate')}
                  className="input-premium"
                />
                {errors.expectedPaymentDate && <p className="text-red-600 text-sm mt-1">{errors.expectedPaymentDate.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Notes</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="input-premium"
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                  setSelectedRevenue(null);
                  setProjectSearchQuery('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {selectedRevenue ? 'Update Revenue' : 'Create Entry'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Expense Modal - Categorized Form */}
        <Modal
          isOpen={isExpenseModalOpen}
          onClose={() => {
            setIsExpenseModalOpen(false);
            resetExpense();
            setSelectedExpense(null);
            setDeveloperSearchQuery('');
          }}
          title={selectedExpense ? 'Edit Expense' : 'Add New Expense'}
          size="lg"
        >
          <form onSubmit={handleSubmitExpense(onSubmitExpense)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Category *</label>
              <select
                {...registerExpense('category')}
                className="input-premium"
              >
                <option value="Developer Payout">Developer Payout</option>
                <option value="Software Purchase">Software Purchase</option>
                <option value="Office Expenses">Office Expenses</option>
                <option value="Hardware">Hardware</option>
                <option value="Marketing Cost">Marketing Cost</option>
                <option value="UI/UX Design Cost">UI/UX Design Cost</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
              {expenseErrors.category && <p className="text-red-600 text-sm mt-1">{expenseErrors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                {...registerExpense('amount', { valueAsNumber: true })}
                className="input-premium"
                placeholder="Enter expense amount in rupees"
              />
              {expenseErrors.amount && <p className="text-red-600 text-sm mt-1">{expenseErrors.amount.message}</p>}
            </div>

            {/* Dynamic Fields Based on Category */}
            {expenseCategory === 'Developer Payout' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Developer *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                  <input
                    type="text"
                    value={developerSearchQuery}
                    onChange={(e) => setDeveloperSearchQuery(e.target.value)}
                    onFocus={() => setDeveloperSearchQuery('')}
                    className="input-premium pl-10"
                    placeholder="Search developers..."
                  />
                </div>
                <select
                  {...registerExpense('developerPaid')}
                  className="input-premium mt-2"
                >
                  <option value="">Select a developer</option>
                  {teamMembers
                    .filter(m => 
                      !developerSearchQuery || 
                      m.name?.toLowerCase().includes(developerSearchQuery.toLowerCase()) ||
                      m.role?.toLowerCase().includes(developerSearchQuery.toLowerCase())
                    )
                    .map(member => (
                      <option key={member._id} value={member.name}>
                        {member.name} - {member.role}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-text-secondary mt-1">
                  Commission: Frontend 8% | Backend 10% | Full Stack 12% | PM ₹15k flat
                </p>
              </div>
            )}

            {expenseCategory === 'Developer Payout' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Project</label>
                <select
                  {...registerExpense('project')}
                  className="input-premium"
                >
                  <option value="">Select a project (optional)</option>
                  {projects
                    .filter(p => p.name && p.name.trim() !== '')
                    .map(project => (
                      <option key={project._id} value={project.name}>
                        {project.name} - {project.client}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-text-secondary mt-1">
                  Link this payout to a specific project for better tracking
                </p>
              </div>
            )}

            {expenseCategory === 'Software Purchase' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Software Name</label>
                <input
                  type="text"
                  {...registerExpense('softwareName')}
                  className="input-premium"
                  placeholder="e.g., Figma Pro, Vercel Pro, AWS"
                />
              </div>
            )}

            {expenseCategory === 'Hardware' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Hardware For</label>
                <input
                  type="text"
                  {...registerExpense('hardwareFor')}
                  className="input-premium"
                  placeholder="e.g., MacBook for Sarah, Monitor for John"
                />
              </div>
            )}

            {expenseCategory === 'Marketing Cost' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Type *</label>
                <select
                  {...registerExpense('campaignName')}
                  className="input-premium"
                >
                  <option value="">Select type</option>
                  <option value="Meta Ads">Meta Ads</option>
                  <option value="Call Out/Devams">Call Out/Devams</option>
                  <option value="SEO">SEO</option>
                  <option value="Google Ads">Google Ads</option>
                  <option value="LinkedIn Ads">LinkedIn Ads</option>
                  <option value="Other">Other</option>
                </select>
                <p className="text-xs text-text-secondary mt-1">
                  Select the marketing channel or campaign type
                </p>
              </div>
            )}

            {expenseCategory === 'UI/UX Design Cost' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">UI/UX Designer *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                  <input
                    type="text"
                    value={uiuxSearchQuery}
                    onChange={(e) => setUiuxSearchQuery(e.target.value)}
                    onFocus={() => setUiuxSearchQuery('')}
                    className="input-premium pl-10"
                    placeholder="Search UI/UX designers..."
                  />
                </div>
                <select
                  {...registerExpense('uiuxDesignerPaid')}
                  className="input-premium mt-2"
                >
                  <option value="">Select a UI/UX designer</option>
                  {teamMembers
                    .filter(m => 
                      (m.role?.toLowerCase().includes('ui') || 
                       m.role?.toLowerCase().includes('ux') || 
                       m.role?.toLowerCase().includes('design')) &&
                      (!uiuxSearchQuery || 
                       m.name?.toLowerCase().includes(uiuxSearchQuery.toLowerCase()) ||
                       m.role?.toLowerCase().includes(uiuxSearchQuery.toLowerCase()))
                    )
                    .map(member => (
                      <option key={member._id} value={member.name}>
                        {member.name} - {member.role}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-text-secondary mt-1">
                  Select from team members with UI/UX design roles
                </p>
              </div>
            )}

            {expenseCategory === 'UI/UX Design Cost' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Project *</label>
                <select
                  {...registerExpense('project')}
                  className="input-premium"
                >
                  <option value="">Select a project (required)</option>
                  {projects
                    .filter(p => p.name && p.name.trim() !== '')
                    .map(project => (
                      <option key={project._id} value={project.name}>
                        {project.name} - {project.client}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-text-secondary mt-1">
                  Link this UI/UX expense to a specific project
                </p>
              </div>
            )}

            {(expenseCategory === 'Marketing Cost' || expenseCategory === 'Office Expenses') && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Project</label>
                <select
                  {...registerExpense('project')}
                  className="input-premium"
                >
                  <option value="">Select a project (optional)</option>
                  {projects
                    .filter(p => p.name && p.name.trim() !== '')
                    .map(project => (
                      <option key={project._id} value={project.name}>
                        {project.name} - {project.client}
                      </option>
                    ))}
                </select>
              </div>
            )}


            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Date *</label>
              <input
                type="date"
                {...registerExpense('date')}
                className="input-premium"
              />
              {expenseErrors.date && <p className="text-red-600 text-sm mt-1">{expenseErrors.date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Description *</label>
              <textarea
                {...registerExpense('description')}
                rows={3}
                className="input-premium"
                placeholder="Enter expense description..."
              />
              {expenseErrors.description && <p className="text-red-600 text-sm mt-1">{expenseErrors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Receipt URL (Optional)</label>
              <input
                type="text"
                {...registerExpense('receipt')}
                className="input-premium"
                placeholder="Paste receipt image URL or leave empty"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Notes (Optional)</label>
              <textarea
                {...registerExpense('notes')}
                rows={2}
                className="input-premium"
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsExpenseModalOpen(false);
                  resetExpense();
                  setSelectedExpense(null);
                  setDeveloperSearchQuery('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-success"
              >
                {selectedExpense ? 'Update Expense' : 'Add Expense'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
