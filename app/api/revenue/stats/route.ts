import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Revenue from '@/models/Revenue';
import { localStorageUtils } from '@/lib/localStorage';

const USE_MOCK = process.env.USE_MOCK_AUTH === 'true';

/**
 * GET /api/revenue/stats
 * Returns total revenue statistics
 */
export async function GET() {
  try {
    if (USE_MOCK) {
      const revenues = localStorageUtils.getRevenue();
      const totalIncome = revenues
        .filter((r: any) => r.type === 'income')
        .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
      const totalExpenses = revenues
        .filter((r: any) => r.type === 'expense')
        .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
      const total = totalIncome - totalExpenses;
      return NextResponse.json({ total, income: totalIncome, expenses: totalExpenses });
    }

    await connectDB();
    const totalIncome = await Revenue.aggregate([
      { $match: { type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalExpenses = await Revenue.aggregate([
      { $match: { type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const total = (totalIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0);

    return NextResponse.json({ total, income: totalIncome[0]?.total || 0, expenses: totalExpenses[0]?.total || 0 });
  } catch (error: any) {
    console.error('Error fetching revenue stats:', error);
    
    // Fallback to localStorage
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      const revenues = localStorageUtils.getRevenue();
      const totalIncome = revenues
        .filter((r: any) => r.type === 'income')
        .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
      const totalExpenses = revenues
        .filter((r: any) => r.type === 'expense')
        .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
      const total = totalIncome - totalExpenses;
      return NextResponse.json({ total, income: totalIncome, expenses: totalExpenses });
    }
    
    return NextResponse.json({ error: 'Failed to fetch revenue stats' }, { status: 500 });
  }
}
