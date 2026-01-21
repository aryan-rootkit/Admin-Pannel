'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  contactPerson?: string;
  address?: string;
  revenue?: number;
  assignedDevelopers?: string[];
  status: 'Lead' | 'Proposal' | 'Active' | 'Overdue' | 'Won' | 'Lost' | 'Inactive';
  clientTier?: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  notes?: string;
}

interface Revenue {
  _id: string;
  type: 'income' | 'expense' | 'invoice';
  amount: number;
  description: string;
  date: string;
  clientId?: string;
  status?: 'pending' | 'paid' | 'overdue';
}

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
}

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
  budget: number;
  status: 'Pending' | 'In Progress' | 'Review' | 'Completed' | 'Delayed';
  assignedTeam?: any[];
  createdAt?: string;
  updatedAt?: string;
  progress?: number;
}

interface AppState {
  clients: Client[];
  revenue: Revenue[];
  team: TeamMember[];
  projects: Project[];
  monthlyTarget: number;
  setClients: (clients: Client[]) => void;
  setRevenue: (revenue: Revenue[]) => void;
  setTeam: (team: TeamMember[]) => void;
  setProjects: (projects: Project[]) => void;
  setMonthlyTarget: (target: number) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addRevenue: (revenue: Revenue) => void;
  updateRevenue: (id: string, revenue: Partial<Revenue>) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [monthlyTarget, setMonthlyTarget] = useState(10000);

  // Load initial data (only if in browser and not on login page)
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      fetchClients();
      fetchRevenue();
      fetchTeam();
      fetchProjects();
      const savedTarget = localStorage.getItem('monthlyTarget');
      if (savedTarget) {
        setMonthlyTarget(Number(savedTarget));
      }
    }
  }, []);

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

  const fetchRevenue = async () => {
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
    }
  };

  const fetchTeam = async () => {
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
      console.error('Error fetching team:', error);
    }
  };

  const fetchProjects = async () => {
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
    }
  };

  const addClient = (client: Client) => {
    setClients([...clients, client]);
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(clients.map(c => c._id === id ? { ...c, ...updates } : c));
  };

  const deleteClient = (id: string) => {
    setClients(clients.filter(c => c._id !== id));
  };

  const addRevenue = (rev: Revenue) => {
    setRevenue([...revenue, rev]);
  };

  const updateRevenue = (id: string, updates: Partial<Revenue>) => {
    setRevenue(revenue.map(r => r._id === id ? { ...r, ...updates } : r));
  };

  const addProject = (project: Project) => {
    setProjects([...projects, project]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(projects.map(p => p._id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p._id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        clients,
        revenue,
        team,
        projects,
        monthlyTarget,
        setClients,
        setRevenue,
        setTeam,
        setProjects,
        setMonthlyTarget,
        addClient,
        updateClient,
        deleteClient,
        addRevenue,
        updateRevenue,
        addProject,
        updateProject,
        deleteProject,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
