/**
 * Seed script to create initial admin user
 * Run with: node scripts/seed.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/admin-panel-rootkit';

// Import User model (we'll need to require it differently)
async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Dynamically import User model
    const User = (await import('../models/User.js')).default;
    
    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: 'admin@rootkit.dev' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@rootkit.dev',
      password: 'admin123', // Will be hashed by pre-save hook
      role: 'admin',
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@rootkit.dev');
    console.log('🔑 Password: admin123');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 MongoDB is not running. Please:');
      console.error('   1. Install MongoDB: brew install mongodb-community');
      console.error('   2. Start MongoDB: brew services start mongodb-community');
      console.error('   OR use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas');
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

seed();
