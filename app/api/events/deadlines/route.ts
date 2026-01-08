import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import { localStorageUtils } from '@/lib/localStorage';

const USE_MOCK = process.env.USE_MOCK_AUTH === 'true';

/**
 * GET /api/events/deadlines
 * Returns count of upcoming deadlines
 */
export async function GET() {
  try {
    if (USE_MOCK) {
      const events = localStorageUtils.getEvents();
      const now = new Date();
      const count = events.filter((e: any) => {
        if (e.type !== 'deadline') return false;
        const endDate = new Date(e.end || e.endDate || e.date);
        return endDate >= now;
      }).length;
      return NextResponse.json({ count });
    }

    await connectDB();
    const now = new Date();
    const count = await Event.countDocuments({
      type: 'deadline',
      end: { $gte: now },
    });

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error('Error fetching deadlines:', error);
    
    // Fallback to localStorage
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      const events = localStorageUtils.getEvents();
      const now = new Date();
      const count = events.filter((e: any) => {
        if (e.type !== 'deadline') return false;
        const endDate = new Date(e.end || e.endDate || e.date);
        return endDate >= now;
      }).length;
      return NextResponse.json({ count });
    }
    
    return NextResponse.json({ error: 'Failed to fetch deadlines' }, { status: 500 });
  }
}
