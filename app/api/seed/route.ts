import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

/**
 * GET /api/seed
 * Creates initial admin user
 * Visit: http://localhost:3000/api/seed
 */
export async function GET() {
  try {
    await connectDB();

    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: 'admin@rootkit.dev' });
    
    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Admin user already exists',
        email: 'admin@rootkit.dev',
        password: 'admin123'
      });
    }

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@rootkit.dev',
      password: 'admin123', // Will be hashed by pre-save hook
      role: 'admin',
    });

    await admin.save();
    
    return NextResponse.json({ 
      success: true,
      message: 'Admin user created successfully!',
      email: 'admin@rootkit.dev',
      password: 'admin123'
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json({ 
      error: 'Failed to seed database',
      message: error instanceof Error ? error.message : 'Unknown error',
      hint: error instanceof Error && error.message.includes('ECONNREFUSED') 
        ? 'MongoDB is not running. Please start MongoDB or use MongoDB Atlas.'
        : 'Check your MongoDB connection string in .env.local'
    }, { status: 500 });
  }
}
