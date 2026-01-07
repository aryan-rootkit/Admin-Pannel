import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import Team from '@/models/Team';
import { sendProjectAssignmentEmail } from '@/lib/email';

/**
 * POST /api/projects/[id]/assign
 * Assigns team members to a project and sends email notifications
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const { teamMemberIds } = await request.json();
    
    const project = await Project.findById(params.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Update assigned team
    project.assignedTeam = teamMemberIds;
    await project.save();

    // Send emails to assigned team members
    const teamMembers = await Team.find({ _id: { $in: teamMemberIds } });
    const emailPromises = teamMembers.map((member) =>
      sendProjectAssignmentEmail(
        member.email,
        project.name,
        project.description,
        project.deadline,
        project.client
      )
    );

    await Promise.allSettled(emailPromises);

    return NextResponse.json({ message: 'Project assigned and emails sent', project });
  } catch (error) {
    console.error('Error assigning project:', error);
    return NextResponse.json({ error: 'Failed to assign project' }, { status: 500 });
  }
}
