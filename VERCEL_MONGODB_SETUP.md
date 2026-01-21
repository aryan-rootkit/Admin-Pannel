# 🚀 Vercel + MongoDB Setup - Complete Guide

## ✅ Quick Setup (3 Steps)

### Step 1: Get Your MongoDB Connection String

Your MongoDB URI (from `.env.local`):
```
mongodb+srv://aryandubey:s5S5iWRtI7Y0KLMc@aryanpracticecluster0.knpbvil.mongodb.net/admin-panel-rootkit?retryWrites=true&w=majority&appName=AryanPracticeCluster0
```

### Step 2: Add to Vercel Environment Variables

1. **Go to Vercel Dashboard**: https://vercel.com
2. **Select your project**: `Admin-Pannel-Rootkit`
3. **Go to**: Settings → Environment Variables
4. **Click**: "Add New"
5. **Add these variables**:

| Name | Value | Environment |
|------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://aryandubey:s5S5iWRtI7Y0KLMc@aryanpracticecluster0.knpbvil.mongodb.net/admin-panel-rootkit?retryWrites=true&w=majority&appName=AryanPracticeCluster0` | **Production, Preview, Development** |
| `NEXTAUTH_SECRET` | `bu3KGUxQd5C5edSp/BMiGhnLULcE2+Hc8shSQVJZCrM=` | **Production, Preview, Development** |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | **Production** |
| `NEXTAUTH_URL` | `http://localhost:3000` | **Development** |
| `USE_MOCK_AUTH` | `false` | **Production, Preview, Development** |

6. **Click**: "Save"
7. **Redeploy**: Go to Deployments → Click "..." → "Redeploy"

### Step 3: Verify MongoDB Atlas Network Access

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com
2. **Network Access** → Click "Add IP Address"
3. **Add**: `0.0.0.0/0` (Allow access from anywhere - required for Vercel)
4. **Click**: "Confirm"

**Why?** Vercel uses serverless functions that run from different IP addresses. You need to allow all IPs.

---

## 🔍 Verify Connection

### Test 1: Check Environment Variables

After redeploying, visit:
```
https://your-domain.vercel.app/api/test-db
```

Should return:
```json
{
  "success": true,
  "message": "✅ MongoDB connection successful!",
  "timestamp": "..."
}
```

### Test 2: Check API Routes

Visit:
- `https://your-domain.vercel.app/api/clients`
- `https://your-domain.vercel.app/api/team`
- `https://your-domain.vercel.app/api/projects`

Should return JSON data (not errors).

---

## 🐛 Common Issues & Fixes

### Issue 1: "MONGODB_URI not found"

**Symptom**: API returns error about missing connection string

**Fix**:
1. Check Vercel Environment Variables are set
2. Make sure you selected **all environments** (Production, Preview, Development)
3. **Redeploy** after adding variables

### Issue 2: "MongoDB connection timeout"

**Symptom**: Connection fails on Vercel but works locally

**Fix**:
1. Go to MongoDB Atlas → **Network Access**
2. Add IP: `0.0.0.0/0` (Allow all)
3. Wait 2-3 minutes for changes to propagate
4. Redeploy on Vercel

### Issue 3: "Authentication failed"

**Symptom**: Wrong username/password error

**Fix**:
1. Check MongoDB Atlas → **Database Access**
2. Verify username: `aryandubey`
3. Verify password is correct
4. Make sure user has **Read and Write** permissions

### Issue 4: "Database not found"

**Symptom**: Connection works but can't find database

**Fix**:
1. Verify database name in connection string: `admin-panel-rootkit`
2. Check MongoDB Atlas → **Browse Collections** → Database exists
3. If database doesn't exist, it will be created automatically on first save

---

## 📊 Debugging in Vercel

### Check Vercel Logs

1. Go to Vercel Dashboard → Your Project
2. Click **"Functions"** tab
3. Click on any API route (e.g., `/api/clients`)
4. View **"Logs"** to see errors

### Add Debug Logging

The code already includes logging. Check logs for:
- `✅ MongoDB connected successfully` - Connection works
- `❌ MongoDB connection error` - Connection failed
- `MONGODB_URI exists: true/false` - Environment variable check

---

## ✅ Checklist

Before deploying, verify:

- [ ] MongoDB Atlas → Network Access → `0.0.0.0/0` added
- [ ] MongoDB Atlas → Database Access → User has Read/Write permissions
- [ ] Vercel → Environment Variables → `MONGODB_URI` added
- [ ] Vercel → Environment Variables → `NEXTAUTH_SECRET` added
- [ ] Vercel → Environment Variables → `NEXTAUTH_URL` added (Production)
- [ ] Vercel → Environment Variables → All set for **Production, Preview, Development**
- [ ] Vercel → Redeployed after adding variables
- [ ] Test: `https://your-domain.vercel.app/api/test-db` returns success

---

## 🎯 Quick Test Commands

After deploying, test these URLs:

```bash
# Test MongoDB connection
curl https://your-domain.vercel.app/api/test-db

# Test clients API
curl https://your-domain.vercel.app/api/clients

# Test team API
curl https://your-domain.vercel.app/api/team

# Test projects API
curl https://your-domain.vercel.app/api/projects
```

All should return JSON data, not errors!

---

## 🚀 After Setup

Once environment variables are added:

1. ✅ **Forms will save to MongoDB** on Vercel
2. ✅ **Data persists** across deployments
3. ✅ **Same database** as local development
4. ✅ **No localStorage** - everything in MongoDB

---

## 📝 Your Connection String

**For Vercel Environment Variable**:
```
MONGODB_URI=mongodb+srv://aryandubey:s5S5iWRtI7Y0KLMc@aryanpracticecluster0.knpbvil.mongodb.net/admin-panel-rootkit?retryWrites=true&w=majority&appName=AryanPracticeCluster0
```

**Copy this entire string** (including `mongodb+srv://` and everything after) into Vercel's `MONGODB_URI` environment variable.

---

**Status**: Ready to deploy! ✅
