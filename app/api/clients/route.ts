import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import { clientSchema } from '@/lib/security/validation';
import { withRateLimit, sanitizeBody, safeErrorResponse } from '@/lib/security/middleware';

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

    return NextResponse.json(
      { error: 'Failed to fetch clients', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients
 * Creates a new client
 * SECURITY: Validated with Zod schema, rate limited, sanitized
 */
async function POSTHandler(request: NextRequest) {
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
    // SECURITY: Validate and sanitize input
    const sanitizedBody = sanitizeBody(body);
    const validatedData = clientSchema.parse(sanitizedBody);
    
    await connectDB();
    const client = new Client(validatedData);
    await client.save();
    
    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating client:', error);
    
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
    
    return safeErrorResponse(error, 500);
  }
}

// Export with rate limiting
export const POST = withRateLimit(POSTHandler, { isWrite: true });
