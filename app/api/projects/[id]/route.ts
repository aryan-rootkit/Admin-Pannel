import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';

/**
 * GET /api/projects/[id]
 * Returns a single project
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const project = await Project.findById(params.id).populate('assignedTeam');
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Error fetching project:', error);

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
    await connectDB();
    const project = await Project.findByIdAndDelete(params.id);
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);

    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
