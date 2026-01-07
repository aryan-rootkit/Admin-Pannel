# 🔧 Fix "bad auth: authentication failed" Error

## 🔍 Root Cause

The error "bad auth: authentication failed" is a **MongoDB authentication error**, not a NextAuth error. This happens when:

1. MongoDB credentials are incorrect
2. MongoDB user doesn't have proper permissions
3. IP address not whitelisted in MongoDB Atlas
4. Password encoding issue in connection string

## ✅ Solutions

### Option 1: Fix MongoDB Atlas Credentials

1. **Go to MongoDB Atlas Dashboard:**
   - https://cloud.mongodb.com/

2. **Check Database Access:**
   - Go to "Database Access"
   - Find user: `rootkitconsultancy_db_user`
   - Click "Edit" → Reset password if needed
   - Note the exact password

3. **Check Network Access:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Add your current IP or `0.0.0.0/0` (for development)

4. **Update .env.local:**
   ```env
   MONGODB_URI=mongodb+srv://rootkitconsultancy_db_user:YOUR_PASSWORD@cluster0.whr61tg.mongodb.net/admin-panel-rootkit?appName=Cluster0
   ```
   - Replace `YOUR_PASSWORD` with actual password
   - If password has `@`, encode it as `%40`
   - If password has other special chars, URL-encode them

### Option 2: Use Local MongoDB (No Atlas)

1. **Install MongoDB locally:**
   ```bash
   # macOS
   brew install mongodb-community
   brew services start mongodb-community
   ```

2. **Update .env.local:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/admin-panel-rootkit
   ```

### Option 3: Test Connection

Visit: http://localhost:3000/api/test-db

This will show:
- ✅ Connection successful
- ❌ Connection failed with detailed error and suggestions

## 🔄 After Fixing

1. **Restart server:**
   ```bash
   npm run stop && npm run dev
   ```

2. **Test creating records:**
   - Projects → New Project → Create
   - Revenue → New Record → Create
   - Team → New Member → Create
   - Clients → New Client → Create

3. **Should work now!** ✅

## 📝 Current MongoDB URI Format

Your current URI:
```
mongodb+srv://rootkitconsultancy_db_user:%40ryandubey45@cluster0.whr61tg.mongodb.net/admin-panel-rootkit?appName=Cluster0
```

This decodes to:
- Username: `rootkitconsultancy_db_user`
- Password: `@ryandubey45` (the %40 is @ encoded)

**If this password is wrong, update it in MongoDB Atlas and .env.local**
