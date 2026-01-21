# 🔧 Fix "bad auth: authentication failed" Error

> ⚠️ **SECURITY WARNING**: Never commit real MongoDB credentials to version control. Always use environment variables and placeholders in documentation.

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
   - Find your database user (e.g., `your-username`)
   - Click "Edit" → Reset password if needed
   - Note the exact password

3. **Check Network Access:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Add your current IP or `0.0.0.0/0` (for development only)

4. **Update .env.local:**
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/admin-panel-rootkit?appName=YourClusterName
   ```
   - Replace `your-username` with your actual MongoDB Atlas username
   - Replace `your-password` with your actual password
   - Replace `cluster0.xxxxx.mongodb.net` with your actual cluster hostname
   - Replace `YourClusterName` with your actual cluster name
   - If password has `@`, encode it as `%40`
   - If password has other special chars, URL-encode them:
     - `@` → `%40`
     - `#` → `%23`
     - `$` → `%24`
     - `%` → `%25`
     - `&` → `%26`
     - `/` → `%2F`
     - `?` → `%3F`
     - `=` → `%3D`

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

## 📝 MongoDB URI Format

Your connection string should follow this format:
```
mongodb+srv://username:password@cluster-hostname.mongodb.net/database-name?appName=ClusterName
```

**Example (DO NOT USE - Replace with YOUR credentials):**
```
mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/admin-panel-rootkit?appName=YourClusterName
```

**Password Encoding Example:**
If your password is `@mypassword123`, encode it as `%40mypassword123`:
```
mongodb+srv://your-username:%40mypassword123@cluster0.xxxxx.mongodb.net/admin-panel-rootkit?appName=YourClusterName
```

---

## 🔐 Security Best Practices

### ✅ DO:
- ✅ Store credentials in environment variables (`.env.local`)
- ✅ Use placeholders in documentation
- ✅ Rotate passwords regularly
- ✅ Use strong, unique passwords
- ✅ Restrict IP access in MongoDB Atlas (avoid `0.0.0.0/0` in production)
- ✅ Use different credentials for dev/staging/production

### ❌ DON'T:
- ❌ Commit real credentials to Git
- ❌ Share credentials in documentation or code
- ❌ Use the same password for multiple services
- ❌ Hardcode credentials in source code
- ❌ Allow unrestricted IP access in production

---

## 🚨 If Credentials Were Exposed

If you find that real credentials were committed to Git:

1. **Immediately rotate credentials:**
   - Go to MongoDB Atlas → Database Access
   - Edit user → Reset password
   - Save new password securely

2. **Update environment variables:**
   - Update `.env.local` with new credentials
   - Update Vercel environment variables if deployed

3. **Remove from Git history (if needed):**
   ```bash
   # Use git filter-branch or BFG Repo-Cleaner
   # Or create a new repository without sensitive data
   ```

4. **Review access logs:**
   - Check MongoDB Atlas → Activity Feed
   - Look for unauthorized access attempts

---

**Need Help?** Check the `/api/test-db` endpoint for detailed error messages and suggestions.
