import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';

/**
 * GET /api/clients/stats
 * Returns client statistics
 */
export async function GET() {
  try {
    await connectDB();
    
    const total = await Client.countDocuments();
    const active = await Client.countDocuments({ status: 'Active' });
    const inactive = await Client.countDocuments({ status: 'Inactive' });
    const leads = await Client.countDocuments({ status: 'Lead' });
    
    return NextResponse.json({
      total,
      active,
      inactive,
      leads,
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    return NextResponse.json({ error: 'Failed to fetch client stats' }, { status: 500 });
  }
}
