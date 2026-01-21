import mongoose from 'mongoose';

/**
 * MongoDB connection utility
 * Handles connection to MongoDB database with connection pooling
 * 
 * Uses environment variable MONGODB_URI if set, otherwise falls back to local MongoDB
 * for development purposes.
 */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/admin-panel-rootkit';

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