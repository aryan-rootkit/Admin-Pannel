import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { localStorageUtils } from '@/lib/localStorage';

const USE_MOCK = process.env.USE_MOCK_AUTH === 'true';

/**
 * GET /api/projects/[id]
 * Returns a single project
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    if (USE_MOCK) {
      const projects = localStorageUtils.getProjects();
      const project = projects.find((p: any) => p._id === params.id);
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      return NextResponse.json(project);
    }

    await connectDB();
    const project = await Project.findById(params.id).populate('assignedTeam');
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Error fetching project:', error);
    
    // Fallback to localStorage
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      const projects = localStorageUtils.getProjects();
      const project = projects.find((p: any) => p._id === params.id);
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      return NextResponse.json(project);
    }
    
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

/**
 * PUT /api/projects/[id]
 * Updates a project
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
    if (USE_MOCK) {
      const projects = localStorageUtils.getProjects();
      if (!Array.isArray(projects)) {
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
      }
      const projectIndex = projects.findIndex((p: any) => p._id === params.id);
      if (projectIndex === -1) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      const updatedProject = { ...projects[projectIndex], ...body, _id: params.id };
      localStorageUtils.saveProject(updatedProject);
      return NextResponse.json(updatedProject);
    }

    await connectDB();
    
    // Convert date strings to Date objects if present
    const updateData: any = { ...body };
    if (body.startDate) {
      updateData.startDate = new Date(body.startDate);
    }
    if (body.deadline) {
      updateData.deadline = new Date(body.deadline);
    }
    if (body.budget !== undefined) {
      updateData.budget = Number(body.budget);
    }
    
    // Ensure assignedTeam is an array
    if (!updateData.assignedTeam) {
      updateData.assignedTeam = [];
    }
    
    const project = await Project.findByIdAndUpdate(params.id, updateData, { new: true, runValidators: true });
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Error updating project:', error);
    
    // Fallback to localStorage - use the body we already parsed
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      try {
        const projects = localStorageUtils.getProjects();
        if (!Array.isArray(projects)) {
          return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
        }
        const projectIndex = projects.findIndex((p: any) => p._id === params.id);
        if (projectIndex === -1) {
          return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }
        const updatedProject = { ...projects[projectIndex], ...body, _id: params.id };
        localStorageUtils.saveProject(updatedProject);
        return NextResponse.json(updatedProject);
      } catch (e: any) {
        return NextResponse.json(
          { error: e.message || 'Failed to update project' },
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
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to update project',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Deletes a project
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    if (USE_MOCK) {
      const projects = localStorageUtils.getProjects();
      const project = projects.find((p: any) => p._id === params.id);
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      localStorageUtils.deleteProject(params.id);
      return NextResponse.json({ message: 'Project deleted successfully' });
    }

    await connectDB();
    const project = await Project.findByIdAndDelete(params.id);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    
    // Fallback to localStorage
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      const projects = localStorageUtils.getProjects();
      const project = projects.find((p: any) => p._id === params.id);
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      localStorageUtils.deleteProject(params.id);
      return NextResponse.json({ message: 'Project deleted successfully' });
    }
    
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
