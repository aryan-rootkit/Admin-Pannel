'use client';

import { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { Plus, Search, Filter, Edit, Trash2, Bell, Users, Calendar, DollarSign, ChevronUp, ChevronDown, X } from 'lucide-react';
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
  assignedTeam?: any[];
  createdAt?: string;
  updatedAt?: string;
  progress?: number;
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
    },
  });

  const projectType = watch('projectType');
  const selectedDevelopers = watch('developers') || [];
  const [devSearchQuery, setDevSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchTeamMembers();
    fetchClients();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [projects, searchQuery, statusFilter, typeFilter, sortField, sortDirection]);

  const fetchProjects = async () => {
    try {
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        const data = localStorageUtils.getProjects();
        const projectsData = Array.isArray(data) ? data : [];
        // Add mock data if empty
        if (projectsData.length === 0) {
          const mockProjects = generateMockProjects();
          mockProjects.forEach(p => localStorageUtils.saveProject(p));
          setProjects(mockProjects);
        } else {
          setProjects(projectsData);
        }
        setLoading(false);
        return;
      }
      
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
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
  };

  const fetchClients = async () => {
    try {
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        const data = localStorageUtils.getClients();
        setClients(Array.isArray(data) ? data : []);
        return;
      }
      
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const applyFiltersAndSort = () => {
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
  };

  const getUrgencyColor = (deadline: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-600 font-bold animate-pulse'; // Overdue
    if (diffDays === 0) return 'text-red-600 font-bold animate-pulse'; // Today
    if (diffDays <= 7) return 'text-yellow-600 font-semibold'; // 1-7 days
    return 'text-green-600'; // >7 days
  };

  const getUrgencyBg = (deadline: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'bg-red-50 border-red-200'; // Overdue
    if (diffDays === 0) return 'bg-red-50 border-red-200'; // Today
    if (diffDays <= 7) return 'bg-yellow-50 border-yellow-200'; // 1-7 days
    return 'bg-green-50 border-green-200'; // >7 days
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
      
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        
        const projectData: any = {
          name: data.name.trim(),
          description: data.description.trim(),
          client: data.client,
          developers: data.developers,
          projectType: data.projectType,
          subType: data.subType || '',
          startDate: data.startDate,
          deadline: data.deadline,
          budget: budgetInDollars, // Store in USD
          budgetInr: budgetInRupeesNum, // Store in INR for display
          status: data.status,
          assignedTeam: data.developers,
          _id: selectedProject?._id || undefined,
          createdAt: selectedProject?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          progress: selectedProject?.progress || 0,
        };
        
        localStorageUtils.saveProject(projectData);
        await fetchProjects();
        setIsModalOpen(false);
        reset();
        setBudgetInRupees('');
        setSelectedProject(null);
        toast(
          selectedProject 
            ? 'Project updated successfully!' 
            : 'Project created successfully!',
          'success'
        );
        return;
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
    setIsModalOpen(true);
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
    if (!clientSearchQuery) return clients;
    return clients.filter(c =>
      c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
      c.company?.toLowerCase().includes(clientSearchQuery.toLowerCase())
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

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => handleSort(field)}
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2 font-display">Projects</h1>
            <p className="text-text-secondary text-base">Manage all your projects with full control</p>
          </div>
          <button
            onClick={() => {
              reset();
              setSelectedProject(null);
              setIsModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        {/* Search and Filters */}
        <div className="card-premium p-4">
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
        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-border">
                <tr>
                  <SortableHeader field="name">Project Name</SortableHeader>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Developers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Start</th>
                  <SortableHeader field="deadline">Deadline</SortableHeader>
                  <SortableHeader field="status">Status</SortableHeader>
                  <SortableHeader field="budget">Budget</SortableHeader>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Info</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border">
                {paginatedProjects.length > 0 ? (
                  paginatedProjects.map((project) => {
                    const urgencyColor = getUrgencyColor(project.deadline);
                    const urgencyBg = getUrgencyBg(project.deadline);
                    const developerNames = getDeveloperNames(project.developers || project.assignedTeam?.map((t: any) => t._id || t) || []);
                    
                    return (
                      <tr key={project._id} className="hover:bg-hover transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-text-primary">{project.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-text-secondary">{project.client}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {developerNames.length > 0 ? (
                              <div className="flex items-center gap-1" title={developerNames.join(', ')}>
                                {project.developers.slice(0, 5).map((devId) => {
                                  const dev = team.find(t => t._id === devId);
                                  if (!dev) return null;
                                  const avatar = (dev as any).avatar;
                                  return (
                                    <div
                                      key={devId}
                                      className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                      title={`${dev.name} - ${dev.role}`}
                                    >
                                      {avatar ? (
                                        <img src={avatar} alt={dev.name} className="w-full h-full rounded-full object-cover" />
                                      ) : (
                                        dev.name.charAt(0).toUpperCase()
                                      )}
                                    </div>
                                  );
                                })}
                                {developerNames.length > 5 && (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm">
                                    +{developerNames.length - 5}
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
                                className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs hover:bg-gray-200 transition-colors"
                                title="Assign Developers"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-text-secondary">
                            {project.projectType}
                            {project.subType && <span className="text-xs text-text-secondary"> ({project.subType})</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-text-secondary">
                            {formatDate(project.startDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm px-3 py-1 rounded-lg border ${urgencyBg} ${urgencyColor}`}>
                            {formatDate(project.deadline)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              project.status === 'Completed'
                                ? 'bg-green-100 text-green-800'
                                : project.status === 'In Progress'
                                ? 'bg-blue-100 text-blue-800'
                                : project.status === 'Review'
                                ? 'bg-purple-100 text-purple-800'
                                :                               project.status === 'Delayed'
                                ? 'bg-red-100 text-red-800'
                                : project.status === 'Overdue'
                                ? 'bg-red-200 text-red-900 font-bold animate-pulse'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-text-primary">
                            {formatINR((project as any).budgetInr || (project.budget ? usdToInr(project.budget) : 0))}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {formatUSD(project.budget || 0)} USD
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                              <Users className="w-3 h-3" />
                              <span>{developerNames.length} devs</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                              <Calendar className="w-3 h-3" />
                              <span>Last edit: {getLastEditTime(project.updatedAt, project.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => handleEdit(project)}
                                className="p-1 text-primary-500 hover:bg-primary-50 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(project)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                                title="Notify"
                              >
                                <Bell className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-text-secondary">
                      No projects found. Click "New Project" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
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
          }}
          title={selectedProject ? 'Edit Project' : 'New Project'}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Project Name</label>
              <input
                {...register('name')}
                className="input-premium"
                placeholder="Enter project name"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Client</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                <input
                  type="text"
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  onFocus={() => setClientSearchQuery('')}
                  className="input-premium pl-10"
                  placeholder="Search clients..."
                />
              </div>
              <select
                {...register('client')}
                className="input-premium mt-2"
              >
                <option value="">Select a client</option>
                {filteredClients.map(client => (
                  <option key={client._id} value={client.name}>{client.name} {client.company && `(${client.company})`}</option>
                ))}
              </select>
              {errors.client && <p className="text-red-600 text-sm mt-1">{errors.client.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Developers</label>
              <UnifiedSearchSelect
                options={team.map(m => ({ _id: m._id, name: m.name, role: m.role, avatar: (m as any).avatar }))}
                selected={selectedDevelopers}
                onChange={(selected) => {
                  setValue('developers', selected, { shouldValidate: true });
                }}
                placeholder="Search or select developers..."
                multiSelect={true}
                error={errors.developers?.message}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Project Type</label>
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
                {errors.projectType && <p className="text-red-600 text-sm mt-1">{errors.projectType.message}</p>}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Start Date</label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="input-premium"
                />
                {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">End Date (Deadline)</label>
                <input
                  type="date"
                  {...register('deadline')}
                  className="input-premium"
                  onChange={(e) => {
                    setValue('deadline', e.target.value);
                    // Check if deadline has passed
                    const deadlineDate = new Date(e.target.value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    deadlineDate.setHours(0, 0, 0, 0);
                    if (deadlineDate < today) {
                      setValue('status', 'Overdue');
                    }
                  }}
                />
                {watch('deadline') && (() => {
                  const deadlineDate = new Date(watch('deadline'));
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  deadlineDate.setHours(0, 0, 0, 0);
                  if (deadlineDate < today && watch('status') !== 'Completed') {
                    return (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">⚠️ Deadline has passed!</p>
                        <p className="text-xs text-red-600 mt-1">Status will be set to "Overdue" automatically.</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => setValue('status', 'Overdue')}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                          >
                            🔴 Mark as Overdue
                          </button>
                          <button
                            type="button"
                            onClick={() => setValue('status', 'Completed')}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            🟢 Mark as Done
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                {errors.deadline && <p className="text-red-600 text-sm mt-1">{errors.deadline.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Budget (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={budgetInRupees}
                  onChange={(e) => {
                    setBudgetInRupees(e.target.value);
                    // Auto-update USD amount for validation
                    const inrValue = parseFloat(e.target.value) || 0;
                    setValue('budget', inrToUsd(inrValue), { shouldValidate: true });
                  }}
                  className="input-premium"
                  placeholder="Enter budget in rupees"
                />
                {budgetInRupees && parseFloat(budgetInRupees) > 0 && (
                  <p className="text-sm text-text-secondary mt-2">
                    ≈ {formatUSD(inrToUsd(parseFloat(budgetInRupees)))}
                  </p>
                )}
                {errors.budget && <p className="text-red-600 text-sm mt-1">{errors.budget.message}</p>}
                {!budgetInRupees && <p className="text-xs text-text-secondary mt-1">Enter budget in Indian Rupees (₹)</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Status</label>
                <select
                  {...register('status')}
                  className="input-premium"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Completed">Completed</option>
                </select>
                {errors.status && <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Description</label>
              <textarea
                {...register('description')}
                rows={4}
                className="input-premium"
                placeholder="Enter project description"
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                  setSelectedProject(null);
                  setClientSearchQuery('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {selectedProject ? 'Update' : 'Create'} Project
              </button>
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
