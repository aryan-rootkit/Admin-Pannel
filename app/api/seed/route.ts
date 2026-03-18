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

    const defaultAdmin = {
      name: 'Admin User',
      email: 'admin@rootkit.dev',
      password: 'admin123',
      role: 'admin' as const,
    };

    // Optional extra admin (one-time use via env vars)
    const extraAdminEmail = process.env.EXTRA_ADMIN_EMAIL?.toLowerCase().trim();
    const extraAdminPassword = process.env.EXTRA_ADMIN_PASSWORD;
    const extraAdminName = process.env.EXTRA_ADMIN_NAME || 'Extra Admin';
    const extraAdminRole = (process.env.EXTRA_ADMIN_ROLE || 'admin') as 'admin' | 'manager';

    const result: any = {
      success: true,
      defaultAdmin: { email: defaultAdmin.email, created: false, alreadyExists: false },
      extraAdmin: extraAdminEmail
        ? { email: extraAdminEmail, created: false, alreadyExists: false }
        : null,
    };

    // Ensure default admin exists
    const existingDefaultAdmin = await User.findOne({ email: defaultAdmin.email });
    if (!existingDefaultAdmin) {
      const admin = new User(defaultAdmin);
      await admin.save();
      result.defaultAdmin.created = true;
    } else {
      result.defaultAdmin.alreadyExists = true;
    }

    // Create extra admin only if env vars are provided
    if (extraAdminEmail && extraAdminPassword) {
      const existingExtra = await User.findOne({ email: extraAdminEmail });
      if (!existingExtra) {
        const extraUser = new User({
          name: extraAdminName,
          email: extraAdminEmail,
          password: extraAdminPassword, // will be hashed by pre-save hook
          role: extraAdminRole,
        });
        await extraUser.save();
        result.extraAdmin.created = true;
      } else {
        result.extraAdmin.alreadyExists = true;
      }
    }

    const createdAny = result.defaultAdmin.created || (result.extraAdmin && result.extraAdmin.created);
    result.message = createdAny
      ? 'Seed completed successfully (admin user(s) created if missing).'
      : 'No changes made (admin user(s) already existed).';

    return NextResponse.json(result);
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
