# 🔐 Login Fix - Complete Guide

## ✅ Issue Fixed!

**Problem**: Login form had wrong default email
- Form defaulted to: `admin@rootkit.com`
- Actual user email: `admin@rootkit.dev`

**Fixed**: Updated login form to use correct email

---

## 🔑 Login Credentials

### Default Admin User (MongoDB)

- **Email**: `admin@rootkit.dev`
- **Password**: `admin123`

### Mock Auth (if USE_MOCK_AUTH=true)

- **Email**: `admin@rootkit.dev` OR `admin@rootkit.com`
- **Password**: `admin123`

---

## 🧪 Test Login

### Step 1: Verify Admin User Exists

Visit: `http://localhost:3000/api/seed`

Should return:
```json
{
  "message": "Admin user already exists",
  "email": "admin@rootkit.dev",
  "password": "admin123"
}
```

### Step 2: Try Logging In

1. Go to: `http://localhost:3000/login`
2. **Email**: `admin@rootkit.dev`
3. **Password**: `admin123`
4. Click "Sign In"

---

## 🐛 Common Login Issues

### Issue 1: "Invalid email or password"

**Causes**:
- Wrong email (use `admin@rootkit.dev`, not `.com`)
- Wrong password
- User doesn't exist in MongoDB

**Fix**:
1. Verify user exists: Visit `/api/seed`
2. Use correct email: `admin@rootkit.dev`
3. Use correct password: `admin123`

### Issue 2: "User not found"

**Cause**: Admin user not created in MongoDB

**Fix**:
1. Visit: `http://localhost:3000/api/seed`
2. Should create admin user automatically
3. Try logging in again

### Issue 3: "MongoDB connection failed"

**Cause**: Can't connect to MongoDB

**Fix**:
1. Check `.env.local` has `MONGODB_URI`
2. Test connection: Visit `/api/test-db`
3. Should return success message

### Issue 4: Session not persisting

**Cause**: NEXTAUTH_SECRET missing

**Fix**:
1. Check `.env.local` has `NEXTAUTH_SECRET`
2. Restart dev server after adding
3. Clear browser cookies and try again

---

## 🔄 Create New Admin User

If you need to create a new admin user:

### Option 1: Via API (Recommended)

Visit: `http://localhost:3000/api/seed`

### Option 2: Via MongoDB Atlas

1. Go to MongoDB Atlas → Browse Collections
2. Select `users` collection
3. Click "Insert Document"
4. Add:
```json
{
  "name": "Admin User",
  "email": "admin@rootkit.dev",
  "password": "admin123",
  "role": "admin"
}
```

**Note**: Password will be automatically hashed by Mongoose pre-save hook.

---

## ✅ Verification Checklist

- [ ] Admin user exists (`/api/seed` returns success)
- [ ] MongoDB connection works (`/api/test-db` returns success)
- [ ] NEXTAUTH_SECRET is set in `.env.local`
- [ ] Using correct email: `admin@rootkit.dev`
- [ ] Using correct password: `admin123`
- [ ] Dev server is running (`npm run dev`)

---

## 🎯 Quick Fix Summary

**What was wrong**: Login form had `admin@rootkit.com` but user is `admin@rootkit.dev`

**What I fixed**: Updated login form default email to `admin@rootkit.dev`

**Try now**: 
1. Refresh login page
2. Use: `admin@rootkit.dev` / `admin123`
3. Should work! ✅

---

**Status**: ✅ **FIXED - Login should work now!**
