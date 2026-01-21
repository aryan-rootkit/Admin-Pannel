# 🚀 Vercel MongoDB Setup Guide

> ⚠️ **SECURITY WARNING**: Never commit real MongoDB credentials to version control. Always use environment variables and placeholders in documentation.

## 📋 Step-by-Step Guide

### Step 1: Get Your MongoDB Connection String

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to your cluster → Click **"Connect"**
3. Choose **"Connect your application"**
4. Copy the connection string (it will look like this):
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Step 2: Format Your Connection String

Replace the placeholders:
- `<username>` → Your MongoDB Atlas database username
- `<password>` → Your MongoDB Atlas database password (URL-encode special characters)
- Add your database name before the `?`:
```
mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/admin-panel-rootkit?retryWrites=true&w=majority&appName=YourClusterName
```

**Example (DO NOT USE THIS - IT'S A PLACEHOLDER):**
```
mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/admin-panel-rootkit?retryWrites=true&w=majority&appName=YourClusterName
```

### Step 3: Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

| Variable Name | Example Value (Replace with YOUR values) | Environments |
|---------------|------------------------------------------|--------------|
| `MONGODB_URI` | `mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/admin-panel-rootkit?retryWrites=true&w=majority&appName=YourClusterName` | **Production, Preview, Development** |
| `NEXTAUTH_SECRET` | `your-generated-secret-key-here` | **Production, Preview, Development** |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | **Production** |
| `USE_MOCK_AUTH` | `false` | **Production, Preview, Development** |

### Step 4: Generate NEXTAUTH_SECRET

Run this command in your terminal:
```bash
openssl rand -base64 32
```

Copy the output and paste it as the `NEXTAUTH_SECRET` value in Vercel.

### Step 5: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger automatic deployment

---

## 🔐 Security Best Practices

### ✅ DO:
- ✅ Use environment variables for all credentials
- ✅ Use placeholders in documentation
- ✅ Rotate passwords regularly
- ✅ Use strong, unique passwords
- ✅ Restrict IP access in MongoDB Atlas
- ✅ Use different credentials for dev/staging/production

### ❌ DON'T:
- ❌ Commit real credentials to Git
- ❌ Share credentials in documentation
- ❌ Use the same password for multiple services
- ❌ Allow access from `0.0.0.0/0` in production
- ❌ Hardcode credentials in source code

---

## 🧪 Testing Your Setup

### Test MongoDB Connection

Visit: `https://your-domain.vercel.app/api/test-db`

**Expected Response:**
```json
{
  "success": true,
  "message": "✅ MongoDB connection successful!"
}
```

### Test Authentication

1. Visit: `https://your-domain.vercel.app/login`
2. Use credentials:
   - Email: `admin@rootkit.dev`
   - Password: `admin123`
3. If login fails, seed the database first (see below)

### Seed Database (Create Admin User)

Visit: `https://your-domain.vercel.app/api/seed`

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin user created successfully!",
  "email": "admin@rootkit.dev",
  "password": "admin123"
}
```

---

## 🐛 Troubleshooting

### Issue 1: "MONGODB_URI not found"

**Symptom**: API returns error about missing connection string

**Solution**:
1. Go to Vercel → Settings → Environment Variables
2. Verify `MONGODB_URI` is added
3. Check that it's enabled for the correct environment (Production/Preview/Development)
4. Redeploy your project

### Issue 2: "MongoDB authentication failed"

**Symptom**: Connection string exists but authentication fails

**Possible Causes**:
1. **Wrong username/password**: Double-check credentials in MongoDB Atlas
2. **Password encoding**: Special characters need URL encoding
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
   - `&` → `%26`
   - `/` → `%2F`
   - `?` → `%3F`
   - `=` → `%3D`
3. **User doesn't exist**: Create user in MongoDB Atlas → Database Access
4. **IP not whitelisted**: Add your IP in MongoDB Atlas → Network Access

**Solution**:
1. Go to MongoDB Atlas → Database Access
2. Verify username: `your-username`
3. Reset password if needed
4. Update `MONGODB_URI` in Vercel with correct credentials
5. Redeploy

### Issue 3: "Connection timeout"

**Symptom**: Request hangs or times out

**Possible Causes**:
1. IP address not whitelisted
2. Cluster is paused (free tier)
3. Network issues

**Solution**:
1. Go to MongoDB Atlas → Network Access
2. Add IP address: `0.0.0.0/0` (for development) or your specific IP
3. Check cluster status (should be running, not paused)
4. Wait 1-2 minutes after whitelisting IP
5. Retry connection

### Issue 4: "NEXTAUTH_SECRET not set"

**Symptom**: Login fails with "Server error"

**Solution**:
1. Generate secret: `openssl rand -base64 32`
2. Add to Vercel → Environment Variables → `NEXTAUTH_SECRET`
3. Redeploy

---

## 📊 Debugging Information

The `/api/test-db` endpoint provides detailed debugging info:

- `hasMongoUri: true/false` - Environment variable check
- `isVercel: true/false` - Deployment platform check
- `nodeEnv: production/preview/development` - Environment type
- Detailed error messages with suggestions

---

## ✅ Verification Checklist

Before deploying, verify:

- [ ] MongoDB Atlas cluster is running
- [ ] Database user created in MongoDB Atlas
- [ ] IP address whitelisted in MongoDB Atlas
- [ ] Connection string formatted correctly
- [ ] Vercel → Environment Variables → `MONGODB_URI` added
- [ ] Vercel → Environment Variables → `NEXTAUTH_SECRET` added
- [ ] Vercel → Environment Variables → `NEXTAUTH_URL` added (Production)
- [ ] Vercel → Environment Variables → `USE_MOCK_AUTH` set to `false`
- [ ] Project redeployed after adding variables
- [ ] `/api/test-db` returns success
- [ ] `/api/seed` creates admin user
- [ ] Can login with admin credentials

---

## 🔄 Updating Credentials

If you need to update MongoDB credentials:

1. **Update in MongoDB Atlas:**
   - Go to Database Access
   - Edit user → Reset password
   - Save new password

2. **Update in Vercel:**
   - Go to Environment Variables
   - Edit `MONGODB_URI`
   - Replace password in connection string
   - URL-encode special characters if needed

3. **Redeploy:**
   - Redeploy your project
   - Test connection at `/api/test-db`

---

## 📝 Example .env.local (Local Development)

For local development, create `.env.local`:

```env
# MongoDB Connection (Replace with YOUR credentials)
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/admin-panel-rootkit?retryWrites=true&w=majority&appName=YourClusterName

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-key-here

# Use MongoDB for authentication
USE_MOCK_AUTH=false
```

**⚠️ IMPORTANT**: Never commit `.env.local` to Git. It's already in `.gitignore`.

---

## 🚨 Security Reminder

**If you find real credentials in this repository:**
1. Immediately rotate/change those credentials in MongoDB Atlas
2. Remove credentials from Git history (if already committed)
3. Update all environment variables with new credentials
4. Review access logs in MongoDB Atlas

---

**Need Help?** Check the `/api/test-db` endpoint for detailed error messages and suggestions.
