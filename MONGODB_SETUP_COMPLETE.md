# MongoDB Setup Guide - Complete Backend Integration

This guide will help you connect your Admin Panel to MongoDB Atlas (cloud database) or a local MongoDB instance.

## 🚀 Quick Start (MongoDB Atlas - Recommended)

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account (M0 cluster is free forever)
3. Verify your email

### Step 2: Create a Cluster

1. After logging in, click **"Build a Database"**
2. Choose **"M0 FREE"** (Free tier)
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region closest to you
5. Click **"Create"** (takes 3-5 minutes)

### Step 3: Create Database User

1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a username (e.g., `admin`)
5. Generate a secure password (click "Autogenerate Secure Password" or create your own)
6. **IMPORTANT**: Copy and save the password - you won't see it again!
7. Set user privileges to **"Atlas Admin"** (or "Read and write to any database")
8. Click **"Add User"**

### Step 4: Whitelist IP Addresses

1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. For development: Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - ⚠️ **Security Note**: For production, add only specific IPs
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go to **"Database"** → Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Select **"Node.js"** and version **"5.5 or later"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` with your database username
6. Replace `<password>` with your database password
   - ⚠️ **Important**: If your password contains special characters, URL-encode them:
     - `@` → `%40`
     - `#` → `%23`
     - `$` → `%24`
     - `%` → `%25`
     - `&` → `%26`
     - `/` → `%2F`
     - `?` → `%3F`
     - `=` → `%3D`

### Step 6: Add Database Name to Connection String

Add your database name before the `?` in the connection string:

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/admin-panel-rootkit?retryWrites=true&w=majority
```

### Step 7: Set Environment Variables

#### For Local Development (.env.local)

Create or update `.env.local` in your project root:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/admin-panel-rootkit?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# Optional: Use mock auth (set to 'true' to disable MongoDB auth)
USE_MOCK_AUTH=false
```

#### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

| Name | Value | Environment |
|------|-------|-------------|
| `MONGODB_URI` | Your MongoDB Atlas connection string | All (Production, Preview, Development) |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Production |
| `NEXTAUTH_URL` | `http://localhost:3000` | Development |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` | All |
| `USE_MOCK_AUTH` | `false` | All |

### Step 8: Test Connection

1. **Local Test**: Visit `http://localhost:3000/api/test-db`
   - Should return: `{"success": true, "message": "✅ MongoDB connection successful!"}`

2. **Seed Database**: Create initial admin user
   ```bash
   # Option 1: Using npm script
   npm run seed
   
   # Option 2: Using API endpoint (after deployment)
   POST https://your-domain.vercel.app/api/seed
   ```

### Step 9: Login

- **Email**: `admin@rootkit.dev`
- **Password**: `admin123`

---

## 🔧 Local MongoDB Setup (Alternative)

If you prefer to run MongoDB locally:

### Install MongoDB

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Windows:**
Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Update .env.local

```env
MONGODB_URI=mongodb://localhost:27017/admin-panel-rootkit
```

---

## 📊 Database Models

Your MongoDB database will contain these collections:

- **users** - Admin users and authentication
- **clients** - Client information
- **projects** - Project details and assignments
- **revenue** - Revenue, expenses, and invoices
- **teams** - Team member information
- **events** - Calendar events and deadlines
- **settings** - Application settings

---

## 🛠️ Backend API Routes

All API routes are configured to use MongoDB. They automatically fall back to localStorage if:
- `USE_MOCK_AUTH=true` is set
- MongoDB connection fails

### Available API Endpoints

- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create client
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `GET /api/revenue` - Get revenue records
- `POST /api/revenue` - Create revenue record
- `GET /api/team` - Get team members
- `POST /api/team` - Create team member
- `GET /api/events` - Get calendar events
- `POST /api/events` - Create event
- `GET /api/test-db` - Test MongoDB connection
- `POST /api/seed` - Seed database with initial data

---

## 🔐 Authentication

The app uses **NextAuth.js** with MongoDB:

1. **MongoDB Mode** (Default): Users stored in MongoDB `users` collection
2. **Mock Mode**: Hardcoded credentials (for testing)
   - Set `USE_MOCK_AUTH=true` in `.env.local`

### Create Additional Users

You can create users programmatically:

```typescript
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

await connectDB();
const user = new User({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securepassword123',
  role: 'admin',
});
await user.save();
```

---

## 🐛 Troubleshooting

### Connection Timeout

**Error**: `MongoDB connection timeout`

**Solutions**:
1. Check MongoDB Atlas IP whitelist includes your IP
2. Verify connection string is correct
3. Check if cluster is running (MongoDB Atlas dashboard)

### Authentication Failed

**Error**: `MongoDB authentication failed`

**Solutions**:
1. Verify username and password in connection string
2. URL-encode special characters in password
3. Check database user has proper permissions
4. Verify user exists in Database Access

### Module Not Found

**Error**: `Cannot find module 'mongoose'`

**Solution**:
```bash
npm install mongoose
```

### Environment Variables Not Loading

**Solution**:
1. Restart development server after adding `.env.local`
2. In Vercel, redeploy after adding environment variables
3. Verify variable names match exactly (case-sensitive)

---

## ✅ Verification Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP address whitelisted
- [ ] Connection string copied and configured
- [ ] Environment variables set (local and Vercel)
- [ ] Connection test successful (`/api/test-db`)
- [ ] Database seeded (`/api/seed`)
- [ ] Can login with admin credentials
- [ ] Data persists (create a client/project and refresh)

---

## 🚀 Next Steps

1. **Seed Initial Data**: Run seed script to create admin user
2. **Test CRUD Operations**: Create, read, update, delete clients/projects
3. **Monitor**: Check MongoDB Atlas dashboard for data
4. **Backup**: Set up automated backups in MongoDB Atlas

---

## 📚 Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Connection String Troubleshooting](https://docs.atlas.mongodb.com/troubleshoot-connection/)

---

**Need Help?** Check the `/api/test-db` endpoint for detailed error messages and suggestions.
