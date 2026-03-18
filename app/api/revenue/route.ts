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
  } catch (error: any) {
    console.error('Error fetching revenue:', error);

    return NextResponse.json(
      { error: 'Failed to fetch revenue', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

/**
 * POST /api/revenue
 * Creates a new revenue record
 */
export async function POST(request: Request) {
  // Read request body ONCE at the start
  let body;
  try {
    const requestBody = await request.json();
    body = requestBody;
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }
  
  try {
    // Validate required fields
    if (!body.type || body.amount === undefined || !body.description || !body.date) {
      return NextResponse.json(
        { error: 'Missing required fields: type, amount, description, and date are required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Convert date string to Date object
    const revenueData = {
      ...body,
      date: new Date(body.date),
      amount: Number(body.amount),
    };
    
    const revenue = new Revenue(revenueData);
    await revenue.save();
    
    return NextResponse.json(revenue, { status: 201 });
  } catch (error: any) {
    console.error('Error creating revenue:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((e: any) => e.message).join(', ');
      return NextResponse.json(
        { error: `Validation error: ${messages}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create revenue',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
