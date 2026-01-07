# 🚀 Quick Launch Guide

## ✅ Everything is Fixed!

### New NPM Scripts Added:
- `npm run stop` - Stops the dev server
- `npm run clean` - Removes .next, node_modules, and reinstalls
- `npm run fresh` - Complete clean restart (stop + clean + dev)

## 🎯 Quick Start (3 Steps)

### Step 1: Stop Current Server (if running)
```bash
npm run stop
# OR press Ctrl+C in the terminal
```

### Step 2: Fresh Start
```bash
npm run fresh
```

This will:
- Stop any running servers
- Clean everything (.next, node_modules)
- Reinstall dependencies
- Start the dev server

### Step 3: Access Admin Panel
1. Wait for: `ready - started server on http://localhost:3000`
2. Open: http://localhost:3000
3. You'll be redirected to `/login` (if not authenticated)
4. Or `/dashboard` (if authenticated)

## 🔧 Manual Steps (Alternative)

If you prefer step-by-step:

```bash
# 1. Stop server
npm run stop

# 2. Clean install
npm run clean

# 3. Start dev server
npm run dev
```

## 📝 Before First Login

**Seed the database** (create admin user):
- Visit: http://localhost:3000/api/seed
- Or run: `node scripts/seed.js`

**Login credentials:**
- Email: `admin@rootkit.dev`
- Password: `admin123`

## ✅ Verification Checklist

- [ ] `.env.local` exists with `NEXTAUTH_SECRET` and `NEXTAUTH_URL`
- [ ] MongoDB is running (local or Atlas)
- [ ] Database is seeded (`/api/seed`)
- [ ] Server starts without errors
- [ ] Can access http://localhost:3000
- [ ] Login page loads correctly
- [ ] Can login with admin credentials

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
npm run stop
# OR
lsof -ti:3000 | xargs kill -9
```

### Environment Variables Not Loading
- Make sure `.env.local` is in project root
- Restart server after changing `.env.local`
- Check: http://localhost:3000/api/test-env

### MongoDB Connection Error
- Start MongoDB: `brew services start mongodb-community`
- Or use MongoDB Atlas (cloud)
- Update `MONGODB_URI` in `.env.local`

### NextAuth Configuration Error
- Verify `.env.local` has `NEXTAUTH_SECRET`
- Restart server after adding secret
- Check: http://localhost:3000/api/test-env

## 🎉 You're All Set!

Once everything is working:
- ✅ Dashboard loads
- ✅ Calendar works
- ✅ Projects CRUD works
- ✅ Revenue tracking works
- ✅ Team management works
- ✅ Settings configurable

Happy coding! 🚀
