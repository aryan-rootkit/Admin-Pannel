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
  } catch (error) {
    console.error('Error fetching revenue:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue' }, { status: 500 });
  }
}

/**
 * PUT /api/revenue/[id]
 * Updates a revenue record
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const body = await request.json();
    
    const revenue = await Revenue.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });
    
    if (!revenue) {
      return NextResponse.json({ error: 'Revenue record not found' }, { status: 404 });
    }
    
    return NextResponse.json(revenue);
  } catch (error) {
    console.error('Error updating revenue:', error);
    return NextResponse.json({ error: 'Failed to update revenue' }, { status: 500 });
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
  } catch (error) {
    console.error('Error deleting revenue:', error);
    return NextResponse.json({ error: 'Failed to delete revenue' }, { status: 500 });
  }
}
