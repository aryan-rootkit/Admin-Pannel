import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';

/**
 * GET /api/clients
 * Returns all clients
 */
export async function GET() {
  try {
    await connectDB();
    const clients = await Client.find().sort({ createdAt: -1 });
    return NextResponse.json(clients);
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    
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
      { error: 'Failed to fetch clients', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients
 * Creates a new client
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const client = new Client(body);
    await client.save();
    
    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);
    
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
    
    // Handle duplicate email error
    if (error.code === 11000 || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 400 }
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
        error: error.message || 'Failed to create client',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
