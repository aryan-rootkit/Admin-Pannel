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
    
    // Handle MongoDB connection errors
    if (error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      return NextResponse.json(
        { 
          error: 'Database connection failed. Please check MongoDB credentials.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      );
    }
    
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
  try {
    await connectDB();
    const body = await request.json();
    
    // Validate required fields
    if (!body.type || !body.amount || !body.description || !body.date) {
      return NextResponse.json(
        { error: 'Missing required fields: type, amount, description, and date are required' },
        { status: 400 }
      );
    }

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
    
    // Handle MongoDB connection errors
    if (error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      return NextResponse.json(
        { 
          error: 'Database connection failed. Please check MongoDB credentials.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      );
    }
    
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
