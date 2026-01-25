import mongoose from 'mongoose';

/**
 * MongoDB connection utility
 * Handles connection to MongoDB database with connection pooling
 */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/admin-panel-rootkit';

// Validate MongoDB URI format (security check) - only if URI is provided
if (process.env.MONGODB_URI && !process.env.MONGODB_URI.match(/^mongodb(\+srv)?:\/\//)) {
  throw new Error('Invalid MONGODB_URI format. Must start with mongodb:// or mongodb+srv://');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global cache to prevent multiple connections in development
declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  // If already connected, return existing connection
  if (cached.conn) {
    return cached.conn;
  }

  // If connection is in progress, wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      // Security: Force TLS for MongoDB Atlas connections
      ...(MONGODB_URI.includes('mongodb+srv://') && {
        tls: true,
        tlsAllowInvalidCertificates: false,
      }),
      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 1,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully');
        return mongoose;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection error:', error.message);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    // Provide more helpful error message
    if (e.message?.includes('authentication failed') || e.message?.includes('bad auth')) {
      throw new Error('MongoDB authentication failed. Please check your MONGODB_URI credentials in .env.local');
    }
    throw e;
  }

  return cached.conn;
}

export default connectDB;
