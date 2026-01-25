import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import { localStorageUtils } from '@/lib/localStorage';

const USE_MOCK = process.env.USE_MOCK_AUTH === 'true';

/**
 * GET /api/team
 * Returns all team members
 */
export async function GET() {
  try {
    if (USE_MOCK) {
      const team = localStorageUtils.getTeam();
      return NextResponse.json(team);
    }

    await connectDB();
    const team = await Team.find().sort({ createdAt: -1 });
    return NextResponse.json(team);
  } catch (error: any) {
    console.error('Error fetching team:', error);
    
    // Fallback to localStorage
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      const team = localStorageUtils.getTeam();
      return NextResponse.json(team);
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

    if (USE_MOCK) {
      const member = {
        ...body,
        hourlyRate: Number(body.hourlyRate),
        availability: body.availability || 'Available',
      };
      const team = localStorageUtils.saveTeamMember(member);
      // Ensure team is an array and has items
      if (!Array.isArray(team) || team.length === 0) {
        return NextResponse.json(
          { error: 'Failed to save team member to localStorage' },
          { status: 500 }
        );
      }
      const savedMember = team[team.length - 1];
      return NextResponse.json(savedMember, { status: 201 });
    }
    
    await connectDB();
    const teamMember = new Team(body);
    await teamMember.save();
    
    return NextResponse.json(teamMember, { status: 201 });
  } catch (error: any) {
    console.error('Error creating team member:', error);
    
    // Fallback to localStorage - use the body we already parsed
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      try {
        const member = {
          ...body,
          hourlyRate: Number(body.hourlyRate),
          availability: body.availability || 'Available',
        };
        const team = localStorageUtils.saveTeamMember(member);
        // Ensure team is an array and has items
        if (!Array.isArray(team) || team.length === 0) {
          return NextResponse.json(
            { error: 'Failed to save team member to localStorage' },
            { status: 500 }
          );
        }
        const savedMember = team[team.length - 1];
        return NextResponse.json(savedMember, { status: 201 });
      } catch (e: any) {
        return NextResponse.json(
          { error: e.message || 'Failed to create team member' },
          { status: 500 }
        );
      }
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
