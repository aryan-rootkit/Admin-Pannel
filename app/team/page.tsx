'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { Plus, User, Search, Users, Calendar, DollarSign, Trophy, TrendingUp, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/components/ui/Toast';
import { useApp } from '@/lib/contexts/AppContext';
import { formatINR } from '@/lib/utils/currency';

/**
 * Team Management Page
 * CRUD operations for team members with avatar upload
 */

const teamSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  role: z.string().optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive').optional(),
  availability: z.enum(['Available', 'Busy', 'On Leave']).optional(),
  employmentType: z.enum(['In-House', 'Contractor']).optional(),
  bio: z.string().optional(),
  // Contractor-specific fields
  contractorType: z.enum(['Individual', 'Team']).optional(),
  teamName: z.string().optional(),
  teamLead: z.string().optional(),
  teamSize: z.number().optional(),
  totalRate: z.number().optional(),
  specialization: z.string().optional(),
  contractorFor: z.string().optional(), // What skill/service they're a contractor for
  // New fields for capacity and skills
  skills: z.array(z.string()).optional(),
  hoursWorkedThisWeek: z.number().min(0).optional(),
  hoursAvailablePerWeek: z.number().min(0).max(168).optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  hourlyRate: number;
  availability: 'Available' | 'Busy' | 'On Leave';
  employmentType?: 'In-House' | 'Contractor';
  avatar?: string;
  bio?: string;
  assignedProjects: any[];
  createdAt?: string;
  updatedAt?: string;
  // Contractor-specific fields
  contractorType?: 'Individual' | 'Team';
  teamName?: string;
  teamLead?: string;
  teamSize?: number;
  totalRate?: number;
  specialization?: string;
  contractorFor?: string; // What skill/service they're a contractor for
  // New fields for capacity and skills
  skills?: string[];
  hoursWorkedThisWeek?: number;
  hoursAvailablePerWeek?: number;
}

export default function TeamPage() {
  const { team, setTeam } = useApp();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inhouse' | 'contractors'>('inhouse');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [skillsFilter, setSkillsFilter] = useState<string>('all');
  const [contractorType, setContractorType] = useState<'Individual' | 'Team'>('Individual');
  const [projects, setProjects] = useState<any[]>([]);
  const [showProjectBoard, setShowProjectBoard] = useState(false);
  const [showCapacityCards, setShowCapacityCards] = useState(false);
  const [showPerformanceScorecards, setShowPerformanceScorecards] = useState(false);
  const [showTopPerformers, setShowTopPerformers] = useState(false);
  const [showAvailabilityCalendar, setShowAvailabilityCalendar] = useState(false);
  const [updatedMember, setUpdatedMember] = useState<TeamMember | null>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPayoutMember, setSelectedPayoutMember] = useState<TeamMember | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [newHireName, setNewHireName] = useState('');
  const [onboardingChecklist, setOnboardingChecklist] = useState<Record<string, boolean>>({
    laptopIssued: false,
    accountsSetup: false,
    contractsSigned: false,
    slackAccess: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      availability: 'Available',
      skills: [],
      hoursWorkedThisWeek: 0,
      hoursAvailablePerWeek: 40,
    },
  });

  useEffect(() => {
    fetchTeam();
    fetchProjects();
    fetchRevenue();
    fetchExpenses();
  }, []);

  const fetchRevenue = async () => {
    try {
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        const data = localStorageUtils.getRevenue();
        const revenueData = Array.isArray(data) ? data : [];
        setRevenue(revenueData);
      }
    } catch (error) {
      console.error('Error fetching revenue:', error);
      setRevenue([]);
    }
  };

  const fetchExpenses = async () => {
    try {
      if (typeof window !== 'undefined') {
        const expensesData = localStorage.getItem('rootkit_expenses');
        if (expensesData) {
          const parsed = JSON.parse(expensesData);
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

  const fetchProjects = async () => {
    try {
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        const data = localStorageUtils.getProjects();
        setProjects(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  const fetchTeam = async () => {
    setLoading(true);
    try {
      // Use API route (fetches from MongoDB)
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch team from API');
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TeamFormData) => {
    try {
      // Use API route (saves to MongoDB)
      const url = selectedMember ? `/api/team/${selectedMember._id}` : '/api/team';
      const method = selectedMember ? 'PUT' : 'POST';

      // Prepare the request body
      const requestBody: any = {
        name: (data.name || data.teamName || '').trim(),
        email: (data.email || '').trim().toLowerCase(),
        role: (data.role || 'Team').trim(),
        hourlyRate: Number(data.hourlyRate || data.totalRate || 0),
        availability: data.availability || 'Available',
        bio: data.bio?.trim() || '',
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        const savedMember = await res.json();
        await fetchTeam();
        setIsModalOpen(false);
        reset();
        setSelectedMember(null);
        toast(
          selectedMember 
            ? 'Team member updated successfully!' 
            : 'Team member added successfully!',
          'success'
        );
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to save team member' }));
        toast(errorData.error || 'Failed to save team member. Please try again.', 'error');
        console.error('API Error:', errorData);
      }
    } catch (error: any) {
      console.error('Error saving team member:', error);
      toast(error?.message || 'An error occurred. Please try again.', 'error');
    }
  };

  // Helper function to get role icon and color
  const getRoleIcon = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('developer') || roleLower.includes('dev')) {
      return { icon: '💻', color: 'text-blue-600', bg: 'bg-blue-100' };
    } else if (roleLower.includes('ui') || roleLower.includes('ux') || roleLower.includes('design')) {
      return { icon: '🎨', color: 'text-purple-600', bg: 'bg-purple-100' };
    } else if (roleLower.includes('manager') || roleLower.includes('pm')) {
      return { icon: '👨‍💻', color: 'text-green-600', bg: 'bg-green-100' };
    } else if (roleLower.includes('marketing')) {
      return { icon: '📈', color: 'text-orange-600', bg: 'bg-orange-100' };
    } else {
      return { icon: '🤝', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  // Filter team members by employment type
  const inHouseMembers = teamMembers.filter(m => !m.employmentType || m.employmentType === 'In-House');
  const contractorMembers = teamMembers.filter(m => m.employmentType === 'Contractor');

  // Get unique roles and skills for filter
  const uniqueRoles = Array.from(new Set(teamMembers.map(m => m.role)));
  const allSkills = Array.from(new Set(teamMembers.flatMap(m => m.skills || []))).sort();

  // Calculate capacity metrics for each member
  const calculateCapacity = (member: TeamMember) => {
    const hoursWorked = member.hoursWorkedThisWeek || 0;
    const hoursAvailable = member.hoursAvailablePerWeek || 40; // Default 40 hours/week
    const utilization = hoursAvailable > 0 ? Math.round((hoursWorked / hoursAvailable) * 100) : 0;
    const availableNextWeek = hoursAvailable - hoursWorked;
    
    return {
      hoursWorked,
      hoursAvailable,
      utilization,
      availableNextWeek: Math.max(0, availableNextWeek),
      status: utilization >= 100 ? 'overloaded' : utilization >= 80 ? 'busy' : 'available'
    };
  };

  // Filter members based on search and filters
  const filteredInHouseMembers = inHouseMembers.filter(m => {
    const matchesSearch = searchQuery === '' || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.skills || []).some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const matchesAvailability = availabilityFilter === 'all' || m.availability === availabilityFilter;
    const matchesSkills = skillsFilter === 'all' || (m.skills || []).includes(skillsFilter);
    return matchesSearch && matchesRole && matchesAvailability && matchesSkills;
  });

  const filteredContractorMembers = contractorMembers.filter(m => {
    const matchesSearch = searchQuery === '' || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.skills || []).some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const matchesAvailability = availabilityFilter === 'all' || m.availability === availabilityFilter;
    const matchesSkills = skillsFilter === 'all' || (m.skills || []).includes(skillsFilter);
    return matchesSearch && matchesRole && matchesAvailability && matchesSkills;
  });

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member);
    // Reset form first
    reset();
    
    // Auto-fill project assignments from projects where member name or ID appears in developers
    const assignedProjectIds: string[] = [];
    projects.forEach(project => {
      if (project.developers && Array.isArray(project.developers)) {
        const isAssigned = project.developers.some((dev: string) => {
          // Match by name or ID
          return dev === member.name || dev === member._id || 
                 (typeof dev === 'object' && dev !== null && (dev as any).name === member.name);
        });
        if (isAssigned && project._id) {
          assignedProjectIds.push(project._id);
        }
      }
    });
    
    // Update member with auto-filled projects (merge with existing if any)
    const allProjectIds = [...assignedProjectIds, ...(member.assignedProjects || [])];
    const uniqueProjectIds = Array.from(new Set(allProjectIds));
    const updatedMemberData = { ...member, assignedProjects: uniqueProjectIds };
    setSelectedMember(updatedMemberData);
    setUpdatedMember(updatedMemberData);
    
    // Set contractor type based on member data
    if (member.contractorType === 'Team') {
      setContractorType('Team');
      setValue('teamName', member.teamName || '');
      setValue('teamLead', member.teamLead || '');
      setValue('teamSize', member.teamSize || 0);
      setValue('totalRate', member.totalRate || 0);
      setValue('specialization', member.specialization || '');
    } else {
      setContractorType('Individual');
      setValue('name', member.name);
      setValue('email', member.email);
      setValue('role', member.role);
      setValue('hourlyRate', member.hourlyRate);
    }
    
    // Set common fields
    setValue('availability', member.availability || 'Available');
    setValue('employmentType', member.employmentType || 'In-House');
    setValue('bio', member.bio || '');
    setValue('contractorFor', member.contractorFor || '');
    setValue('skills', member.skills || []);
    setValue('hoursWorkedThisWeek', member.hoursWorkedThisWeek || 0);
    setValue('hoursAvailablePerWeek', member.hoursAvailablePerWeek || 40);
    
    setIsModalOpen(true);
  };

  const handleDelete = async (member: TeamMember) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      // In mock mode, use localStorage directly
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        localStorageUtils.deleteTeamMember(member._id);
        await fetchTeam();
        toast('Team member deleted successfully!', 'success');
        return;
      }
      
      // Fallback to API
      const res = await fetch(`/api/team/${member._id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchTeam();
        toast('Team member deleted successfully!', 'success');
      } else {
        const errorData = await res.json();
        toast(errorData.error || 'Failed to delete team member.', 'error');
      }
    } catch (error: any) {
      console.error('Error deleting team member:', error);
      toast('An error occurred while deleting.', 'error');
    }
  };

  const getColumns = () => [
    {
      key: 'name',
      header: 'Member',
      render: (row: TeamMember) => {
        const roleInfo = getRoleIcon(row.role);
        return (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${roleInfo.bg} rounded-full flex items-center justify-center ${roleInfo.color} text-lg`}>
              {roleInfo.icon}
            </div>
            <div>
              <p className="font-medium text-text-primary">{row.name}</p>
              <p className="text-sm text-text-secondary">{row.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'role',
      header: 'Role',
      render: (row: TeamMember) => {
        return (
          <span className="text-sm font-medium text-text-primary">
            {row.role}
          </span>
        );
      },
    },
    {
      key: 'hourlyRate',
      header: 'Hourly Rate',
      render: (row: TeamMember) => `$${row.hourlyRate}/hr`,
    },
    {
      key: 'assignedProjects',
      header: 'Projects',
      render: (row: TeamMember) => {
        const memberProjects = projects.filter(p => 
          p.developers?.includes(row._id) || 
          p.assignedTeam?.some((t: any) => (t._id || t) === row._id)
        );
        const projectCount = memberProjects.length;
        const projectNames = memberProjects.slice(0, 3).map(p => p.name);
        
        if (projectCount === 0) {
          return <span className="text-sm text-text-secondary">No projects</span>;
        }
        
        return (
          <div className="flex items-center gap-2">
            <a
              href={`/projects?search=${encodeURIComponent(row.name)}`}
              className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline"
              title={memberProjects.map(p => p.name).join(', ')}
            >
              {projectCount} {projectCount === 1 ? 'project' : 'projects'}
            </a>
            {projectNames.length > 0 && (
              <span className="text-xs text-text-secondary">
                ({projectNames.join(', ')}{projectCount > 3 ? ` +${projectCount - 3}` : ''})
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (row: TeamMember) => {
        const capacity = calculateCapacity(row);
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">
              {capacity.hoursWorked}/{capacity.hoursAvailable}h
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              capacity.status === 'overloaded' ? 'bg-red-100 text-red-800' :
              capacity.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {capacity.utilization}%
            </span>
          </div>
        );
      },
    },
    {
      key: 'earnings',
      header: 'Earnings',
      render: (row: TeamMember) => {
        // CEO Aryan Dubey's earnings = Total Revenue - Total Expenses (what's left after expenses)
        // All other team members' earnings are expenses (Developer Payout, UI/UX, Marketing Cost)
        if (typeof window !== 'undefined') {
          try {
            // Check if this is CEO Aryan Dubey
            const isCEO = row.name.toLowerCase().includes('aryan') && row.name.toLowerCase().includes('dubey');
            
            if (isCEO) {
              // CEO earnings = Total Revenue - Total Expenses
              // Use the revenue and expenses state that are already fetched, or fallback to localStorage
              let totalRevenue = 0;
              let totalExpenses = 0;
              
              // Calculate total revenue (all payments received + advances)
              if (Array.isArray(revenue) && revenue.length > 0) {
                totalRevenue = revenue.reduce((sum: number, r: any) => {
                  // Sum all payments received
                  const paymentsSum = (r.paymentsReceived || []).reduce((pSum: number, p: any) => pSum + (p.amount || 0), 0);
                  return sum + paymentsSum + (r.advanceAmount || 0);
                }, 0);
              } else {
                // Fallback: try localStorage directly (synchronous)
                try {
                  const revenueData = localStorage.getItem('rootkit_revenue');
                  if (revenueData) {
                    const revenueArray = JSON.parse(revenueData);
                    if (Array.isArray(revenueArray)) {
                      totalRevenue = revenueArray.reduce((sum: number, r: any) => {
                        const paymentsSum = (r.paymentsReceived || []).reduce((pSum: number, p: any) => pSum + (p.amount || 0), 0);
                        return sum + paymentsSum + (r.advanceAmount || 0);
                      }, 0);
                    }
                  }
                } catch (e) {
                  console.error('Error fetching revenue:', e);
                }
              }
              
              // Calculate total expenses
              if (Array.isArray(expenses) && expenses.length > 0) {
                totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
              } else {
                // Fallback: try localStorage directly (synchronous)
                try {
                  const expensesData = localStorage.getItem('rootkit_expenses');
                  if (expensesData) {
                    const expensesArray = JSON.parse(expensesData);
                    if (Array.isArray(expensesArray)) {
                      totalExpenses = expensesArray.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
                    }
                  }
                } catch (e) {
                  console.error('Error fetching expenses:', e);
                }
              }
              
              const ceoEarnings = totalRevenue - totalExpenses;
              return formatINR(ceoEarnings); // Can be negative if expenses exceed revenue
            } else {
              // For all other team members: earnings are expenses (payouts)
              const expensesData = localStorage.getItem('rootkit_expenses');
              if (expensesData) {
                const expenses = JSON.parse(expensesData);
                const memberEarnings = expenses
                  .filter((e: any) => {
                    // Developer Payout
                    if (e.category === 'Developer Payout' && e.developerPaid === row.name) {
                      return true;
                    }
                    // UI/UX Design Cost
                    if (e.category === 'UI/UX Design Cost' && e.uiuxDesignerPaid === row.name) {
                      return true;
                    }
                    // Devams/Devamsh earnings from Marketing Cost - Call Out campaign
                    // Check if member name contains "devam" (case-insensitive) and expense is Marketing Cost with Call Out campaign
                    if (e.category === 'Marketing Cost' && row.name.toLowerCase().includes('devam')) {
                      const campaignName = (e.campaignName || '').toLowerCase();
                      // Match "Call Out/Devams", "Call Out", or any variation containing "call out"
                      if (campaignName.includes('call out') || campaignName.includes('callout')) {
                        return true;
                      }
                    }
                    return false;
                  })
                  .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
                return formatINR(memberEarnings);
              }
            }
          } catch (e) {
            console.error('Error calculating earnings:', e);
          }
        }
        return formatINR(0);
      },
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
        {/* Header Card - Matching Revenue Page Design */}
        <div className="bg-white rounded-xl py-4 px-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 font-display leading-tight">People Management</h1>
              </div>
              <p className="text-xs text-slate-500 leading-tight">Manage your team members and contractors</p>
            </div>
            <button
              onClick={() => {
                reset();
                setSelectedMember(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Person
            </button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => setShowCapacityCards(!showCapacityCards)}
            className={`px-4 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              showCapacityCards 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
            }`}
          >
            <Users className="w-4 h-4" />
            {showCapacityCards ? 'Hide' : 'Show'} Capacity
          </button>
          <button
            onClick={() => setShowProjectBoard(!showProjectBoard)}
            className={`px-4 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              showProjectBoard 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
            }`}
          >
            <Users className="w-4 h-4" />
            {showProjectBoard ? 'Hide' : 'Show'} Projects
          </button>
          <button
            onClick={() => setShowPerformanceScorecards(!showPerformanceScorecards)}
            className={`px-4 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              showPerformanceScorecards 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
            }`}
          >
            <Trophy className="w-4 h-4" />
            {showPerformanceScorecards ? 'Hide' : 'Show'} Performance
          </button>
          <button
            onClick={() => setShowTopPerformers(!showTopPerformers)}
            className={`px-4 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              showTopPerformers 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
            }`}
          >
            <Trophy className="w-4 h-4" />
            {showTopPerformers ? 'Hide' : 'Show'} Top Performers
          </button>
          <button
            onClick={() => setShowAvailabilityCalendar(!showAvailabilityCalendar)}
            className={`px-4 py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
              showAvailabilityCalendar 
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {showAvailabilityCalendar ? 'Hide' : 'Show'} Calendar
          </button>
        </div>

        {/* Capacity Cards - Tier 1 Feature */}
        {showCapacityCards && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInHouseMembers.slice(0, 6).map(member => {
            const capacity = calculateCapacity(member);
            return (
              <div key={member._id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{member.name}</p>
                      <p className="text-xs text-text-secondary">{member.role}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    capacity.status === 'overloaded' ? 'bg-red-100 text-red-800' :
                    capacity.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {capacity.utilization}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">This Week:</span>
                    <span className="font-semibold text-text-primary">{capacity.hoursWorked}/{capacity.hoursAvailable}h</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        capacity.status === 'overloaded' ? 'bg-red-500' :
                        capacity.status === 'busy' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(capacity.utilization, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>Available Next Week:</span>
                    <span className="font-medium">{capacity.availableNextWeek}h</span>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* Project Assignment Board - Tier 1 Feature */}
        {showProjectBoard && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-text-primary mb-4">Project Assignment Board</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {projects.slice(0, 6).map(project => (
                <div key={project._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-text-primary">{project.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-text-secondary">Assigned Team:</p>
                    <div className="flex flex-wrap gap-2">
                      {(project.developers || []).map((dev: string, idx: number) => {
                        const member = teamMembers.find(m => m.name === dev || m._id === dev);
                        if (!member) return null;
                        const capacity = calculateCapacity(member);
                        return (
                          <div 
                            key={idx}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              capacity.status === 'overloaded' ? 'bg-red-100 text-red-800 border border-red-300' :
                              capacity.status === 'busy' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                              'bg-green-100 text-green-800 border border-green-300'
                            }`}
                            title={`${member.name}: ${capacity.hoursWorked}/${capacity.hoursAvailable}h (${capacity.utilization}%)`}
                          >
                            {member.name} {capacity.status === 'overloaded' && '⚠️'}
                          </div>
                        );
                      })}
                      {(!project.developers || project.developers.length === 0) && (
                        <span className="text-xs text-text-secondary italic">No assignments</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Scorecards - Tier 2 Feature */}
        {showPerformanceScorecards && (
        <div className="card-premium p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-500" />
            Performance Scorecards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInHouseMembers.slice(0, 6).map(member => {
              // Calculate performance metrics
              const memberProjects = projects.filter(p => 
                p.developers?.some((d: string) => d === member.name || d === member._id)
              );
              const tasksCompleted = Math.floor(Math.random() * 5) + 10; // Mock: 10-15
              const tasksTotal = 15;
              const onTimeRate = Math.floor(Math.random() * 10) + 88; // Mock: 88-98%
              const clientRating = (Math.random() * 0.5 + 4.5).toFixed(1); // Mock: 4.5-5.0
              const revenueGenerated = memberProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
              
              return (
                <div 
                  key={member._id} 
                  className="card-premium p-5 hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-300"
                  onClick={() => {
                    setSelectedPayoutMember(member);
                    setShowPayoutModal(true);
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-text-primary">{member.name}</p>
                      <p className="text-sm text-text-secondary">{member.role}</p>
                    </div>
                  </div>
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-secondary">Tasks Completed:</span>
                      <span className={`font-bold text-sm px-2 py-1 rounded ${
                        (tasksCompleted / tasksTotal) >= 0.9 ? 'bg-green-100 text-green-700' :
                        (tasksCompleted / tasksTotal) >= 0.7 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {tasksCompleted}/{tasksTotal} ({Math.round((tasksCompleted / tasksTotal) * 100)}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-secondary">Client Rating:</span>
                      <span className="font-bold text-orange-600 flex items-center gap-1">
                        ⭐ {clientRating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-secondary">Revenue Generated:</span>
                      <span className="font-bold text-green-600">{formatINR(revenueGenerated)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Team Revenue Leaderboard & Contractor Comparison - Tier 3 Features */}
        {showTopPerformers && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Leaderboard */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-500" />
              🏆 Top Performers (This Month)
            </h2>
            <div className="space-y-3">
              {[...filteredInHouseMembers, ...filteredContractorMembers]
                .map(member => {
                  const memberProjects = projects.filter(p => 
                    p.developers?.some((d: string) => d === member.name || d === member._id)
                  );
                  const revenue = memberProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
                  return { member, revenue, projectCount: memberProjects.length };
                })
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map((item, idx) => (
                  <div key={item.member._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                        idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500' :
                        'bg-gradient-to-br from-blue-300 to-blue-500'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-text-primary">{item.member.name}</p>
                        <p className="text-xs text-text-secondary">{item.projectCount} projects</p>
                      </div>
                    </div>
                    <span className="font-bold text-lg text-green-600">{formatINR(item.revenue)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
        )}

        {/* Availability Calendar - Tier 2 Feature */}
        {showAvailabilityCalendar && (
        <div className="card-premium p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Availability Calendar (This Week)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold text-text-primary">Name</th>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <th key={day} className="text-center p-2 font-semibold text-text-primary">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInHouseMembers.slice(0, 5).map(member => (
                  <tr key={member._id} className="border-b">
                    <td className="p-2 font-medium text-text-primary">{member.name}</td>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                      const status = Math.random() > 0.7 ? 'busy' : Math.random() > 0.5 ? 'half' : 'free';
                      return (
                        <td key={day} className="text-center p-2">
                          <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                            status === 'busy' ? 'bg-red-500' :
                            status === 'half' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}>
                            <span className="text-white text-xs">
                              {status === 'busy' ? '🔴' : status === 'half' ? '🟡' : '🟢'}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Filters - Professional Card Layout */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search Card */}
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-secondary"
                placeholder="Search people or skills..."
              />
            </div>
          </div>

          {/* Role Filter Card */}
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-text-primary cursor-pointer min-w-[140px]"
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Skills Filter Card - Tier 1 Feature */}
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
            <select
              value={skillsFilter}
              onChange={(e) => setSkillsFilter(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-text-primary cursor-pointer min-w-[140px]"
            >
              <option value="all">All Skills</option>
              {allSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          {/* Availability Filter Card */}
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm text-text-primary cursor-pointer min-w-[140px]"
            >
              <option value="all">All Availability</option>
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('inhouse')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'inhouse'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            In-House ({filteredInHouseMembers.length})
          </button>
          <button
            onClick={() => setActiveTab('contractors')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'contractors'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Contractors ({filteredContractorMembers.length})
          </button>
        </div>

        {/* In-House Table */}
        {activeTab === 'inhouse' && (
          <DataTable
            data={filteredInHouseMembers}
            columns={getColumns()}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchable={false}
          />
        )}

        {/* Contractors Table */}
        {activeTab === 'contractors' && (
          <DataTable
            data={filteredContractorMembers}
            columns={getColumns()}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchable={false}
          />
        )}

        {/* Add/Edit Team Member Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            reset();
            setSelectedMember(null);
            setContractorType('Individual');
          }}
          title={selectedMember ? 'Edit Team Member' : 'New Team Member'}
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Contractor Type Toggle - Only show for Contractors */}
            {(!selectedMember || selectedMember.employmentType === 'Contractor') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contractor Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setContractorType('Individual');
                      setValue('contractorType', 'Individual');
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      contractorType === 'Individual'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContractorType('Team');
                      setValue('contractorType', 'Team');
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      contractorType === 'Team'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Team
                  </button>
                </div>
              </div>
            )}

            {/* Individual Mode Fields */}
            {contractorType === 'Individual' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    {...register('name')}
                    className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter name"
                  />
                  {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email"
                  />
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      {...register('role')}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select role</option>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="Full Stack Developer">Full Stack Developer</option>
                      <option value="UI/UX Designer">UI/UX Designer</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="Marketing Specialist">Marketing Specialist</option>
                      <option value="Contractor">Contractor</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('hourlyRate', { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                    {errors.hourlyRate && <p className="text-red-600 text-sm mt-1">{errors.hourlyRate.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                    <select
                      {...register('employmentType')}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="In-House">In-House</option>
                      <option value="Contractor">Contractor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                    <select
                      {...register('availability')}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                </div>

                {/* Contractor For - Show only when Contractor is selected */}
                {watch('employmentType') === 'Contractor' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contractor For (What Skill/Service)</label>
                    <input
                      {...register('contractorFor')}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., React Development, UI/UX Design, Backend API, Mobile App Development, etc."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    {...register('bio')}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description about the team member..."
                  />
                </div>

                {/* Skills Matrix - Tier 1 Feature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {['React', 'Vue', 'Next.js', 'Node.js', 'Python', 'Go', 'Flutter', 'React Native', 'TypeScript', 'JavaScript', 'MongoDB', 'PostgreSQL', 'Figma', 'Adobe XD', 'Tailwind CSS', 'GraphQL'].map(skill => {
                      const currentSkills = watch('skills') || [];
                      const isSelected = currentSkills.includes(skill);
                      return (
                        <label key={skill} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const current = currentSkills;
                              if (e.target.checked) {
                                setValue('skills', [...current, skill]);
                              } else {
                                setValue('skills', current.filter(s => s !== skill));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{skill}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Capacity Fields - Tier 1 Feature */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hours Worked This Week</label>
                    <input
                      type="number"
                      step="0.5"
                      {...register('hoursWorkedThisWeek', { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      defaultValue={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hours Available Per Week</label>
                    <input
                      type="number"
                      step="0.5"
                      {...register('hoursAvailablePerWeek', { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="40"
                      defaultValue={40}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Team Mode Fields */}
            {contractorType === 'Team' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
                  <input
                    {...register('teamName')}
                    className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter team name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team Lead</label>
                  <input
                    {...register('teamLead')}
                    className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter team lead name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Team Size</label>
                    <input
                      type="number"
                      {...register('teamSize', { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Number of members"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('totalRate', { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                  <select
                    {...register('specialization')}
                    className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select specialization</option>
                    <option value="Full-stack">Full-stack</option>
                    <option value="Mobile">Mobile</option>
                    <option value="Design">Design</option>
                    <option value="Backend">Backend</option>
                    <option value="Frontend">Frontend</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                  <select
                    {...register('employmentType')}
                    className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue="Contractor"
                  >
                    <option value="Contractor">Contractor</option>
                  </select>
                </div>
              </>
            )}

            {/* Common fields for In-House (when not contractor) */}
            {(!selectedMember || selectedMember.employmentType !== 'Contractor') && contractorType !== 'Team' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    {...register('name')}
                    className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter name"
                  />
                  {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email"
                  />
                  {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      {...register('role')}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select role</option>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="Full Stack Developer">Full Stack Developer</option>
                      <option value="UI/UX Designer">UI/UX Designer</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="Marketing Specialist">Marketing Specialist</option>
                      <option value="Contractor">Contractor</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('hourlyRate', { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                    {errors.hourlyRate && <p className="text-red-600 text-sm mt-1">{errors.hourlyRate.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                    <select
                      {...register('employmentType')}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="In-House">In-House</option>
                      <option value="Contractor">Contractor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                    <select
                      {...register('availability')}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                </div>

                {/* Contractor For - Show only when Contractor is selected */}
                {watch('employmentType') === 'Contractor' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contractor For (What Skill/Service)</label>
                    <input
                      {...register('contractorFor')}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., React Development, UI/UX Design, Backend API, Mobile App Development, etc."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    {...register('bio')}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description about the team member..."
                  />
                </div>

                {/* Skills Matrix - Tier 1 Feature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {['React', 'Vue', 'Next.js', 'Node.js', 'Python', 'Go', 'Flutter', 'React Native', 'TypeScript', 'JavaScript', 'MongoDB', 'PostgreSQL', 'Figma', 'Adobe XD', 'Tailwind CSS', 'GraphQL'].map(skill => {
                      const currentSkills = watch('skills') || [];
                      const isSelected = currentSkills.includes(skill);
                      return (
                        <label key={skill} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const current = currentSkills;
                              if (e.target.checked) {
                                setValue('skills', [...current, skill]);
                              } else {
                                setValue('skills', current.filter(s => s !== skill));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{skill}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Capacity Fields - Tier 1 Feature */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hours Worked This Week</label>
                    <input
                      type="number"
                      step="0.5"
                      {...register('hoursWorkedThisWeek', { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      defaultValue={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hours Available Per Week</label>
                    <input
                      type="number"
                      step="0.5"
                      {...register('hoursAvailablePerWeek', { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="40"
                      defaultValue={40}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                  setSelectedMember(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                {selectedMember ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Payout Calculator Modal - Tier 2 Feature */}
        <Modal
          isOpen={showPayoutModal}
          onClose={() => {
            setShowPayoutModal(false);
            setSelectedPayoutMember(null);
          }}
          title={`${selectedPayoutMember?.name || ''} - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Estimate`}
          size="md"
        >
          {selectedPayoutMember && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Base Salary:</span>
                    <span className="font-semibold text-text-primary">
                      {formatINR((selectedPayoutMember.hourlyRate || 0) * 160)} {/* 160 hours/month */}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Commission (8%):</span>
                    <span className="font-semibold text-green-600">
                      {formatINR(
                        projects
                          .filter(p => p.developers?.some((d: string) => d === selectedPayoutMember.name || d === selectedPayoutMember._id))
                          .reduce((sum, p) => sum + (p.budget || 0), 0) * 0.08
                      )}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex items-center justify-between">
                    <span className="font-bold text-lg text-text-primary">Total Due:</span>
                    <span className="font-bold text-lg text-green-600">
                      {formatINR(
                        (selectedPayoutMember.hourlyRate || 0) * 160 +
                        projects
                          .filter(p => p.developers?.some((d: string) => d === selectedPayoutMember.name || d === selectedPayoutMember._id))
                          .reduce((sum, p) => sum + (p.budget || 0), 0) * 0.08
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  toast('Payslip PDF generated!', 'success');
                  // In a real app, this would generate a PDF using jsPDF
                }}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Generate Payslip PDF
              </button>
            </div>
          )}
        </Modal>

        {/* Onboarding Checklist Modal - Tier 3 Feature */}
        <Modal
          isOpen={showOnboardingModal}
          onClose={() => {
            setShowOnboardingModal(false);
            setNewHireName('');
            setOnboardingChecklist({
              laptopIssued: false,
              accountsSetup: false,
              contractsSigned: false,
              slackAccess: false,
            });
          }}
          title={`New Hire: ${newHireName || 'Team Member'}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="space-y-3">
              {[
                { key: 'laptopIssued', label: 'Laptop issued' },
                { key: 'accountsSetup', label: 'Accounts setup' },
                { key: 'contractsSigned', label: 'Contracts signed' },
                { key: 'slackAccess', label: 'Slack access' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={onboardingChecklist[item.key as keyof typeof onboardingChecklist]}
                    onChange={(e) => {
                      setOnboardingChecklist(prev => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }));
                    }}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-text-primary font-medium">{item.label}</span>
                  {onboardingChecklist[item.key as keyof typeof onboardingChecklist] && (
                    <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                  )}
                </label>
              ))}
            </div>
            <button
              onClick={() => {
                const allComplete = Object.values(onboardingChecklist).every(v => v);
                if (allComplete) {
                  toast('Onboarding completed! Team member is now active.', 'success');
                  setShowOnboardingModal(false);
                  setNewHireName('');
                  setOnboardingChecklist({
                    laptopIssued: false,
                    accountsSetup: false,
                    contractsSigned: false,
                    slackAccess: false,
                  });
                } else {
                  toast('Please complete all checklist items.', 'error');
                }
              }}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              Complete → Active
            </button>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}

// Generate mock team members (In-House + Contractors)
function generateMockTeam(): TeamMember[] {
  // In-House team members
  const inHouseMembers: TeamMember[] = [
    { _id: 'team_1', name: 'Lalit', email: 'lalit@rootkit.com', role: 'Frontend Developer', hourlyRate: 30, availability: 'Available', employmentType: 'In-House', bio: 'React specialist', assignedProjects: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { _id: 'team_2', name: 'Paras', email: 'paras@rootkit.com', role: 'Project Manager', hourlyRate: 40, availability: 'Available', employmentType: 'In-House', bio: 'Agile PM', assignedProjects: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { _id: 'team_3', name: 'Geetika', email: 'geetika@rootkit.com', role: 'UI/UX Designer', hourlyRate: 35, availability: 'Available', employmentType: 'In-House', bio: 'Figma expert', assignedProjects: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { _id: 'team_4', name: 'Aryan', email: 'aryan@rootkit.com', role: 'Backend Developer', hourlyRate: 32, availability: 'Busy', employmentType: 'In-House', bio: 'Node.js specialist', assignedProjects: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { _id: 'team_5', name: 'Sakshi', email: 'sakshi@rootkit.com', role: 'Full Stack Developer', hourlyRate: 38, availability: 'Available', employmentType: 'In-House', bio: 'MERN stack', assignedProjects: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  // Contractors
  const contractors: TeamMember[] = [
    { _id: 'team_6', name: 'Shubham', email: 'shubham@rootkit.com', role: 'Project Manager', hourlyRate: 45, availability: 'Available', employmentType: 'Contractor', bio: 'Contract PM', assignedProjects: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { _id: 'team_7', name: 'Hrushikesh', email: 'hrushikesh@rootkit.com', role: 'Backend Developer', hourlyRate: 35, availability: 'Available', employmentType: 'Contractor', bio: 'Contract Dev', assignedProjects: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  return [...inHouseMembers, ...contractors];
}
