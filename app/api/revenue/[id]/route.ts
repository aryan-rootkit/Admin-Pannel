import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Revenue from '@/models/Revenue';

/**
 * GET /api/revenue/[id]
 * Returns a single revenue record
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const revenue = await Revenue.findById(params.id).populate('project');
    
    if (!revenue) {
      return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 });
    }
    
    return NextResponse.json(revenue);
  } catch (error: any) {
    console.error('Error fetching revenue:', error);

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
    await connectDB();
    const revenue = await Revenue.findByIdAndDelete(params.id);
    
    if (!revenue) {
      return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Revenue record deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting revenue:', error);

    return NextResponse.json({ error: 'Failed to delete revenue' }, { status: 500 });
  }
}
