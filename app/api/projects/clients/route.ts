import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';

/**
 * GET /api/projects/clients
 * Returns unique client count
 */
export async function GET() {
  try {
    await connectDB();

    const clients = await Project.distinct('client');
    return NextResponse.json({ count: clients.length, clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
