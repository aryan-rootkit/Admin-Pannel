import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { withRateLimit, sanitizeBody, safeErrorResponse } from '@/lib/security/middleware';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  email: z.string().email('Invalid email').transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(200, 'Password too long')
    .trim(),
});

/**
 * POST /api/auth/signup
 * Creates a new MongoDB user (password hashed by User model hook).
 */
async function POSTHandler(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const sanitizedBody = sanitizeBody(body);
    const validated = signupSchema.parse(sanitizedBody);

    await connectDB();

    const existing = await User.findOne({ email: validated.email });
    if (existing) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }

    const user = new User({
      name: validated.name,
      email: validated.email,
      password: validated.password, // hashed by pre-save hook
      // Safer default role for self-signup
      role: 'manager',
    });

    await user.save();

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }

    // Mongoose duplicate key error
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }

    return safeErrorResponse(error, 500);
  }
}

export const POST = withRateLimit(POSTHandler, { isWrite: true });

