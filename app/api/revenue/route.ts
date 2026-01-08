import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Revenue from '@/models/Revenue';
import { localStorageUtils } from '@/lib/localStorage';

const USE_MOCK = process.env.USE_MOCK_AUTH === 'true';

/**
 * GET /api/revenue
 * Returns all revenue records
 */
export async function GET() {
  try {
    if (USE_MOCK) {
      const revenue = localStorageUtils.getRevenue();
      return NextResponse.json(revenue);
    }

    await connectDB();
    const revenue = await Revenue.find().populate('project').sort({ date: -1 });
    return NextResponse.json(revenue);
  } catch (error: any) {
    console.error('Error fetching revenue:', error);
    
    // Fallback to localStorage
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      const revenue = localStorageUtils.getRevenue();
      return NextResponse.json(revenue);
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

    if (USE_MOCK) {
      const revenue = {
        ...body,
        date: body.date,
        amount: Number(body.amount),
        client: body.client || '',
        status: body.status || 'pending',
        invoiceNumber: body.invoiceNumber || '',
      };
      const revenues = localStorageUtils.saveRevenue(revenue);
      // Ensure revenues is an array and has items
      if (!Array.isArray(revenues) || revenues.length === 0) {
        return NextResponse.json(
          { error: 'Failed to save revenue to localStorage' },
          { status: 500 }
        );
      }
      const savedRevenue = revenues[revenues.length - 1];
      return NextResponse.json(savedRevenue, { status: 201 });
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
    
    // Fallback to localStorage - use the body we already parsed
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      try {
        const revenue = {
          ...body,
          date: body.date,
          amount: Number(body.amount),
          client: body.client || '',
          status: body.status || 'pending',
          invoiceNumber: body.invoiceNumber || '',
        };
        const revenues = localStorageUtils.saveRevenue(revenue);
        // Ensure revenues is an array and has items
        if (!Array.isArray(revenues) || revenues.length === 0) {
          return NextResponse.json(
            { error: 'Failed to save revenue to localStorage' },
            { status: 500 }
          );
        }
        const savedRevenue = revenues[revenues.length - 1];
        return NextResponse.json(savedRevenue, { status: 201 });
      } catch (e: any) {
        return NextResponse.json(
          { error: e.message || 'Failed to create revenue' },
          { status: 500 }
        );
      }
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
