import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';

/**
 * GET /api/team
 * Returns all team members
 */
export async function GET() {
  try {
    await connectDB();
    const team = await Team.find().populate('assignedProjects').sort({ createdAt: -1 });
    return NextResponse.json(team);
  } catch (error: any) {
    console.error('Error fetching team:', error);
    
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
      { error: 'Failed to fetch team', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team
 * Creates a new team member
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.role || body.hourlyRate === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, role, and hourlyRate are required' },
        { status: 400 }
      );
    }

    // Ensure assignedProjects is an array
    if (!body.assignedProjects) {
      body.assignedProjects = [];
    }
    
    const teamMember = new Team(body);
    await teamMember.save();
    
    return NextResponse.json(teamMember, { status: 201 });
  } catch (error: any) {
    console.error('Error creating team member:', error);
    
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
    
    // Handle duplicate email error
    if (error.code === 11000 || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'A team member with this email already exists' },
        { status: 400 }
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
        error: error.message || 'Failed to create team member',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
