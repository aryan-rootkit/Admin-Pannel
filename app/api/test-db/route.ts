import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

/**
 * GET /api/test-db
 * Tests MongoDB connection
 * Visit: http://localhost:3000/api/test-db
 */
export async function GET() {
  try {
    // Debug info for Vercel
    const hasMongoUri = !!process.env.MONGODB_URI;
    const isVercel = !!process.env.VERCEL;
    const nodeEnv = process.env.NODE_ENV;
    
    if (!hasMongoUri) {
      return NextResponse.json(
        {
          success: false,
          error: 'MONGODB_URI environment variable is missing',
          debug: {
            hasMongoUri: false,
            isVercel,
            nodeEnv,
            message: 'Add MONGODB_URI to Vercel Environment Variables → Settings → Environment Variables',
          },
          suggestions: [
            'Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
            'Add MONGODB_URI with your MongoDB Atlas connection string',
            'Select all environments (Production, Preview, Development)',
            'Redeploy your project',
          ],
        },
        { status: 503 }
      );
    }

    await connectDB();
    return NextResponse.json({
      success: true,
      message: '✅ MongoDB connection successful!',
      timestamp: new Date().toISOString(),
      debug: {
        hasMongoUri: true,
        isVercel,
        nodeEnv,
      },
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
