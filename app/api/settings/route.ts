import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';

/**
 * GET /api/settings
 * Returns current settings
 */
export async function GET() {
  try {
    await connectDB();
    const settings = await Settings.getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * PUT /api/settings
 * Updates settings
 */
export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings(body);
    } else {
      Object.assign(settings, body);
    }
    
    await settings.save();
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
