'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { Plus, Search, Filter, Edit, Trash2, Bell, Users, Calendar, DollarSign, ChevronUp, ChevronDown, X, FolderKanban, Copy, Archive, AlertTriangle, Link as LinkIcon, Tag, Info, Check } from 'lucide-react';
import UnifiedSearchSelect from '@/components/UnifiedSearchSelect';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/components/ui/Toast';
import { useApp } from '@/lib/contexts/AppContext';
import { formatUSD, formatINR, usdToInr, inrToUsd } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';

/**
 * Enhanced Projects Page
 * Full CRUD with interlinked dropdowns, sorting, urgency colors, and rich info column
 */

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  client: z.string().min(1, 'Client is required'),
  developers: z.array(z.string()).min(1, 'At least one developer is required'),
  projectType: z.string().min(1, 'Project type is required'),
  subType: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  deadline: z.string().min(1, 'Deadline is required'),
  budget: z.number().min(0, 'Budget must be positive'),
  status: z.enum(['Pending', 'In Progress', 'Review', 'Completed', 'Delayed', 'Overdue']),
  priority: z.enum(['High', 'Medium', 'Low']).optional(),
  tags: z.array(z.string()).optional(),
  revenueLink: z.string().optional(),
  progressPercent: z.number().min(0).max(100).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface Project {
  _id: string;
  name: string;
  description: string;
  client: string;
  developers: string[];
  projectType: string;
  subType?: string;
  startDate: string;
  deadline: string;
  budget: number; // Stored in USD
  budgetInr?: number; // Stored in INR
  status: 'Pending' | 'In Progress' | 'Review' | 'Completed' | 'Delayed' | 'Overdue';
  priority?: 'High' | 'Medium' | 'Low';
  tags?: string[];
  revenueLink?: string;
  assignedTeam?: any[];
  createdAt?: string;
  updatedAt?: string;
  progress?: number;
  progressPercent?: number;
}

type SortField = 'name' | 'deadline' | 'status' | 'budget' | 'created';
type SortDirection = 'asc' | 'desc';

const PROJECT_TYPES = {
  'Web Applications': [
    'Next.js/React',
    'Vue.js/Nuxt',
    'Angular',
    'Static Sites (Next.js/Vercel)',
    'E-commerce (Shopify/Headless)',
  ],
  'Mobile Apps': [
    'Android (Native/Kotlin)',
    'iOS (Swift/SwiftUI)',
    'Flutter (Cross-platform)',
    'React Native',
    'Expo (Rapid prototyping)',
  ],
  'Backend APIs': [
    'Node.js/Express',
    'Python/Django FastAPI',
    'PHP/Laravel',
    'Go/Fiber',
  ],
  'Full Stack': [
    'MERN Stack',
    'MEAN Stack',
    'Jamstack (Next.js + headless CMS)',
  ],
};

const ITEMS_PER_PAGE = 25;

export default function ProjectsPage() {
  const { team, clients, setTeam, setClients } = useApp();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [budgetInRupees, setBudgetInRupees] = useState<string>('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedInfoProject, setSelectedInfoProject] = useState<Project | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [progressPercent, setProgressPercent] = useState<string>('');
  const availableTags = ['React', 'Urgent', 'MVP', 'Flutter', 'Next.js', 'Node.js', 'Python', 'Mobile', 'Web', 'API'];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'Pending',
      developers: [],
      startDate: new Date().toISOString().split('T')[0],
      priority: 'Medium',
      tags: [],
      progressPercent: 0,
    },
  });

  const projectType = watch('projectType');
  const selectedDevelopers = watch('developers') || [];
  const [devSearchQuery, setDevSearchQuery] = useState('');

  // Close popup on outside click
  useEffect(() => {
    if (infoModalOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.project-info-popup') && !target.closest('button[title="View project details"]')) {
          setInfoModalOpen(false);
          setSelectedInfoProject(null);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [infoModalOpen]);

  // Close client dropdown on outside click
  useEffect(() => {
    if (showClientDropdown) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.client-dropdown-container')) {
          setShowClientDropdown(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showClientDropdown]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      // Use API route (fetches from MongoDB)
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch projects from API');
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeamMembers = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        const data = localStorageUtils.getTeam();
        setTeam(Array.isArray(data) ? data : []);
        return;
      }
      
      const res = await fetch('/api/team');
      const data = await res.json();
      setTeam(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  }, []);

  const fetchClients = useCallback(async () => {
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
    }
  }, [setClients]);

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.projectType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(p => p.projectType === typeFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'deadline':
          aValue = new Date(a.deadline).getTime();
          bValue = new Date(b.deadline).getTime();
          break;
        case 'status':
          const statusOrder = ['Pending', 'In Progress', 'Review', 'Delayed', 'Completed'];
          aValue = statusOrder.indexOf(a.status);
          bValue = statusOrder.indexOf(b.status);
          break;
        case 'budget':
          aValue = a.budget;
          bValue = b.budget;
          break;
        case 'created':
        default:
          aValue = new Date(a.createdAt || a._id).getTime();
          bValue = new Date(b.createdAt || b._id).getTime();
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProjects(filtered);
    setCurrentPage(1);
  }, [projects, searchQuery, statusFilter, typeFilter, sortField, sortDirection]);

  useEffect(() => {
    fetchProjects();
    fetchTeamMembers();
    fetchClients();
  }, [fetchProjects, fetchTeamMembers, fetchClients]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  useEffect(() => {
    fetchProjects();
    fetchTeamMembers();
    fetchClients();
  }, [fetchProjects, fetchTeamMembers, fetchClients]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  const getDeadlineStatus = (deadline: string, status: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // If completed, no warning
    if (status === 'Completed') {
      return {
        type: 'completed',
        color: 'text-green-600',
        bg: 'bg-green-50 border-green-200',
        text: '✅ Completed',
        showWarning: false
      };
    }

    // Overdue
    if (diffDays < 0) {
      return {
        type: 'overdue',
        color: 'text-red-600 font-bold animate-pulse',
        bg: 'bg-red-50 border-red-200',
        text: `🚨 Overdue (${Math.abs(diffDays)} days)`,
        showWarning: true
      };
    }

    // Due today
    if (diffDays === 0) {
      return {
        type: 'due-today',
        color: 'text-yellow-600 font-semibold',
        bg: 'bg-yellow-50 border-yellow-200',
        text: '⚠️ Due Today',
        showWarning: true
      };
    }

    // On track
    return {
      type: 'on-track',
      color: 'text-green-600',
      bg: 'bg-green-50 border-green-200',
      text: `🟢 ${diffDays} days left`,
      showWarning: false
    };
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      // Convert rupees to dollars
      const budgetInRupeesNum = parseFloat(budgetInRupees) || 0;
      const budgetInDollars = inrToUsd(budgetInRupeesNum);
      
      if (budgetInRupeesNum <= 0) {
        toast('Please enter a valid budget in rupees', 'error');
        return;
      }
      
      // Use API route (saves to MongoDB)
      const url = selectedProject ? `/api/projects/${selectedProject._id}` : '/api/projects';
      const method = selectedProject ? 'PUT' : 'POST';
      
      const projectData: any = {
        name: data.name.trim(),
        description: data.description.trim(),
        client: data.client,
        assignedTeam: data.developers || [],
        startDate: data.startDate,
        deadline: data.deadline,
        budget: budgetInDollars, // Store in USD
        status: data.status || 'Pending',
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (res.ok) {
        await fetchProjects();
        setIsModalOpen(false);
        reset();
        setBudgetInRupees('');
        setSelectedProject(null);
        setSelectedTags([]);
        toast(
          selectedProject 
            ? 'Project updated successfully!' 
            : 'Project created successfully!',
          'success'
        );
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to save project' }));
        toast(errorData.error || 'Failed to save project. Please try again.', 'error');
      }
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast(error?.message || 'An error occurred. Please try again.', 'error');
    }
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    const developers = project.developers || project.assignedTeam?.map((t: any) => t._id || t) || [];
    setValue('name', project.name);
    setValue('description', project.description);
    setValue('client', project.client);
    setValue('developers', developers);
    setValue('projectType', project.projectType);
    setValue('subType', project.subType || '');
    setValue('startDate', new Date(project.startDate).toISOString().split('T')[0]);
    setValue('deadline', new Date(project.deadline).toISOString().split('T')[0]);
    // Convert USD to INR for display
    const budgetInRupeesValue = (project as any).budgetInr || usdToInr(project.budget);
    setBudgetInRupees(budgetInRupeesValue.toString());
    setValue('budget', project.budget);
    setValue('status', project.status);
    setValue('priority', project.priority || 'Medium');
    setValue('tags', project.tags || []);
    setSelectedTags(project.tags || []);
    setValue('revenueLink', project.revenueLink || '');
    setValue('progressPercent', project.progressPercent || project.progress || 0);
    setProgressPercent((project.progressPercent || project.progress || 0).toString());
    setIsModalOpen(true);
  };

  const handleDuplicate = async (project: Project) => {
    setSelectedProject(null);
    reset();
    const developers = project.developers || project.assignedTeam?.map((t: any) => t._id || t) || [];
    setValue('name', `${project.name} (Copy)`);
    setValue('description', project.description);
    setValue('client', project.client);
    setValue('developers', developers);
    setValue('projectType', project.projectType);
    setValue('subType', project.subType || '');
    setValue('startDate', new Date().toISOString().split('T')[0]);
    setValue('deadline', new Date(project.deadline).toISOString().split('T')[0]);
    const budgetInRupeesValue = (project as any).budgetInr || usdToInr(project.budget);
    setBudgetInRupees(budgetInRupeesValue.toString());
    setValue('budget', project.budget);
    setValue('status', 'Pending');
    setValue('priority', project.priority || 'Medium');
    setValue('tags', project.tags || []);
    setSelectedTags(project.tags || []);
    setValue('revenueLink', project.revenueLink || '');
    setIsModalOpen(true);
  };

  const handleArchive = async (project: Project) => {
    if (!confirm('Are you sure you want to archive this project?')) return;
    try {
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        const updatedProject = { ...project, status: 'Completed' as const, archived: true };
        localStorageUtils.saveProject(updatedProject);
        await fetchProjects();
        toast('Project archived successfully!', 'success');
      }
    } catch (error: any) {
      console.error('Error archiving project:', error);
      toast('An error occurred while archiving.', 'error');
    }
  };

  const handleDelete = async (project: Project) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        localStorageUtils.deleteProject(project._id);
        await fetchProjects();
        toast('Project deleted successfully!', 'success');
        return;
      }
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast('An error occurred while deleting.', 'error');
    }
  };

  const filteredClients = useMemo(() => {
    // Always return clients, filter if there's a search query
    if (!clientSearchQuery || !clientSearchQuery.trim()) {
      return clients; // Show all clients when no search query
    }
    const query = clientSearchQuery.toLowerCase().trim();
    return clients.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.company?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    );
  }, [clients, clientSearchQuery]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  const getDeveloperNames = (developerIds: string[]): string[] => {
    return developerIds.map(id => {
      const dev = team.find(t => t._id === id);
      return dev?.name || id;
    });
  };

  const getLastEditTime = (updatedAt?: string, createdAt?: string): string => {
    if (!updatedAt && !createdAt) return 'Unknown';
    const date = new Date(updatedAt || createdAt || '');
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  const SortableHeader = ({ field, children, className = '', style }: { field: SortField; children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
    <th
      className={`px-2 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${className}`}
      onClick={() => handleSort(field)}
      style={style}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </th>
  );

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
      <div className="space-y-6">
        {/* Header Card - Matching Revenue Page Design */}
        <div className="bg-white rounded-xl py-4 px-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <FolderKanban className="w-5 h-5 text-indigo-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 font-display leading-tight">Projects</h1>
              </div>
              <p className="text-xs text-slate-500 leading-tight">Manage all your projects with full control</p>
            </div>
            <button
              onClick={() => {
                reset();
                setSelectedProject(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-premium pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-premium"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Delayed">Delayed</option>
              <option value="Overdue">Overdue</option>
              <option value="Completed">Completed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-premium"
            >
              <option value="all">All Types</option>
              {Object.keys(PROJECT_TYPES).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Filter className="w-4 h-4" />
              <span>{filteredProjects.length} projects</span>
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ tableLayout: 'fixed' }}>
              <thead className="bg-background border-b border-border sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider" style={{ width: '3%' }}>
                    <input
                      type="checkbox"
                      checked={selectedProjects.size === paginatedProjects.length && paginatedProjects.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProjects(new Set(paginatedProjects.map(p => p._id)));
                        } else {
                          setSelectedProjects(new Set());
                        }
                      }}
                      className="rounded border-border"
                    />
                  </th>
                  <SortableHeader field="name" style={{ width: '15%' }}>Project</SortableHeader>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider" style={{ width: '12%' }}>Client</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider" style={{ width: '10%' }}>Devs</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider" style={{ width: '10%' }}>Type</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider" style={{ width: '8%' }}>Start</th>
                  <SortableHeader field="deadline" style={{ width: '8%' }}>Deadline</SortableHeader>
                  <SortableHeader field="status" style={{ width: '10%' }}>Status</SortableHeader>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider" style={{ width: '8%' }}>Progress</th>
                  <SortableHeader field="budget" style={{ width: '10%' }}>Budget</SortableHeader>
                  <th className="px-2 py-2.5 text-center text-xs font-semibold text-text-primary uppercase tracking-wider" style={{ width: '3%' }}>Info</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-text-primary uppercase tracking-wider" style={{ width: '6%' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {paginatedProjects.length > 0 ? (
                  paginatedProjects.map((project) => {
                    const deadlineStatus = getDeadlineStatus(project.deadline, project.status);
                    const developerNames = getDeveloperNames(project.developers || project.assignedTeam?.map((t: any) => t._id || t) || []);
                    const progressPercent = project.progressPercent || project.progress || 0;
                    
                    return (
                      <tr key={project._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={selectedProjects.has(project._id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedProjects);
                              if (e.target.checked) {
                                newSet.add(project._id);
                              } else {
                                newSet.delete(project._id);
                              }
                              setSelectedProjects(newSet);
                            }}
                            className="rounded border-border"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <div className="text-sm font-medium text-text-primary truncate" title={project.name}>{project.name}</div>
                        </td>
                        <td className="px-2 py-2">
                          <a 
                            href={`/clients?search=${encodeURIComponent(project.client)}`}
                            className="text-sm text-primary-600 hover:text-primary-800 hover:underline truncate block"
                            title={project.client}
                          >
                            {project.client}
                          </a>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-0.5">
                            {developerNames.length > 0 ? (
                              <div className="flex items-center gap-0.5" title={developerNames.join(', ')}>
                                {project.developers.slice(0, 3).map((devId) => {
                                  const dev = team.find(t => t._id === devId);
                                  if (!dev) return null;
                                  const avatar = (dev as any).avatar;
                                  return (
                                    <div
                                      key={devId}
                                      className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold border border-gray-300 shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                      title={`${dev.name} - ${dev.role}`}
                                      style={{
                                        backgroundColor: avatar ? 'transparent' : '#2563eb'
                                      }}
                                    >
                                      {avatar ? (
                                        <Image
                                          src={avatar}
                                          alt={dev.name}
                                          width={24}
                                          height={24}
                                          className="w-full h-full rounded-full object-cover border border-gray-300"
                                        />
                                      ) : (
                                        dev.name.charAt(0).toUpperCase()
                                      )}
                                    </div>
                                  );
                                })}
                                {developerNames.length > 3 && (
                                  <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium border border-white shadow-sm">
                                    +{developerNames.length - 3}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedProject(project);
                                  setSelectedTeamMembers([]);
                                  setIsAssignModalOpen(true);
                                }}
                                className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs hover:bg-gray-200 transition-colors"
                                title="Assign Developers"
                              >
                                <Users className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="text-xs text-text-secondary truncate" title={`${project.projectType}${project.subType ? ` - ${project.subType}` : ''}`}>
                            {project.projectType}
                            {project.subType && <span className="text-xs"> ({project.subType})</span>}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="text-xs text-text-secondary">
                            {formatDate(project.startDate)}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className={`text-xs px-2 py-0.5 rounded-md border ${deadlineStatus.bg} ${deadlineStatus.color}`}>
                            {formatDate(project.deadline)}
                            {deadlineStatus.showWarning && project.status !== 'Completed' && (
                              <span className="ml-1 text-xs">{deadlineStatus.type === 'overdue' ? '🚨' : '⚠️'}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                              project.status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : project.status === 'In Progress'
                                ? 'bg-blue-100 text-blue-800'
                                : project.status === 'Review'
                                ? 'bg-purple-100 text-purple-800'
                                : project.status === 'Delayed'
                                ? 'bg-orange-100 text-orange-800'
                                : project.status === 'Overdue'
                                ? 'bg-red-200 text-red-900 font-bold'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {project.status === 'Completed' ? '🟢' : project.status === 'In Progress' ? '🔵' : project.status === 'Review' ? '🟠' : project.status === 'Delayed' ? '🟣' : project.status === 'Overdue' ? '🔴' : '🟡'} {project.status}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <div className="w-10 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  progressPercent >= 100 ? 'bg-green-500' :
                                  progressPercent >= 75 ? 'bg-blue-500' :
                                  progressPercent >= 50 ? 'bg-yellow-500' :
                                  progressPercent >= 25 ? 'bg-orange-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-text-primary">
                              {progressPercent}%
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <a
                            href={`/revenue?search=${encodeURIComponent(project.name)}`}
                            className="text-xs font-semibold text-primary-600 hover:text-primary-800 hover:underline block truncate"
                            title={formatINR((project as any).budgetInr || (project.budget ? usdToInr(project.budget) : 0))}
                          >
                            {formatINR((project as any).budgetInr || (project.budget ? usdToInr(project.budget) : 0))}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setPopupPosition({
                                x: rect.left + rect.width / 2,
                                y: rect.top + rect.height + 8
                              });
                              setSelectedInfoProject(project);
                              setInfoModalOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
                            title="View project details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(project)}
                              className="p-1 text-primary-500 hover:bg-primary-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(project)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                              title="Notify"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-text-secondary">
                      No projects found. Click &quot;New Project&quot; to create one.
                    </td>
                  </tr>
                )}
              </tbody>
              {filteredProjects.length > 0 && (
                <tfoot className="bg-background border-t-2 border-border">
                  <tr>
                    <td colSpan={7} className="px-4 py-3 text-right text-xs font-semibold text-text-primary uppercase">
                      Total Budget:
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-bold text-text-primary">
                        {formatINR(
                          filteredProjects.reduce((sum, p) => {
                            const budgetInr = (p as any).budgetInr || (p.budget ? usdToInr(p.budget) : 0);
                            return sum + budgetInr;
                          }, 0)
                        )}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {formatUSD(
                          filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0)
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs text-text-secondary">
                        Avg: {formatINR(
                          Math.round(
                            filteredProjects.reduce((sum, p) => {
                              const budgetInr = (p as any).budgetInr || (p.budget ? usdToInr(p.budget) : 0);
                              return sum + budgetInr;
                            }, 0) / filteredProjects.length
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <div className="text-sm text-text-secondary">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)} of {filteredProjects.length} projects
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-border rounded-lg hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-text-secondary">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-border rounded-lg hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Project Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            reset();
            setBudgetInRupees('');
            setSelectedProject(null);
            setClientSearchQuery('');
            setSelectedTags([]);
            setProgressPercent('');
            setShowClientDropdown(false);
          }}
          title={selectedProject ? 'Edit Project' : 'New Project'}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            {/* Deadline Warning Banner */}
            {watch('deadline') && (() => {
              const deadlineStatus = getDeadlineStatus(watch('deadline'), watch('status'));
              if (deadlineStatus.showWarning && watch('status') !== 'Completed') {
                return (
                  <div className={`border-l-4 p-4 rounded-lg ${
                    deadlineStatus.type === 'overdue' 
                      ? 'bg-red-50 border-red-500' 
                      : 'bg-yellow-50 border-yellow-500'
                  }`}>
                    <div className="flex items-start">
                      <AlertTriangle className={`w-5 h-5 mt-0.5 mr-3 ${
                        deadlineStatus.type === 'overdue' ? 'text-red-600' : 'text-yellow-600'
                      }`} />
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${
                          deadlineStatus.type === 'overdue' ? 'text-red-800' : 'text-yellow-800'
                        }`}>
                          {deadlineStatus.type === 'overdue' ? '🚨 Deadline has passed!' : '⚠️ Due Today!'}
                        </p>
                        <p className={`text-xs mt-1 ${
                          deadlineStatus.type === 'overdue' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {deadlineStatus.type === 'overdue' 
                            ? 'Status will be set to "Overdue" automatically.' 
                            : 'Consider updating status or extending deadline.'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {deadlineStatus.type === 'overdue' && (
                            <button
                              type="button"
                              onClick={() => setValue('status', 'Overdue')}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                            >
                              🔴 Mark as Overdue
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setValue('status', 'Completed')}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                          >
                            🟢 Mark as Done
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Section 1: Basic Information */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-300">
                <FolderKanban className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-text-primary">Basic Information</h3>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name')}
                  className="input-premium"
                  placeholder="e.g., E-commerce Platform"
                />
                {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="input-premium"
                  placeholder="Brief description of the project..."
                />
                {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>}
              </div>

              <div className="relative client-dropdown-container">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Client <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4 z-10 pointer-events-none" />
                  <input
                    type="text"
                    value={clientSearchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setClientSearchQuery(value);
                      setShowClientDropdown(true);
                      // If user clears the input, also clear the selected client
                      if (!value.trim()) {
                        setValue('client', '', { shouldValidate: true });
                      }
                    }}
                    onFocus={() => {
                      setShowClientDropdown(true);
                    }}
                    className="input-premium pl-10 pr-10"
                    placeholder="Type to search clients..."
                  />
                  {watch('client') && (
                    <button
                      type="button"
                      onClick={() => {
                        setValue('client', '');
                        setClientSearchQuery('');
                        setShowClientDropdown(false);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {showClientDropdown && (
                    <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {filteredClients.length > 0 ? (
                        filteredClients.map(client => (
                          <button
                            key={client._id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setValue('client', client.name, { shouldValidate: true });
                              setClientSearchQuery(client.name);
                              setShowClientDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between border-b border-gray-200 last:border-b-0 ${
                              watch('client') === client.name ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text-primary">{client.name}</p>
                              {client.company && (
                                <p className="text-xs text-text-secondary mt-0.5">{client.company}</p>
                              )}
                              {client.email && (
                                <p className="text-xs text-text-secondary">{client.email}</p>
                              )}
                            </div>
                            {watch('client') === client.name && (
                              <Check className="w-4 h-4 text-green-600 ml-2 flex-shrink-0" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-text-secondary text-center">
                          {clientSearchQuery ? 'No clients found. Try a different search term.' : clients.length === 0 ? 'No clients available. Add clients first.' : 'Type to search clients...'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {watch('client') && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-md flex items-center gap-2">
                      <Check className="w-3 h-3" />
                      {watch('client')}
                    </span>
                  </div>
                )}
                {errors.client && <p className="text-red-600 text-xs mt-1">{errors.client.message}</p>}
              </div>
            </div>

            {/* Section 2: Team & Project Type */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-300">
                <Users className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-text-primary">Team & Project Type</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Developers <span className="text-red-500">*</span>
                </label>
                <UnifiedSearchSelect
                  options={team
                    .filter(m => {
                      // Show team members if:
                      // 1. They have category === 'Developer', OR
                      // 2. Their role contains 'developer' (case-insensitive), OR
                      // 3. They don't have a category set (backward compatibility - show all existing members)
                      const category = (m as any).category;
                      const roleLower = (m.role || '').toLowerCase();
                      
                      // If category is not set (undefined/null/empty), show the member (backward compatibility)
                      if (!category || category === '' || category === undefined || category === null) {
                        return true;
                      }
                      
                      // If category is set, only show if it's 'Developer' or role contains 'developer'
                      return category === 'Developer' || roleLower.includes('developer');
                    })
                    .map(m => ({ _id: m._id, name: m.name, role: m.role, avatar: (m as any).avatar }))}
                  selected={selectedDevelopers}
                  onChange={(selected) => {
                    setValue('developers', selected, { shouldValidate: true });
                  }}
                  placeholder="Search or select developers..."
                  multiSelect={true}
                  error={errors.developers?.message}
                />
                {selectedDevelopers.length > 0 && (
                  <p className="text-xs text-text-secondary mt-1">
                    {selectedDevelopers.length} developer{selectedDevelopers.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Project Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('projectType')}
                    className="input-premium"
                    onChange={(e) => {
                      setValue('projectType', e.target.value);
                      setValue('subType', '');
                    }}
                  >
                    <option value="">Select type</option>
                    {Object.keys(PROJECT_TYPES).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.projectType && <p className="text-red-600 text-xs mt-1">{errors.projectType.message}</p>}
                </div>

                {projectType && PROJECT_TYPES[projectType as keyof typeof PROJECT_TYPES]?.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Sub-Type</label>
                    <select
                      {...register('subType')}
                      className="input-premium"
                    >
                      <option value="">Select sub-type</option>
                      {PROJECT_TYPES[projectType as keyof typeof PROJECT_TYPES].map(subType => (
                        <option key={subType} value={subType}>{subType}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Timeline */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-300">
                <Calendar className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-text-primary">Timeline</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="input-premium"
                  />
                  {errors.startDate && <p className="text-red-600 text-xs mt-1">{errors.startDate.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('deadline')}
                    className="input-premium"
                    onChange={(e) => {
                      setValue('deadline', e.target.value);
                      const deadlineStatus = getDeadlineStatus(e.target.value, watch('status'));
                      if (deadlineStatus.type === 'overdue' && watch('status') !== 'Completed') {
                        setValue('status', 'Overdue');
                      }
                    }}
                  />
                  {watch('deadline') && watch('startDate') && (() => {
                    const start = new Date(watch('startDate'));
                    const end = new Date(watch('deadline'));
                    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <p className="text-xs text-text-secondary mt-1">
                        Duration: {diffDays} day{diffDays !== 1 ? 's' : ''}
                      </p>
                    );
                  })()}
                  {errors.deadline && <p className="text-red-600 text-xs mt-1">{errors.deadline.message}</p>}
                </div>
              </div>
            </div>

            {/* Section 4: Budget & Status */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-300">
                <DollarSign className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-text-primary">Budget & Status</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Budget (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={budgetInRupees}
                    onChange={(e) => {
                      setBudgetInRupees(e.target.value);
                      const inrValue = parseFloat(e.target.value) || 0;
                      setValue('budget', inrToUsd(inrValue), { shouldValidate: true });
                    }}
                    className="input-premium"
                    placeholder="Enter budget in rupees"
                  />
                  {budgetInRupees && parseFloat(budgetInRupees) > 0 && (
                    <p className="text-xs text-text-secondary mt-1">
                      ≈ {formatUSD(inrToUsd(parseFloat(budgetInRupees)))}
                    </p>
                  )}
                  {errors.budget && <p className="text-red-600 text-xs mt-1">{errors.budget.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('status')}
                    className="input-premium"
                  >
                    <option value="Pending">🟡 Pending</option>
                    <option value="In Progress">🔵 In Progress</option>
                    <option value="Review">🟠 Review</option>
                    <option value="Delayed">🟣 Delayed</option>
                    <option value="Overdue">🔴 Overdue</option>
                    <option value="Completed">🟢 Completed</option>
                  </select>
                  {watch('status') && (
                    <div className="mt-2">
                      <span className={`px-3 py-1 rounded-md text-xs font-medium inline-block ${
                        watch('status') === 'Completed'
                          ? 'bg-green-100 text-green-800'
                          : watch('status') === 'In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : watch('status') === 'Review'
                          ? 'bg-purple-100 text-purple-800'
                          : watch('status') === 'Delayed'
                          ? 'bg-orange-100 text-orange-800'
                          : watch('status') === 'Overdue'
                          ? 'bg-red-200 text-red-900 font-bold'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {watch('status') === 'Completed' ? '🟢' : watch('status') === 'In Progress' ? '🔵' : watch('status') === 'Review' ? '🟠' : watch('status') === 'Delayed' ? '🟣' : watch('status') === 'Overdue' ? '🔴' : '🟡'} {watch('status')}
                      </span>
                    </div>
                  )}
                  {errors.status && <p className="text-red-600 text-xs mt-1">{errors.status.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Priority</label>
                  <select
                    {...register('priority')}
                    className="input-premium"
                  >
                    <option value="Low">🟢 Low</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="High">🔴 High</option>
                  </select>
                  {errors.priority && <p className="text-red-600 text-xs mt-1">{errors.priority.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Progress (%)</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={progressPercent}
                        onChange={(e) => {
                          const value = e.target.value;
                          setProgressPercent(value);
                          const numValue = parseFloat(value) || 0;
                          const clampedValue = Math.min(100, Math.max(0, numValue));
                          setValue('progressPercent', clampedValue, { shouldValidate: true });
                        }}
                        onBlur={() => {
                          // Ensure value is set even if user doesn't type
                          if (!progressPercent || progressPercent === '') {
                            setProgressPercent('0');
                            setValue('progressPercent', 0);
                          }
                        }}
                        className="input-premium w-28"
                        placeholder="0-100"
                      />
                      <span className="text-sm text-text-secondary">%</span>
                    </div>
                    <div className="flex-1">
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full transition-all duration-300 ${
                            parseFloat(progressPercent || '0') >= 100 ? 'bg-green-500' :
                            parseFloat(progressPercent || '0') >= 75 ? 'bg-blue-500' :
                            parseFloat(progressPercent || '0') >= 50 ? 'bg-yellow-500' :
                            parseFloat(progressPercent || '0') >= 25 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(parseFloat(progressPercent || '0'), 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-text-secondary">
                          {parseFloat(progressPercent || '0') >= 100 ? '✅ Complete' : 
                           parseFloat(progressPercent || '0') >= 75 ? '⏳ Almost Done' : 
                           parseFloat(progressPercent || '0') >= 50 ? '🚧 In Progress' : 
                           parseFloat(progressPercent || '0') >= 25 ? '📋 Started' : 
                           '📝 Not Started'}
                        </span>
                        <span className="text-xs font-medium text-text-primary">
                          {Math.round(parseFloat(progressPercent || '0'))}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Revenue Link</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                  <input
                    type="text"
                    {...register('revenueLink')}
                    className="input-premium pl-10"
                    placeholder="Link to revenue entry (optional)"
                  />
                </div>
                {errors.revenueLink && <p className="text-red-600 text-xs mt-1">{errors.revenueLink.message}</p>}
              </div>
            </div>

            {/* Section 5: Tags */}
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-300">
                <Tag className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-text-primary">Tags & Labels</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Project Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {availableTags.map(tag => (
                    <label key={tag} className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 border border-border rounded-md hover:bg-hover transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newTags = [...selectedTags, tag];
                            setSelectedTags(newTags);
                            setValue('tags', newTags);
                          } else {
                            const newTags = selectedTags.filter(t => t !== tag);
                            setSelectedTags(newTags);
                            setValue('tags', newTags);
                          }
                        }}
                        className="rounded border-border"
                      />
                      <span className="text-sm text-text-secondary">{tag}</span>
                    </label>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-md flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const newTags = selectedTags.filter(t => t !== tag);
                            setSelectedTags(newTags);
                            setValue('tags', newTags);
                          }}
                          className="hover:text-primary-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300 bg-gradient-to-r from-gray-50 to-white -mx-6 -mb-6 px-6 py-4 rounded-b-lg sticky bottom-0 shadow-lg">
              <div className="flex gap-2">
                {selectedProject && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(selectedProject)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchive(selectedProject)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                    setSelectedProject(null);
                    setClientSearchQuery('');
                    setSelectedTags([]);
                    setProgressPercent('');
                    setShowClientDropdown(false);
                  }}
                  className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  {selectedProject ? (
                    <>
                      <Edit className="w-4 h-4" />
                      Update Project
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </Modal>

        {/* Assign Developers Modal */}
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedProject(null);
            setSelectedTeamMembers([]);
            setAssignSearchQuery('');
          }}
          title={`Assign Developers - ${selectedProject?.name || 'Project'}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
              <input
                type="text"
                value={assignSearchQuery}
                onChange={(e) => setAssignSearchQuery(e.target.value)}
                className="input-premium pl-10"
                placeholder="Search team members..."
              />
            </div>
            
            <div className="border border-border rounded-lg p-2 max-h-64 overflow-y-auto">
              {team
                .filter(member => 
                  member.name.toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
                  member.role.toLowerCase().includes(assignSearchQuery.toLowerCase())
                )
                .map(member => (
                  <label key={member._id} className="flex items-center gap-3 p-3 hover:bg-hover rounded cursor-pointer border-b border-border last:border-b-0">
                    <input
                      type="checkbox"
                      checked={selectedTeamMembers.includes(member._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTeamMembers([...selectedTeamMembers, member._id]);
                        } else {
                          setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== member._id));
                        }
                      }}
                      className="rounded w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">{member.name}</div>
                      <div className="text-xs text-text-secondary">{member.role}</div>
                    </div>
                  </label>
                ))}
            </div>

            <div className="bg-background p-3 rounded-lg">
              <p className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">Assigned: </span>
                {selectedTeamMembers.length > 0 ? (
                  <>
                    {selectedTeamMembers.map(id => {
                      const member = team.find(t => t._id === id);
                      return member?.name;
                    }).filter(Boolean).join(', ')}
                    <span className="text-text-secondary"> ({selectedTeamMembers.length}/{team.length} devs)</span>
                  </>
                ) : (
                  <span className="text-text-secondary">No developers selected</span>
                )}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedProject(null);
                  setSelectedTeamMembers([]);
                  setAssignSearchQuery('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!selectedProject) return;
                  
                  try {
                    if (typeof window !== 'undefined') {
                      const { localStorageUtils } = await import('@/lib/localStorage');
                      const projects = localStorageUtils.getProjects();
                      const projectIndex = projects.findIndex((p: any) => p._id === selectedProject._id);
                      
                      if (projectIndex !== -1) {
                        projects[projectIndex] = {
                          ...projects[projectIndex],
                          developers: selectedTeamMembers,
                          assignedTeam: selectedTeamMembers,
                          updatedAt: new Date().toISOString(),
                        };
                        localStorage.setItem('rootkit_projects', JSON.stringify(projects));
                        await fetchProjects();
                        setIsAssignModalOpen(false);
                        setSelectedProject(null);
                        setSelectedTeamMembers([]);
                        setAssignSearchQuery('');
                        toast('Developers assigned successfully!', 'success');
                      }
                    }
                  } catch (error: any) {
                    console.error('Error assigning developers:', error);
                    toast('An error occurred while assigning developers.', 'error');
                  }
                }}
                className="btn-primary"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </Modal>

        {/* Project Info Popup Card */}
        {infoModalOpen && selectedInfoProject && (() => {
          const developerNames = getDeveloperNames(selectedInfoProject.developers || selectedInfoProject.assignedTeam?.map((t: any) => t._id || t) || []);
          const budgetInr = (selectedInfoProject as any).budgetInr || (selectedInfoProject.budget ? usdToInr(selectedInfoProject.budget) : 0);
          const deadlineStatus = getDeadlineStatus(selectedInfoProject.deadline, selectedInfoProject.status);
          
          return (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-20 z-[9998]"
                onClick={() => {
                  setInfoModalOpen(false);
                  setSelectedInfoProject(null);
                }}
              />
              {/* Popup Card */}
              <div
                className="project-info-popup fixed z-[9999] bg-white rounded-lg shadow-2xl border border-gray-200 p-4 max-w-sm w-[380px] max-h-[85vh] overflow-y-auto"
                style={{
                  left: typeof window !== 'undefined' ? `${Math.min(popupPosition.x - 190, window.innerWidth - 400)}px` : `${popupPosition.x - 190}px`,
                  top: typeof window !== 'undefined' ? `${Math.min(popupPosition.y, window.innerHeight - 100)}px` : `${popupPosition.y}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-bold text-text-primary">{selectedInfoProject.name}</h3>
                  <button
                    onClick={() => {
                      setInfoModalOpen(false);
                      setSelectedInfoProject(null);
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Client */}
                  <div>
                    <span className="text-text-secondary font-medium">Client: </span>
                    <a 
                      href={`/clients?search=${encodeURIComponent(selectedInfoProject.client)}`}
                      className="text-primary-600 hover:underline"
                    >
                      {selectedInfoProject.client}
                    </a>
                  </div>

                  {/* Description */}
                  <div>
                    <span className="text-text-secondary font-medium">Description: </span>
                    <p className="text-text-primary mt-0.5 line-clamp-2">{selectedInfoProject.description}</p>
                  </div>

                  {/* Type */}
                  <div>
                    <span className="text-text-secondary font-medium">Type: </span>
                    <span className="text-text-primary">{selectedInfoProject.projectType}</span>
                    {selectedInfoProject.subType && (
                      <span className="text-text-secondary"> ({selectedInfoProject.subType})</span>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-text-secondary font-medium">Start: </span>
                      <span className="text-text-primary">{formatDate(selectedInfoProject.startDate)}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary font-medium">Deadline: </span>
                      <span className={`${deadlineStatus.color}`}>{formatDate(selectedInfoProject.deadline)}</span>
                    </div>
                  </div>

                  {/* Status & Priority */}
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-text-secondary font-medium">Status: </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          selectedInfoProject.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : selectedInfoProject.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : selectedInfoProject.status === 'Review'
                            ? 'bg-purple-100 text-purple-800'
                            : selectedInfoProject.status === 'Delayed'
                            ? 'bg-orange-100 text-orange-800'
                            : selectedInfoProject.status === 'Overdue'
                            ? 'bg-red-200 text-red-900 font-bold'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {selectedInfoProject.status === 'Completed' ? '🟢' : selectedInfoProject.status === 'In Progress' ? '🔵' : selectedInfoProject.status === 'Review' ? '🟠' : selectedInfoProject.status === 'Delayed' ? '🟣' : selectedInfoProject.status === 'Overdue' ? '🔴' : '🟡'} {selectedInfoProject.status}
                      </span>
                    </div>
                    {selectedInfoProject.priority && (
                      <div>
                        <span className="text-text-secondary font-medium">Priority: </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          selectedInfoProject.priority === 'High' ? 'bg-red-100 text-red-800' :
                          selectedInfoProject.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {selectedInfoProject.priority === 'High' ? '🔴' : selectedInfoProject.priority === 'Medium' ? '🟡' : '🟢'} {selectedInfoProject.priority}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Budget */}
                  <div>
                    <span className="text-text-secondary font-medium">Budget: </span>
                    <span className="text-text-primary font-semibold">{formatINR(budgetInr)}</span>
                    <span className="text-text-secondary ml-1">({formatUSD(selectedInfoProject.budget || 0)})</span>
                  </div>

                  {/* Developers */}
                  <div>
                    <span className="text-text-secondary font-medium">Developers ({developerNames.length}): </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {developerNames.slice(0, 5).map((name, idx) => {
                        const dev = team.find(t => t.name === name);
                        return (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {name}
                          </span>
                        );
                      })}
                      {developerNames.length > 5 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                          +{developerNames.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {selectedInfoProject.tags && selectedInfoProject.tags.length > 0 && (
                    <div>
                      <span className="text-text-secondary font-medium">Tags: </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedInfoProject.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Edit Button */}
                  <div className="pt-2 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setInfoModalOpen(false);
                        handleEdit(selectedInfoProject);
                      }}
                      className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-3 h-3" />
                      Edit Project
                    </button>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </Layout>
  );
}

// Generate mock projects for testing (8 projects with ₹ budgets)
function generateMockProjects(): Project[] {
  const now = new Date();
  return [
    {
      _id: 'project_1',
      name: 'E-Commerce Platform',
      description: 'Full-stack e-commerce solution with payment integration',
      client: 'TechCorp Inc',
      developers: ['team_1', 'team_2'],
      projectType: 'Full Stack',
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days (yellow)
      budget: inrToUsd(4500000), // ₹45,00,000
      budgetInr: 4500000,
      status: 'In Progress',
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
      progress: 65,
    },
    {
      _id: 'project_2',
      name: 'Mobile Banking App',
      description: 'Native iOS banking application',
      client: 'FinanceBank',
      developers: ['team_3'],
      projectType: 'iOS App',
      subType: 'Native',
      startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday (red)
      budget: inrToUsd(8000000), // ₹80,00,000
      budgetInr: 8000000,
      status: 'Delayed',
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1d ago
      progress: 45,
    },
    {
      _id: 'project_3',
      name: 'Flutter Social App',
      description: 'Cross-platform social media application',
      client: 'SocialMedia Co',
      developers: ['team_2', 'team_4'],
      projectType: 'Android App',
      subType: 'Flutter',
      startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deadline: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days (green)
      budget: inrToUsd(6000000), // ₹60,00,000
      budgetInr: 6000000,
      status: 'In Progress',
      createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5h ago
      progress: 30,
    },
    {
      _id: 'project_4',
      name: 'REST API Backend',
      description: 'Scalable backend API for microservices',
      client: 'CloudTech Solutions',
      developers: ['team_1', 'team_3', 'team_4'],
      projectType: 'Backend API',
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deadline: new Date(now.getTime() + 0 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Today (red)
      budget: inrToUsd(4000000), // ₹40,00,000
      budgetInr: 4000000,
      status: 'Review',
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30m ago
      progress: 90,
    },
    {
      _id: 'project_5',
      name: 'Web Dashboard',
      description: 'Admin dashboard with analytics',
      client: 'DataAnalytics Ltd',
      developers: ['team_2'],
      projectType: 'Web App',
      startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deadline: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 20 days (green)
      budget: inrToUsd(3000000), // ₹30,00,000
      budgetInr: 3000000,
      status: 'Completed',
      createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3d ago
      progress: 100,
    },
    {
      _id: 'project_6',
      name: 'React Native E-Learning',
      description: 'Mobile learning platform for students',
      client: 'EduTech Solutions',
      developers: ['team_1', 'team_5'],
      projectType: 'Android App',
      subType: 'React Native',
      startDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days (green)
      budget: inrToUsd(5500000), // ₹55,00,000
      budgetInr: 5500000,
      status: 'In Progress',
      createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4h ago
      progress: 50,
    },
    {
      _id: 'project_7',
      name: 'SwiftUI Finance App',
      description: 'Modern iOS finance tracking app',
      client: 'FinTech Innovations',
      developers: ['team_3', 'team_6'],
      projectType: 'iOS App',
      subType: 'SwiftUI',
      startDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days (yellow)
      budget: inrToUsd(7000000), // ₹70,00,000
      budgetInr: 7000000,
      status: 'Review',
      createdAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1h ago
      progress: 85,
    },
    {
      _id: 'project_8',
      name: 'Microservices Architecture',
      description: 'Enterprise microservices platform',
      client: 'Enterprise Corp',
      developers: ['team_1', 'team_2', 'team_4', 'team_5'],
      projectType: 'Backend API',
      startDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      deadline: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 25 days (green)
      budget: inrToUsd(10000000), // ₹1,00,00,000
      budgetInr: 10000000,
      status: 'In Progress',
      createdAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(), // 6h ago
      progress: 40,
    },
  ];
}
