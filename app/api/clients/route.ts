import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import { localStorageUtils } from '@/lib/localStorage';

const USE_MOCK = process.env.USE_MOCK_AUTH === 'true';

/**
 * GET /api/clients
 * Returns all clients
 */
export async function GET() {
  try {
    if (USE_MOCK) {
      const clients = localStorageUtils.getClients();
      return NextResponse.json(clients);
    }

    await connectDB();
    const clients = await Client.find().sort({ createdAt: -1 });
    return NextResponse.json(clients);
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    
    // Fallback to localStorage
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      const clients = localStorageUtils.getClients();
      return NextResponse.json(clients);
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
  // Read request body ONCE at the start
  let body;
  try {
    body = await request.json();
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }
  
  try {
    if (USE_MOCK) {
      const client = {
        ...body,
        status: body.status || 'Lead',
        totalRevenue: body.totalRevenue || 0,
        assignedDevelopers: body.assignedDevelopers || [],
      };
      const clients = localStorageUtils.saveClient(client);
      // Ensure clients is an array and has items
      if (!Array.isArray(clients) || clients.length === 0) {
        return NextResponse.json(
          { error: 'Failed to save client to localStorage' },
          { status: 500 }
        );
      }
      const savedClient = clients[clients.length - 1];
      return NextResponse.json(savedClient, { status: 201 });
    }

    await connectDB();
    const client = new Client(body);
    await client.save();
    
    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);
    
    // Fallback to localStorage - use the body we already parsed
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      try {
        const client = {
          ...body,
          status: body.status || 'Lead',
          totalRevenue: body.totalRevenue || 0,
          assignedDevelopers: body.assignedDevelopers || [],
        };
        const clients = localStorageUtils.saveClient(client);
        // Ensure clients is an array and has items
        if (!Array.isArray(clients) || clients.length === 0) {
          return NextResponse.json(
            { error: 'Failed to save client to localStorage' },
            { status: 500 }
          );
        }
        const savedClient = clients[clients.length - 1];
        return NextResponse.json(savedClient, { status: 201 });
      } catch (e: any) {
        return NextResponse.json(
          { error: e.message || 'Failed to create client' },
          { status: 500 }
        );
      }
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
