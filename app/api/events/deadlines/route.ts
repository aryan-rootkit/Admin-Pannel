import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';

/**
 * GET /api/events/deadlines
 * Returns count of upcoming deadlines
 */
export async function GET() {
  try {
    await connectDB();
    const now = new Date();
    const count = await Event.countDocuments({
      type: 'deadline',
      end: { $gte: now },
    });

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error('Error fetching deadlines:', error);

    return NextResponse.json({ error: 'Failed to fetch deadlines' }, { status: 500 });
  }
}
