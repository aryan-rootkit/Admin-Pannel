import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Revenue from '@/models/Revenue';

/**
 * GET /api/revenue/stats
 * Returns total revenue statistics
 */
export async function GET() {
  try {
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
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue stats' }, { status: 500 });
  }
}
