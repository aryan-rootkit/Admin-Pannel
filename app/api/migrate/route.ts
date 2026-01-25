import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import Project from '@/models/Project';
import Team from '@/models/Team';
import Revenue from '@/models/Revenue';
import Event from '@/models/Event';
import mongoose from 'mongoose';

/**
 * Migration API endpoint
 * Migrates data from localStorage to MongoDB
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { clients, projects, team, revenue, events } = body;

    const results = {
      clients: { created: 0, skipped: 0, errors: [] },
      projects: { created: 0, skipped: 0, errors: [] },
      team: { created: 0, skipped: 0, errors: [] },
      revenue: { created: 0, skipped: 0, errors: [] },
      events: { created: 0, skipped: 0, errors: [] },
    };

    // Migrate Clients
    if (Array.isArray(clients) && clients.length > 0) {
      for (const clientData of clients) {
        try {
          // Check if client already exists by email
          const existing = await Client.findOne({ email: clientData.email });
          if (existing) {
            results.clients.skipped++;
            continue;
          }

          // Create new client
          const client = new Client({
            name: clientData.name || 'Unknown',
            email: clientData.email || `client_${Date.now()}@example.com`,
            phone: clientData.phone || clientData.contact || '',
            company: clientData.company || '',
            address: clientData.address || '',
            status: clientData.status || 'Lead',
            notes: clientData.notes || '',
          });

          await client.save();
          results.clients.created++;
        } catch (error: any) {
          results.clients.errors.push({
            data: clientData,
            error: error.message || 'Unknown error',
          });
        }
      }
    }

    // Migrate Team Members
    if (Array.isArray(team) && team.length > 0) {
      for (const teamData of team) {
        try {
          // Check if team member already exists by email
          const existing = await Team.findOne({ email: teamData.email });
          if (existing) {
            results.team.skipped++;
            continue;
          }

          // Create new team member
          const teamMember = new Team({
            name: teamData.name || 'Unknown',
            email: teamData.email || `team_${Date.now()}@example.com`,
            contact: teamData.contact || '',
            employmentType: teamData.employmentType || 'In-House',
            role: teamData.role || 'Developer',
            subRole: teamData.subRole || '',
            skills: Array.isArray(teamData.skills) ? teamData.skills : [],
            hourlyRate: teamData.hourlyRate || 0,
            hoursWorkedThisWeek: teamData.hoursWorkedThisWeek || 0,
            avatar: teamData.avatar || '',
            assignedProjects: [],
          });

          await teamMember.save();
          results.team.created++;
        } catch (error: any) {
          results.team.errors.push({
            data: teamData,
            error: error.message || 'Unknown error',
          });
        }
      }
    }

    // Migrate Projects
    if (Array.isArray(projects) && projects.length > 0) {
      // First, get all team members to map IDs
      const allTeamMembers = await Team.find({});
      const teamEmailMap = new Map(allTeamMembers.map(t => [t.email, t._id]));

      for (const projectData of projects) {
        try {
          // Check if project already exists by name and client
          const existing = await Project.findOne({
            name: projectData.name,
            client: projectData.client,
          });
          if (existing) {
            results.projects.skipped++;
            continue;
          }

          // Map developer IDs (if they're email strings, convert to ObjectIds)
          let assignedTeam: mongoose.Types.ObjectId[] = [];
          if (Array.isArray(projectData.developers)) {
            assignedTeam = projectData.developers
              .map((dev: any) => {
                if (typeof dev === 'string') {
                  // Check if it's an email
                  if (dev.includes('@')) {
                    return teamEmailMap.get(dev);
                  }
                  // Check if it's already an ObjectId
                  if (mongoose.Types.ObjectId.isValid(dev)) {
                    return new mongoose.Types.ObjectId(dev);
                  }
                }
                return null;
              })
              .filter((id: any) => id !== null) as mongoose.Types.ObjectId[];
          }

          // Handle dates
          const startDate = projectData.startDate
            ? new Date(projectData.startDate)
            : new Date();
          const deadline = projectData.deadline
            ? new Date(projectData.deadline)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          // Map status
          const statusMap: Record<string, 'Pending' | 'In Progress' | 'Completed' | 'On Hold'> = {
            'Pending': 'Pending',
            'In Progress': 'In Progress',
            'Review': 'In Progress',
            'Completed': 'Completed',
            'Delayed': 'On Hold',
            'Overdue': 'On Hold',
          };
          const mappedStatus = statusMap[projectData.status] || 'Pending';

          // Create new project
          const project = new Project({
            name: projectData.name || 'Untitled Project',
            description: projectData.description || '',
            client: projectData.client || 'Unknown Client',
            startDate,
            deadline,
            budget: projectData.budget || projectData.budgetInr || 0,
            status: mappedStatus,
            assignedTeam,
            tasks: [],
          });

          await project.save();
          results.projects.created++;
        } catch (error: any) {
          results.projects.errors.push({
            data: projectData,
            error: error.message || 'Unknown error',
          });
        }
      }
    }

    // Migrate Revenue
    if (Array.isArray(revenue) && revenue.length > 0) {
      // Get all projects to map IDs
      const allProjects = await Project.find({});
      const projectNameMap = new Map(allProjects.map(p => [p.name, p._id]));

      for (const revenueData of revenue) {
        try {
          // Check if revenue already exists (by description and date)
          const revenueDate = revenueData.date
            ? new Date(revenueData.date)
            : new Date();
          const existing = await Revenue.findOne({
            description: revenueData.description,
            date: revenueDate,
            amount: revenueData.amount,
          });
          if (existing) {
            results.revenue.skipped++;
            continue;
          }

          // Map project if it's a string (project name)
          let projectId: mongoose.Types.ObjectId | undefined;
          if (revenueData.project) {
            if (typeof revenueData.project === 'string') {
              if (mongoose.Types.ObjectId.isValid(revenueData.project)) {
                projectId = new mongoose.Types.ObjectId(revenueData.project);
              } else {
                // Assume it's a project name
                projectId = projectNameMap.get(revenueData.project);
              }
            }
          }

          // Create new revenue entry
          const revenueEntry = new Revenue({
            type: revenueData.type || 'income',
            amount: revenueData.amount || 0,
            description: revenueData.description || '',
            date: revenueDate,
            project: projectId,
            status: revenueData.status || 'pending',
            invoiceNumber: revenueData.invoiceNumber || '',
          });

          await revenueEntry.save();
          results.revenue.created++;
        } catch (error: any) {
          results.revenue.errors.push({
            data: revenueData,
            error: error.message || 'Unknown error',
          });
        }
      }
    }

    // Migrate Events
    if (Array.isArray(events) && events.length > 0) {
      // Get all projects and team members to map IDs
      const allProjectsForEvents = await Project.find({});
      const allTeamForEvents = await Team.find({});
      const projectNameMapEvents = new Map(allProjectsForEvents.map(p => [p.name, p._id]));
      const teamEmailMapEvents = new Map(allTeamForEvents.map(t => [t.email, t._id]));

      for (const eventData of events) {
        try {
          // Check if event already exists (by title and start date)
          const startDate = eventData.start
            ? new Date(eventData.start)
            : new Date();
          const existing = await Event.findOne({
            title: eventData.title,
            start: startDate,
          });
          if (existing) {
            results.events.skipped++;
            continue;
          }

          // Map project and assignedTo
          let projectId: mongoose.Types.ObjectId | undefined;
          let assignedToId: mongoose.Types.ObjectId | undefined;

          if (eventData.project) {
            if (typeof eventData.project === 'string') {
              if (mongoose.Types.ObjectId.isValid(eventData.project)) {
                projectId = new mongoose.Types.ObjectId(eventData.project);
              } else {
                projectId = projectNameMapEvents.get(eventData.project);
              }
            }
          }

          if (eventData.assignedTo) {
            if (typeof eventData.assignedTo === 'string') {
              if (mongoose.Types.ObjectId.isValid(eventData.assignedTo)) {
                assignedToId = new mongoose.Types.ObjectId(eventData.assignedTo);
              } else if (eventData.assignedTo.includes('@')) {
                assignedToId = teamEmailMapEvents.get(eventData.assignedTo);
              }
            }
          }

          const endDate = eventData.end
            ? new Date(eventData.end)
            : new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour

          // Create new event
          const event = new Event({
            title: eventData.title || 'Untitled Event',
            description: eventData.description || '',
            start: startDate,
            end: endDate,
            type: eventData.type || 'event',
            project: projectId,
            assignedTo: assignedToId,
            color: eventData.color || '#3b82f6',
          });

          await event.save();
          results.events.created++;
        } catch (error: any) {
          results.events.errors.push({
            data: eventData,
            error: error.message || 'Unknown error',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Migration failed',
      },
      { status: 500 }
    );
  }
}
