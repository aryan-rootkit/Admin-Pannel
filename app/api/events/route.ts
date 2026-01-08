import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import { localStorageUtils } from '@/lib/localStorage';

const USE_MOCK = process.env.USE_MOCK_AUTH === 'true';

/**
 * GET /api/events
 * Returns all events
 */
export async function GET() {
  try {
    if (USE_MOCK) {
      const events = localStorageUtils.getEvents();
      return NextResponse.json(events);
    }

    await connectDB();
    const events = await Event.find().populate('project assignedTo').sort({ start: 1 });
    return NextResponse.json(events);
  } catch (error: any) {
    console.error('Error fetching events:', error);
    
    // Fallback to localStorage
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      const events = localStorageUtils.getEvents();
      return NextResponse.json(events);
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
    const body = await request.json();
    
    if (USE_MOCK) {
      const event = {
        ...body,
        start: body.start || body.startDate || new Date().toISOString(),
        end: body.end || body.endDate || body.start || body.startDate || new Date().toISOString(),
        type: body.type || 'event',
      };
      const events = localStorageUtils.saveEvent(event);
      const savedEvent = events[events.length - 1];
      return NextResponse.json(savedEvent, { status: 201 });
    }

    await connectDB();
    const event = new Event(body);
    await event.save();
    
    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    
    // Fallback to localStorage
    if (USE_MOCK || error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      const body = await request.json();
      const event = {
        ...body,
        start: body.start || body.startDate || new Date().toISOString(),
        end: body.end || body.endDate || body.start || body.startDate || new Date().toISOString(),
        type: body.type || 'event',
      };
      const events = localStorageUtils.saveEvent(event);
      const savedEvent = events[events.length - 1];
      return NextResponse.json(savedEvent, { status: 201 });
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
