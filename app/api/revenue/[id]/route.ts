import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Revenue from '@/models/Revenue';
import { localStorageUtils } from '@/lib/localStorage';

const USE_MOCK = process.env.USE_MOCK_AUTH === 'true';

/**
 * GET /api/revenue/[id]
 * Returns a single revenue record
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    if (USE_MOCK) {
      const revenues = localStorageUtils.getRevenue();
      const revenue = revenues.find((r: any) => r._id === params.id);
      if (!revenue) {
        return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 });
      }
      return NextResponse.json(revenue);
    }

    await connectDB();
    const revenue = await Revenue.findById(params.id).populate('project');
    
    if (!revenue) {
      return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 });
    }
    
    return NextResponse.json(revenue);
  } catch (error: any) {
    console.error('Error fetching revenue:', error);
    
    // Fallback to localStorage
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      const revenues = localStorageUtils.getRevenue();
      const revenue = revenues.find((r: any) => r._id === params.id);
      if (!revenue) {
        return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 });
      }
      return NextResponse.json(revenue);
    }
    
    return NextResponse.json({ error: 'Failed to fetch revenue' }, { status: 500 });
  }
}

/**
 * PUT /api/revenue/[id]
 * Updates a revenue record
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
    if (USE_MOCK) {
      const revenues = localStorageUtils.getRevenue();
      const revenueIndex = revenues.findIndex((r: any) => r._id === params.id);
      if (revenueIndex === -1) {
        return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 });
      }
      const updatedRevenue = { 
        ...revenues[revenueIndex], 
        ...body, 
        _id: params.id,
        amount: Number(body.amount) || revenues[revenueIndex].amount,
      };
      localStorageUtils.saveRevenue(updatedRevenue);
      return NextResponse.json(updatedRevenue);
    }

    await connectDB();
    
    // Convert date string to Date object if present
    const updateData: any = { ...body };
    if (body.date) {
      updateData.date = new Date(body.date);
    }
    if (body.amount !== undefined) {
      updateData.amount = Number(body.amount);
    }
    
    const revenue = await Revenue.findByIdAndUpdate(params.id, updateData, { new: true, runValidators: true });
    
    if (!revenue) {
      return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 });
    }
    
    return NextResponse.json(revenue);
  } catch (error: any) {
    console.error('Error updating revenue:', error);
    
    // Fallback to localStorage - use the body we already parsed
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      try {
        const revenues = localStorageUtils.getRevenue();
        const revenueIndex = revenues.findIndex((r: any) => r._id === params.id);
        if (revenueIndex === -1) {
          return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 });
        }
        const updatedRevenue = { 
          ...revenues[revenueIndex], 
          ...body, 
          _id: params.id,
          amount: Number(body.amount) || revenues[revenueIndex].amount,
        };
        localStorageUtils.saveRevenue(updatedRevenue);
        return NextResponse.json(updatedRevenue);
      } catch (e: any) {
        return NextResponse.json(
          { error: e.message || 'Failed to update revenue' },
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
        error: error.message || 'Failed to update revenue',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/revenue/[id]
 * Deletes a revenue record
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    if (USE_MOCK) {
      const revenues = localStorageUtils.getRevenue();
      const revenue = revenues.find((r: any) => r._id === params.id);
      if (!revenue) {
        return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 });
      }
      localStorageUtils.deleteRevenue(params.id);
      return NextResponse.json({ message: 'Revenue record deleted successfully' });
    }

    await connectDB();
    const revenue = await Revenue.findByIdAndDelete(params.id);
    
    if (!revenue) {
      return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Revenue record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting revenue:', error);
    
    // Fallback to localStorage
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      const revenues = localStorageUtils.getRevenue();
      const revenue = revenues.find((r: any) => r._id === params.id);
      if (!revenue) {
        return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 });
      }
      localStorageUtils.deleteRevenue(params.id);
      return NextResponse.json({ message: 'Revenue record deleted successfully' });
    }
    
    return NextResponse.json({ error: 'Failed to delete revenue' }, { status: 500 });
  }
}
