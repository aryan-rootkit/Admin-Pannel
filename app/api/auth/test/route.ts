import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/**
 * Test endpoint to check MongoDB connection and user existence
 * Visit: http://localhost:3000/api/auth/test
 */
export async function GET() {
  try {
    await connectDB();
    const userCount = await User.countDocuments();
    const adminExists = await User.findOne({ email: 'admin@rootkit.dev' });
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connected successfully',
      userCount,
      adminExists: !!adminExists,
      adminEmail: adminExists ? 'admin@rootkit.dev' : null,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hint: error instanceof Error && error.message.includes('ECONNREFUSED')
        ? 'MongoDB is not running. Start MongoDB or use MongoDB Atlas.'
        : 'Check your MongoDB connection string in .env.local',
    }, { status: 500 });
  }
}
