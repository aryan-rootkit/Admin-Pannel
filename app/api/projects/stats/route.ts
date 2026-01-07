import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';

/**
 * GET /api/projects/stats
 * Returns project statistics
 */
export async function GET() {
  try {
    await connectDB();

    const total = await Project.countDocuments();
    const inProgress = await Project.countDocuments({ status: 'In Progress' });
    const completed = await Project.countDocuments({ status: 'Completed' });
    const pending = await Project.countDocuments({ status: 'Pending' });
    const onHold = await Project.countDocuments({ status: 'On Hold' });

    return NextResponse.json({ total, inProgress, completed, pending, onHold });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return NextResponse.json({ error: 'Failed to fetch project stats' }, { status: 500 });
  }
}
