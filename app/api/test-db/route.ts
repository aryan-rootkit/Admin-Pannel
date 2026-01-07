import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

/**
 * GET /api/test-db
 * Tests MongoDB connection
 * Visit: http://localhost:3000/api/test-db
 */
export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({
      success: true,
      message: '✅ MongoDB connection successful!',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('MongoDB connection test failed:', error);
    
    let errorMessage = 'MongoDB connection failed';
    let suggestions: string[] = [];
    
    if (error.message?.includes('authentication failed') || error.message?.includes('bad auth')) {
      errorMessage = 'MongoDB authentication failed';
      suggestions = [
        'Check your MongoDB username and password in .env.local',
        'Verify credentials in MongoDB Atlas → Database Access',
        'Make sure password special characters are URL-encoded (@ = %40)',
        'Check if the database user has proper permissions',
      ];
    } else if (error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'MongoDB connection timeout';
      suggestions = [
        'Check if MongoDB Atlas IP whitelist includes your IP',
        'Go to MongoDB Atlas → Network Access → Add IP Address',
        'Or use 0.0.0.0/0 to allow all IPs (for development only)',
        'Check if MongoDB service is running (if using local MongoDB)',
      ];
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('DNS')) {
      errorMessage = 'MongoDB host not found';
      suggestions = [
        'Check your MONGODB_URI in .env.local',
        'Verify the cluster hostname is correct',
        'Check MongoDB Atlas cluster status',
      ];
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error.message,
        suggestions,
        help: 'Visit: https://www.mongodb.com/docs/atlas/troubleshoot-connection/',
      },
      { status: 503 }
    );
  }
}
