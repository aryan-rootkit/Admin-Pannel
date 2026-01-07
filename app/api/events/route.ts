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
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
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
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
