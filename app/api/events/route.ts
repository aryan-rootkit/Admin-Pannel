import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';

/**
 * GET /api/events
 * Returns all events
 */
export async function GET() {
  try {
    await connectDB();
    const events = await Event.find().populate('project assignedTo').sort({ start: 1 });
    return NextResponse.json(events);
  } catch (error: any) {
    console.error('Error fetching events:', error);
    
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
      { error: 'Failed to fetch events', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Creates a new event
 */
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const event = new Event(body);
    await event.save();
    
    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    
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
        error: error.message || 'Failed to create event',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
