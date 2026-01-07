'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  revenue?: number;
  assignedDevelopers?: string[];
  status: 'Active' | 'Inactive' | 'Lead';
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

interface AppState {
  clients: Client[];
  revenue: Revenue[];
  team: TeamMember[];
  monthlyTarget: number;
  setClients: (clients: Client[]) => void;
  setRevenue: (revenue: Revenue[]) => void;
  setTeam: (team: TeamMember[]) => void;
  setMonthlyTarget: (target: number) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addRevenue: (revenue: Revenue) => void;
  updateRevenue: (id: string, revenue: Partial<Revenue>) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [monthlyTarget, setMonthlyTarget] = useState(10000);

  // Load initial data (only if in browser and not on login page)
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      fetchClients();
      fetchRevenue();
      fetchTeam();
      const savedTarget = localStorage.getItem('monthlyTarget');
      if (savedTarget) {
        setMonthlyTarget(Number(savedTarget));
      }
    }
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchRevenue = async () => {
    try {
      const res = await fetch('/api/revenue');
      const data = await res.json();
      setRevenue(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching revenue:', error);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      setTeam(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching team:', error);
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

  return (
    <AppContext.Provider
      value={{
        clients,
        revenue,
        team,
        monthlyTarget,
        setClients,
        setRevenue,
        setTeam,
        setMonthlyTarget,
        addClient,
        updateClient,
        deleteClient,
        addRevenue,
        updateRevenue,
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
