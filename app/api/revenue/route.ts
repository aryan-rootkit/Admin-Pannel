import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Revenue from '@/models/Revenue';

/**
 * GET /api/revenue
 * Returns all revenue records
 */
export async function GET() {
  try {
    await connectDB();
    const revenue = await Revenue.find().populate('project').sort({ date: -1 });
    return NextResponse.json(revenue);
  } catch (error) {
    console.error('Error fetching revenue:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue' }, { status: 500 });
  }
}

/**
 * POST /api/revenue
 * Creates a new revenue record
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const revenue = new Revenue(body);
    await revenue.save();
    
    return NextResponse.json(revenue, { status: 201 });
  } catch (error) {
    console.error('Error creating revenue:', error);
    return NextResponse.json({ error: 'Failed to create revenue' }, { status: 500 });
  }
}
