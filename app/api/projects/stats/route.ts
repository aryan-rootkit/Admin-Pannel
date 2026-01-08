import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { localStorageUtils } from '@/lib/localStorage';

const USE_MOCK = process.env.USE_MOCK_AUTH === 'true';

/**
 * GET /api/projects/stats
 * Returns project statistics
 */
export async function GET() {
  try {
    if (USE_MOCK) {
      const projects = localStorageUtils.getProjects();
      const total = projects.length;
      const inProgress = projects.filter((p: any) => p.status === 'In Progress').length;
      const completed = projects.filter((p: any) => p.status === 'Completed').length;
      const pending = projects.filter((p: any) => p.status === 'Pending').length;
      const onHold = projects.filter((p: any) => p.status === 'On Hold').length;
      return NextResponse.json({ total, inProgress, completed, pending, onHold });
    }

    await connectDB();
    const total = await Project.countDocuments();
    const inProgress = await Project.countDocuments({ status: 'In Progress' });
    const completed = await Project.countDocuments({ status: 'Completed' });
    const pending = await Project.countDocuments({ status: 'Pending' });
    const onHold = await Project.countDocuments({ status: 'On Hold' });

    return NextResponse.json({ total, inProgress, completed, pending, onHold });
  } catch (error: any) {
    console.error('Error fetching project stats:', error);
    
    // Fallback to localStorage
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      const projects = localStorageUtils.getProjects();
      const total = projects.length;
      const inProgress = projects.filter((p: any) => p.status === 'In Progress').length;
      const completed = projects.filter((p: any) => p.status === 'Completed').length;
      const pending = projects.filter((p: any) => p.status === 'Pending').length;
      const onHold = projects.filter((p: any) => p.status === 'On Hold').length;
      return NextResponse.json({ total, inProgress, completed, pending, onHold });
    }
    
    return NextResponse.json({ error: 'Failed to fetch project stats' }, { status: 500 });
  }
}
