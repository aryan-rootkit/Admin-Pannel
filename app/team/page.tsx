'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { Plus, User, Search, Users } from 'lucide-react';
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
  const [contractorType, setContractorType] = useState<'Individual' | 'Team'>('Individual');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      availability: 'Available',
    },
  });

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      // In mock mode, use localStorage directly
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        const data = localStorageUtils.getTeam();
        const teamData = Array.isArray(data) ? data : [];
        // Add mock data if empty (12 team members)
        if (teamData.length === 0) {
          const mockTeam = generateMockTeam();
          mockTeam.forEach(m => localStorageUtils.saveTeamMember(m));
          setTeamMembers(mockTeam);
        } else {
          setTeamMembers(teamData);
        }
        setLoading(false);
        return;
      }
      
      // Fallback to API
      const res = await fetch('/api/team');
      const data = await res.json();
      // Ensure data is always an array
      setTeamMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching team:', error);
      setTeamMembers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TeamFormData) => {
    try {
      // In mock mode, use localStorage directly
      if (typeof window !== 'undefined') {
        const { localStorageUtils } = await import('@/lib/localStorage');
        
        const memberData: any = {
          name: (data.name || data.teamName || '').trim(),
          email: (data.email || '').trim().toLowerCase(),
          role: (data.role || 'Team').trim(),
          hourlyRate: Number(data.hourlyRate || data.totalRate || 0),
          availability: data.availability || 'Available',
          employmentType: data.employmentType || (contractorType === 'Team' ? 'Contractor' : 'In-House'),
          bio: data.bio?.trim() || '',
          assignedProjects: selectedMember?.assignedProjects || [],
          _id: selectedMember?._id || undefined,
          contractorType: contractorType === 'Team' ? 'Team' : (data.employmentType === 'Contractor' ? 'Individual' : undefined),
          teamName: data.teamName?.trim(),
          teamLead: data.teamLead?.trim(),
          teamSize: data.teamSize ? Number(data.teamSize) : undefined,
          totalRate: data.totalRate ? Number(data.totalRate) : undefined,
          specialization: data.specialization?.trim(),
        };
        
        localStorageUtils.saveTeamMember(memberData);
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
        return;
      }
      
      // Fallback to API
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
        assignedProjects: selectedMember?.assignedProjects || [],
        employmentType: data.employmentType || (contractorType === 'Team' ? 'Contractor' : 'In-House'),
        contractorType: contractorType === 'Team' ? 'Team' : (data.employmentType === 'Contractor' ? 'Individual' : undefined),
        teamName: data.teamName?.trim(),
        teamLead: data.teamLead?.trim(),
        teamSize: data.teamSize ? Number(data.teamSize) : undefined,
        totalRate: data.totalRate ? Number(data.totalRate) : undefined,
        specialization: data.specialization?.trim(),
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
        const errorData = await res.json();
        const errorMessage = errorData.error || 'Failed to save team member. Please try again.';
        toast(errorMessage, 'error');
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

  // Get unique roles for filter
  const uniqueRoles = Array.from(new Set(teamMembers.map(m => m.role)));

  // Filter members based on search and filters
  const filteredInHouseMembers = inHouseMembers.filter(m => {
    const matchesSearch = searchQuery === '' || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const matchesAvailability = availabilityFilter === 'all' || m.availability === availabilityFilter;
    return matchesSearch && matchesRole && matchesAvailability;
  });

  const filteredContractorMembers = contractorMembers.filter(m => {
    const matchesSearch = searchQuery === '' || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const matchesAvailability = availabilityFilter === 'all' || m.availability === availabilityFilter;
    return matchesSearch && matchesRole && matchesAvailability;
  });

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setValue('name', member.name);
    setValue('email', member.email);
    setValue('role', member.role);
    setValue('hourlyRate', member.hourlyRate);
    setValue('availability', member.availability);
    setValue('employmentType', member.employmentType || 'In-House');
    setValue('bio', member.bio || '');
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
      key: 'availability',
      header: 'Availability',
      render: (row: TeamMember) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.availability === 'Available'
              ? 'bg-green-100 text-green-800'
              : row.availability === 'Busy'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {row.availability}
        </span>
      ),
    },
    {
      key: 'assignedProjects',
      header: 'Projects',
      render: (row: TeamMember) => row.assignedProjects?.length || 0,
    },
    {
      key: 'earnings',
      header: 'Earnings',
      render: (row: TeamMember) => {
        // Calculate earnings from expenses (including Devams from Marketing)
        if (typeof window !== 'undefined') {
          try {
            const expensesData = localStorage.getItem('rootkit_expenses');
            if (expensesData) {
              const expenses = JSON.parse(expensesData);
              const memberEarnings = expenses
                .filter((e: any) => 
                  (e.category === 'Developer Payout' && e.developerPaid === row.name) ||
                  (e.category === 'UI/UX Design Cost' && e.uiuxDesignerPaid === row.name) ||
                  (e.category === 'Marketing Cost' && e.campaignName === 'Call Out/Devams' && row.name === 'Devams')
                )
                .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
              return formatINR(memberEarnings);
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
        {/* Header Card */}
        <div className="card-premium p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-6 h-6 text-primary-500" />
                <h1 className="text-2xl font-bold text-text-primary font-display">People Management</h1>
              </div>
              <p className="text-sm text-text-secondary">Manage your team members and contractors</p>
            </div>
            <button
              onClick={() => {
                reset();
                setSelectedMember(null);
                setIsModalOpen(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Person
            </button>
          </div>
        </div>

        {/* Filters - Professional Card Layout */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search Card */}
          <div className="card-premium p-3 flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-secondary"
                placeholder="Search people..."
              />
            </div>
          </div>

          {/* Role Filter Card */}
          <div className="card-premium p-3">
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

          {/* Availability Filter Card */}
          <div className="card-premium p-3">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    {...register('bio')}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description about the team member..."
                  />
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    {...register('bio')}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description about the team member..."
                  />
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
