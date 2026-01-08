import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import { localStorageUtils } from '@/lib/localStorage';

const USE_MOCK = process.env.USE_MOCK_AUTH === 'true';

/**
 * GET /api/clients/stats
 * Returns client statistics
 */
export async function GET() {
  try {
    if (USE_MOCK) {
      const clients = localStorageUtils.getClients();
      const total = clients.length;
      const active = clients.filter((c: any) => c.status === 'Active').length;
      const inactive = clients.filter((c: any) => c.status === 'Inactive').length;
      const leads = clients.filter((c: any) => c.status === 'Lead').length;
      return NextResponse.json({ total, active, inactive, leads });
    }

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
  } catch (error: any) {
    console.error('Error fetching client stats:', error);
    
    // Fallback to localStorage
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      const clients = localStorageUtils.getClients();
      const total = clients.length;
      const active = clients.filter((c: any) => c.status === 'Active').length;
      const inactive = clients.filter((c: any) => c.status === 'Inactive').length;
      const leads = clients.filter((c: any) => c.status === 'Lead').length;
      return NextResponse.json({ total, active, inactive, leads });
    }
    
    return NextResponse.json({ error: 'Failed to fetch client stats' }, { status: 500 });
  }
}
