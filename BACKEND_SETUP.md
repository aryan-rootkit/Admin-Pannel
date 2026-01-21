# Backend MongoDB Integration - Quick Reference

## ✅ What's Been Done

1. **Authentication Updated**: Now uses MongoDB by default (was using mock auth)
2. **API Routes**: All routes configured to use MongoDB with localStorage fallback
3. **Models**: All Mongoose models ready (User, Client, Project, Revenue, Team, Event, Settings)
4. **Connection Utility**: MongoDB connection handler with caching
5. **Seed Script**: API endpoint and CLI script to create initial admin user

## 🚀 Quick Setup (3 Steps)

### 1. Get MongoDB Connection String

**MongoDB Atlas (Recommended)**:
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free M0 cluster
3. Create database user
4. Whitelist IP (0.0.0.0/0 for development)
5. Get connection string from "Connect" → "Connect your application"

**Format**: `mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority`

### 2. Set Environment Variables

**Local (.env.local)**:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/admin-panel-rootkit?retryWrites=true&w=majority
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
USE_MOCK_AUTH=false
```

**Vercel**:
- Go to Settings → Environment Variables
- Add all variables above
- Set `NEXTAUTH_URL` to your Vercel domain for Production

### 3. Seed Database

**Option A: API Endpoint** (After deployment):
```
POST https://your-domain.vercel.app/api/seed
```

**Option B: CLI** (Local):
```bash
npm run seed
```

**Option C: Visit URL** (Local):
```
http://localhost:3000/api/seed
```

## 📋 Default Admin Credentials

After seeding:
- **Email**: `admin@rootkit.dev`
- **Password**: `admin123`

## 🧪 Test Connection

Visit: `http://localhost:3000/api/test-db`

Should return:
```json
{
  "success": true,
  "message": "✅ MongoDB connection successful!",
  "timestamp": "2025-01-21T..."
}
```

## 🔄 Switching Between MongoDB and Mock Mode

**Use MongoDB** (Default):
```env
USE_MOCK_AUTH=false
```

**Use Mock Auth** (No database needed):
```env
USE_MOCK_AUTH=true
```

## 📊 Database Collections

Your MongoDB will have:
- `users` - Admin users
- `clients` - Client records
- `projects` - Project records
- `revenue` - Revenue/expenses/invoices
- `teams` - Team members
- `events` - Calendar events
- `settings` - App settings

## 🛠️ API Routes (All MongoDB-Enabled)

- `GET/POST /api/clients` - Client management
- `GET/POST /api/projects` - Project management
- `GET/POST /api/revenue` - Revenue tracking
- `GET/POST /api/team` - Team management
- `GET/POST /api/events` - Calendar events
- `GET/POST /api/settings` - App settings
- `GET /api/test-db` - Test MongoDB connection
- `GET /api/seed` - Seed initial admin user

## 🐛 Common Issues

**Connection Timeout**:
- Check IP whitelist in MongoDB Atlas
- Verify connection string

**Authentication Failed**:
- URL-encode special characters in password (@ = %40)
- Verify database user exists

**Module Not Found**:
```bash
npm install mongoose
```

## 📚 Full Documentation

See `MONGODB_SETUP_COMPLETE.md` for detailed setup instructions.

---

**Status**: ✅ Backend fully integrated with MongoDB
**Next**: Set up MongoDB Atlas and add connection string to environment variables
