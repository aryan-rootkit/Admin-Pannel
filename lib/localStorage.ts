/**
 * LocalStorage utility for mock mode
 * Stores data locally when database is not available
 */

const STORAGE_KEYS = {
  projects: 'rootkit_projects',
  team: 'rootkit_team',
  revenue: 'rootkit_revenue',
  clients: 'rootkit_clients',
  events: 'rootkit_events',
};

export const localStorageUtils = {
  // Projects
  getProjects: () => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.projects);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing projects from localStorage:', e);
      return [];
    }
  },
  
  saveProject: (project: any) => {
    if (typeof window === 'undefined') {
      return [{
        ...project,
        _id: project._id || `project_${Date.now()}`,
        createdAt: project.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }];
    }
    try {
      const projects = localStorageUtils.getProjects();
      if (!Array.isArray(projects)) {
        localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify([]));
        return [];
      }
      const existingIndex = projects.findIndex((p: any) => p._id === project._id);
      if (existingIndex >= 0) {
        projects[existingIndex] = { ...project, updatedAt: new Date().toISOString() };
      } else {
        projects.push({ ...project, _id: project._id || `project_${Date.now()}`, createdAt: new Date().toISOString() });
      }
      localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
      return projects;
    } catch (e) {
      console.error('Error saving project to localStorage:', e);
      return [];
    }
  },
  
  deleteProject: (id: string) => {
    if (typeof window === 'undefined') return [];
    try {
      const projects = localStorageUtils.getProjects();
      if (!Array.isArray(projects)) return [];
      const filtered = projects.filter((p: any) => p._id !== id);
      localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(filtered));
      return filtered;
    } catch (e) {
      console.error('Error deleting project from localStorage:', e);
      return [];
    }
  },

  // Team
  getTeam: () => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.team);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing team from localStorage:', e);
      return [];
    }
  },
  
  saveTeamMember: (member: any) => {
    if (typeof window === 'undefined') {
      return [{
        ...member,
        _id: member._id || `team_${Date.now()}`,
        createdAt: member.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }];
    }
    try {
      const team = localStorageUtils.getTeam();
      if (!Array.isArray(team)) {
        localStorage.setItem(STORAGE_KEYS.team, JSON.stringify([]));
        return [];
      }
      const existingIndex = team.findIndex((m: any) => m._id === member._id);
      if (existingIndex >= 0) {
        team[existingIndex] = { ...member, updatedAt: new Date().toISOString() };
      } else {
        team.push({ ...member, _id: member._id || `team_${Date.now()}`, createdAt: new Date().toISOString() });
      }
      localStorage.setItem(STORAGE_KEYS.team, JSON.stringify(team));
      return team;
    } catch (e) {
      console.error('Error saving team member to localStorage:', e);
      return [];
    }
  },
  
  deleteTeamMember: (id: string) => {
    if (typeof window === 'undefined') return [];
    try {
      const team = localStorageUtils.getTeam();
      if (!Array.isArray(team)) return [];
      const filtered = team.filter((m: any) => m._id !== id);
      localStorage.setItem(STORAGE_KEYS.team, JSON.stringify(filtered));
      return filtered;
    } catch (e) {
      console.error('Error deleting team member from localStorage:', e);
      return [];
    }
  },

  // Revenue
  getRevenue: () => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.revenue);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing revenue from localStorage:', e);
      return [];
    }
  },
  
  saveRevenue: (revenue: any) => {
    if (typeof window === 'undefined') {
      // Server-side: return a mock array with the new revenue
      return [{
        ...revenue,
        _id: revenue._id || `revenue_${Date.now()}`,
        createdAt: revenue.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }];
    }
    try {
      const revenues = localStorageUtils.getRevenue();
      if (!Array.isArray(revenues)) {
        console.error('Revenue data is not an array, resetting...');
        localStorage.setItem(STORAGE_KEYS.revenue, JSON.stringify([]));
        return [];
      }
      const existingIndex = revenues.findIndex((r: any) => r._id === revenue._id);
      if (existingIndex >= 0) {
        revenues[existingIndex] = { ...revenue, updatedAt: new Date().toISOString() };
      } else {
        revenues.push({ ...revenue, _id: revenue._id || `revenue_${Date.now()}`, createdAt: new Date().toISOString() });
      }
      localStorage.setItem(STORAGE_KEYS.revenue, JSON.stringify(revenues));
      return revenues;
    } catch (e) {
      console.error('Error saving revenue to localStorage:', e);
      return [];
    }
  },
  
  deleteRevenue: (id: string) => {
    if (typeof window === 'undefined') return [];
    try {
      const revenues = localStorageUtils.getRevenue();
      if (!Array.isArray(revenues)) return [];
      const filtered = revenues.filter((r: any) => r._id !== id);
      localStorage.setItem(STORAGE_KEYS.revenue, JSON.stringify(filtered));
      return filtered;
    } catch (e) {
      console.error('Error deleting revenue from localStorage:', e);
      return [];
    }
  },

  // Clients
  getClients: () => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.clients);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing clients from localStorage:', e);
      return [];
    }
  },
  
  saveClient: (client: any) => {
    if (typeof window === 'undefined') {
      return [{
        ...client,
        _id: client._id || `client_${Date.now()}`,
        createdAt: client.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }];
    }
    try {
      const clients = localStorageUtils.getClients();
      if (!Array.isArray(clients)) {
        localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify([]));
        return [];
      }
      const existingIndex = clients.findIndex((c: any) => c._id === client._id);
      if (existingIndex >= 0) {
        clients[existingIndex] = { ...client, updatedAt: new Date().toISOString() };
      } else {
        clients.push({ ...client, _id: client._id || `client_${Date.now()}`, createdAt: new Date().toISOString() });
      }
      localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients));
      return clients;
    } catch (e) {
      console.error('Error saving client to localStorage:', e);
      return [];
    }
  },
  
  deleteClient: (id: string) => {
    if (typeof window === 'undefined') return [];
    try {
      const clients = localStorageUtils.getClients();
      if (!Array.isArray(clients)) return [];
      const filtered = clients.filter((c: any) => c._id !== id);
      localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(filtered));
      return filtered;
    } catch (e) {
      console.error('Error deleting client from localStorage:', e);
      return [];
    }
  },

  // Events
  getEvents: () => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.events);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Error parsing events from localStorage:', e);
      return [];
    }
  },
  
  saveEvent: (event: any) => {
    if (typeof window === 'undefined') {
      return [{
        ...event,
        _id: event._id || `event_${Date.now()}`,
        createdAt: event.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }];
    }
    try {
      const events = localStorageUtils.getEvents();
      if (!Array.isArray(events)) {
        localStorage.setItem(STORAGE_KEYS.events, JSON.stringify([]));
        return [];
      }
      const existingIndex = events.findIndex((e: any) => e._id === event._id);
      if (existingIndex >= 0) {
        events[existingIndex] = { ...event, updatedAt: new Date().toISOString() };
      } else {
        events.push({ ...event, _id: event._id || `event_${Date.now()}`, createdAt: new Date().toISOString() });
      }
      localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(events));
      return events;
    } catch (e) {
      console.error('Error saving event to localStorage:', e);
      return [];
    }
  },
  
  deleteEvent: (id: string) => {
    if (typeof window === 'undefined') return [];
    try {
      const events = localStorageUtils.getEvents();
      if (!Array.isArray(events)) return [];
      const filtered = events.filter((e: any) => e._id !== id);
      localStorage.setItem(STORAGE_KEYS.events, JSON.stringify(filtered));
      return filtered;
    } catch (e) {
      console.error('Error deleting event from localStorage:', e);
      return [];
    }
  },
};
