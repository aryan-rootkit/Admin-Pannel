# 🗄️ MongoDB Setup Guide

## ⚠️ Current Issue: MongoDB Not Connected

Your login is failing because MongoDB is not running. Choose one option below:

---

## Option 1: MongoDB Atlas (Cloud - Recommended) ⭐

**Fastest way to get started - No installation needed!**

### Steps:

1. **Sign up for free account**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Create a free account (no credit card required)

2. **Create a free cluster**
   - Click "Build a Database"
   - Choose "M0 FREE" tier
   - Select a cloud provider and region (closest to you)
   - Click "Create"

3. **Set up database access**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (save these!)
   - Set privileges to "Atlas admin" or "Read and write to any database"
   - Click "Add User"

4. **Set up network access**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Or add your current IP address
   - Click "Confirm"

5. **Get connection string**
   - Go to "Database" → "Connect"
   - Click "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`)
   - Replace `<password>` with your database user password
   - Add database name: `?retryWrites=true&w=majority` → `admin-panel-rootkit?retryWrites=true&w=majority`

6. **Update .env.local**
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/admin-panel-rootkit?retryWrites=true&w=majority
   ```

7. **Restart server and seed database**
   ```bash
   npm run stop
   npm run dev
   # Then visit: http://localhost:3000/api/seed
   ```

---

## Option 2: Local MongoDB Installation (macOS)

### Install MongoDB:

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add MongoDB tap
brew tap mongodb/brew

# Install MongoDB
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify it's running
mongosh --eval "db.version()"
```

### If installation succeeds:
- MongoDB will start automatically
- Your `.env.local` already has: `MONGODB_URI=mongodb://localhost:27017/admin-panel-rootkit`
- Restart your server: `npm run stop && npm run dev`
- Seed database: Visit http://localhost:3000/api/seed

---

## ✅ Verification Steps

After setting up MongoDB (either option):

1. **Test connection:**
   - Visit: http://localhost:3000/api/auth/test
   - Should see: `{"success":true,"message":"MongoDB connected successfully"}`

2. **Seed database:**
   - Visit: http://localhost:3000/api/seed
   - Should see: `{"success":true,"message":"Admin user created successfully!"}`

3. **Test login:**
   - Go to: http://localhost:3000
   - Login with: `admin@rootkit.dev` / `admin123`
   - Should redirect to dashboard

---

## 🐛 Troubleshooting

### "ECONNREFUSED" Error
- **Atlas**: Check your IP is whitelisted in Network Access
- **Local**: Run `brew services start mongodb-community`

### "Authentication failed" Error
- **Atlas**: Verify username/password in connection string
- **Local**: MongoDB should work without auth by default

### Connection String Format
- **Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
- **Local**: `mongodb://localhost:27017/database`

---

## 🎯 Quick Start Command

**For MongoDB Atlas:**
1. Sign up → Create cluster → Get connection string
2. Update `.env.local` with connection string
3. `npm run dev` → Visit `/api/seed` → Login!

**For Local MongoDB:**
1. `brew install mongodb-community`
2. `brew services start mongodb-community`
3. `npm run dev` → Visit `/api/seed` → Login!

---

Once MongoDB is connected, your beautiful glass effect login page will work perfectly! 🎉
