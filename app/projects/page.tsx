'use client';

import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { Plus, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Project Management Page
 * CRUD operations for projects with email assignment feature
 */

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  client: z.string().min(1, 'Client is required'),
  startDate: z.string().min(1, 'Start date is required'),
  deadline: z.string().min(1, 'Deadline is required'),
  budget: z.number().min(0, 'Budget must be positive'),
  status: z.enum(['Pending', 'In Progress', 'Completed', 'On Hold']),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface Project {
  _id: string;
  name: string;
  description: string;
  client: string;
  startDate: string;
  deadline: string;
  budget: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'On Hold';
  assignedTeam: any[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  useEffect(() => {
    fetchProjects();
    fetchTeamMembers();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      // Ensure data is always an array
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const url = selectedProject ? `/api/projects/${selectedProject._id}` : '/api/projects';
      const method = selectedProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await fetchProjects();
        setIsModalOpen(false);
        reset();
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setValue('name', project.name);
    setValue('description', project.description);
    setValue('client', project.client);
    setValue('startDate', new Date(project.startDate).toISOString().split('T')[0]);
    setValue('deadline', new Date(project.deadline).toISOString().split('T')[0]);
    setValue('budget', project.budget);
    setValue('status', project.status);
    setIsModalOpen(true);
  };

  const handleDelete = async (project: Project) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const res = await fetch(`/api/projects/${project._id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchProjects();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleAssign = (project: Project) => {
    setSelectedProject(project);
    setSelectedTeamMembers(project.assignedTeam?.map((t: any) => t._id || t) || []);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedProject) return;

    try {
      const res = await fetch(`/api/projects/${selectedProject._id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamMemberIds: selectedTeamMembers }),
      });

      if (res.ok) {
        await fetchProjects();
        setIsAssignModalOpen(false);
        setSelectedProject(null);
        setSelectedTeamMembers([]);
        alert('Project assigned and emails sent!');
      }
    } catch (error) {
      console.error('Error assigning project:', error);
    }
  };

  const columns = [
    { key: 'name', header: 'Project Name' },
    { key: 'client', header: 'Client' },
    {
      key: 'status',
      header: 'Status',
      render: (row: Project) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === 'Completed'
              ? 'bg-green-100 text-green-800'
              : row.status === 'In Progress'
              ? 'bg-blue-100 text-blue-800'
              : row.status === 'On Hold'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'budget',
      header: 'Budget',
      render: (row: Project) => `$${row.budget.toLocaleString()}`,
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (row: Project) => new Date(row.deadline).toLocaleDateString(),
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600 text-lg">Manage all your projects</p>
          </div>
          <button
            onClick={() => {
              reset();
              setSelectedProject(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {columns.map((col) => (
                    <th key={String(col.key)} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {col.header}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects && projects.length > 0 ? (
                  projects.map((row) => (
                  <tr key={row._id} className="hover:bg-gray-50">
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {col.render ? col.render(row) : String(row[col.key as keyof Project] || '')}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAssign(row)}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          Assign
                        </button>
                        <button
                          onClick={() => handleEdit(row)}
                          className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-8 text-center text-gray-500">
                      No projects found. Click "New Project" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Project Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            reset();
            setSelectedProject(null);
          }}
          title={selectedProject ? 'Edit Project' : 'New Project'}
          size="lg"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
              <input
                {...register('name')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <input
                  {...register('client')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.client && <p className="text-red-600 text-sm mt-1">{errors.client.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  {...register('status')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  {...register('deadline')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {errors.deadline && <p className="text-red-600 text-sm mt-1">{errors.deadline.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
              <input
                type="number"
                {...register('budget', { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.budget && <p className="text-red-600 text-sm mt-1">{errors.budget.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                  setSelectedProject(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                {selectedProject ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Assign Project Modal */}
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedProject(null);
            setSelectedTeamMembers([]);
          }}
          title="Assign Project via Email"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">Select team members to assign this project to. They will receive an email notification.</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {teamMembers.map((member) => (
                <label key={member._id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTeamMembers.includes(member._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTeamMembers([...selectedTeamMembers, member._id]);
                      } else {
                        setSelectedTeamMembers(selectedTeamMembers.filter((id) => id !== member._id));
                      }
                    }}
                    className="w-4 h-4 text-primary-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedProject(null);
                  setSelectedTeamMembers([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={selectedTeamMembers.length === 0}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200"
              >
                <Mail className="w-4 h-4" />
                Send Assignment
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
}
