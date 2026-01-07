# 🚀 Local Setup Guide

## Quick Start (3 Steps)

### Step 1: Set Up MongoDB

**Option A: MongoDB Atlas (Cloud - Recommended for Quick Start)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a free cluster
4. Click "Connect" → "Connect your application"
5. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
6. Update `.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://your-connection-string-here
   ```

**Option B: Local MongoDB**
```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Verify it's running
mongosh
```

### Step 2: Seed the Database

**Easy Way (via Browser):**
1. Start your dev server: `npm run dev`
2. Open: http://localhost:3000/api/seed
3. You should see: `{"success":true,"message":"Admin user created successfully!"}`

**Alternative (via Terminal):**
```bash
# Make sure .env.local exists first
node scripts/seed.js
```

### Step 3: Access the Admin Panel

1. **Start the server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open your browser**: http://localhost:3000

3. **Login with**:
   - Email: `admin@rootkit.dev`
   - Password: `admin123`

## ✅ Verification Checklist

- [ ] `.env.local` file exists with `NEXTAUTH_URL` and `NEXTAUTH_SECRET`
- [ ] MongoDB is running (local or Atlas)
- [ ] `MONGODB_URI` is set in `.env.local`
- [ ] Database is seeded (visit `/api/seed`)
- [ ] Dev server is running (`npm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Can login with admin credentials

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: 
- Check if MongoDB is running: `brew services list` (macOS)
- Verify `MONGODB_URI` in `.env.local`
- For Atlas: Check your IP is whitelisted and credentials are correct

### NextAuth Errors
- Make sure `.env.local` has `NEXTAUTH_SECRET` set
- Restart dev server after changing `.env.local`

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## 📝 Environment Variables

Your `.env.local` should have:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
MONGODB_URI=mongodb://localhost:27017/admin-panel-rootkit
```

## 🎉 You're All Set!

Once everything is working, you can:
- Manage projects
- Track revenue
- Manage team members
- View calendar
- Configure settings

Happy coding! 🚀
