'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { Plus, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/components/ui/Toast';
import { useApp } from '@/lib/contexts/AppContext';

/**
 * Team Management Page
 * CRUD operations for team members with avatar upload
 */

const teamSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.string().min(1, 'Role is required'),
  hourlyRate: z.number().min(0, 'Hourly rate must be positive'),
  availability: z.enum(['Available', 'Busy', 'On Leave']),
  bio: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  hourlyRate: number;
  availability: 'Available' | 'Busy' | 'On Leave';
  avatar?: string;
  bio?: string;
  assignedProjects: any[];
}

export default function TeamPage() {
  const { team, setTeam } = useApp();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

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
      const url = selectedMember ? `/api/team/${selectedMember._id}` : '/api/team';
      const method = selectedMember ? 'PUT' : 'POST';

      // Prepare the request body
      const requestBody = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        role: data.role.trim(),
        hourlyRate: Number(data.hourlyRate),
        availability: data.availability,
        bio: data.bio?.trim() || '',
        assignedProjects: selectedMember?.assignedProjects || [],
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

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setValue('name', member.name);
    setValue('email', member.email);
    setValue('role', member.role);
    setValue('hourlyRate', member.hourlyRate);
    setValue('availability', member.availability);
    setValue('bio', member.bio || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (member: TeamMember) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
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

  const columns = [
    {
      key: 'name',
      header: 'Member',
      render: (row: TeamMember) => (
        <div className="flex items-center gap-3">
          {row.avatar ? (
            <img src={row.avatar} alt={row.name} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
              {row.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role' },
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Team Management</h1>
            <p className="text-gray-600 text-lg">Manage your team members</p>
          </div>
          <button
            onClick={() => {
              reset();
              setSelectedMember(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            New Member
          </button>
        </div>

        <DataTable
          data={teamMembers}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Add/Edit Team Member Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            reset();
            setSelectedMember(null);
          }}
          title={selectedMember ? 'Edit Team Member' : 'New Team Member'}
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                <input
                  {...register('role')}
                  className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter role"
                />
                {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate</label>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                {...register('bio')}
                rows={3}
                className="w-full px-4 py-2.5 bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description about the team member..."
              />
            </div>

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
