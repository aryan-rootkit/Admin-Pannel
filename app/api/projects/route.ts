import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { localStorageUtils } from '@/lib/localStorage';

const USE_MOCK = process.env.USE_MOCK_AUTH === 'true';

/**
 * GET /api/projects
 * Returns all projects (from DB or localStorage)
 */
export async function GET() {
  try {
    if (USE_MOCK) {
      const projects = localStorageUtils.getProjects();
      return NextResponse.json(projects);
    }

    await connectDB();
    const projects = await Project.find().populate('assignedTeam').sort({ createdAt: -1 });
    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    
    // Fallback to localStorage on error
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      const projects = localStorageUtils.getProjects();
      return NextResponse.json(projects);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Creates a new project (saves to DB or localStorage)
 */
export async function POST(request: Request) {
  // Read request body ONCE at the start
  let body;
  try {
    body = await request.json();
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }
  
  try {
    // Validate required fields
    if (!body.name || !body.description || !body.client || !body.startDate || !body.deadline || body.budget === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, client, startDate, deadline, and budget are required' },
        { status: 400 }
      );
    }

    // Ensure assignedTeam is an array
    if (!body.assignedTeam) {
      body.assignedTeam = [];
    }

    if (USE_MOCK) {
      const project = {
        ...body,
        startDate: body.startDate,
        deadline: body.deadline,
        budget: Number(body.budget),
        status: body.status || 'Pending',
      };
      const projects = localStorageUtils.saveProject(project);
      // Ensure projects is an array and has items
      if (!Array.isArray(projects) || projects.length === 0) {
        return NextResponse.json(
          { error: 'Failed to save project to localStorage' },
          { status: 500 }
        );
      }
      const savedProject = projects[projects.length - 1];
      return NextResponse.json(savedProject, { status: 201 });
    }

    await connectDB();
    
    // Convert date strings to Date objects
    const projectData = {
      ...body,
      startDate: new Date(body.startDate),
      deadline: new Date(body.deadline),
      budget: Number(body.budget),
    };
    
    const project = new Project(projectData);
    await project.save();
    
    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project:', error);
    
    // Fallback to localStorage on error - use the body we already parsed
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      try {
        const project = {
          ...body,
          startDate: body.startDate,
          deadline: body.deadline,
          budget: Number(body.budget),
          status: body.status || 'Pending',
        };
        const projects = localStorageUtils.saveProject(project);
        // Ensure projects is an array and has items
        if (!Array.isArray(projects) || projects.length === 0) {
          return NextResponse.json(
            { error: 'Failed to save project to localStorage' },
            { status: 500 }
          );
        }
        const savedProject = projects[projects.length - 1];
        return NextResponse.json(savedProject, { status: 201 });
      } catch (e: any) {
        return NextResponse.json(
          { error: e.message || 'Failed to create project' },
          { status: 500 }
        );
      }
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((e: any) => e.message).join(', ');
      return NextResponse.json(
        { error: `Validation error: ${messages}` },
        { status: 400 }
      );
    }
    
    // Generic error
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create project',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
