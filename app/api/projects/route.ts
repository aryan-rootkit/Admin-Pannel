import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';

/**
 * GET /api/projects
 * Returns all projects
 */
export async function GET() {
  try {
    await connectDB();
    const projects = await Project.find().populate('assignedTeam').sort({ createdAt: -1 });
    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    
    // Handle MongoDB connection errors
    if (error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      return NextResponse.json(
        { 
          error: 'Database connection failed. Please check MongoDB credentials.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Creates a new project
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
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
    
    // Handle MongoDB connection errors
    if (error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      return NextResponse.json(
        { 
          error: 'Database connection failed. Please check MongoDB credentials.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      );
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
