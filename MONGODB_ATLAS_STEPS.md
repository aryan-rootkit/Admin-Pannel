# 🎯 MongoDB Atlas - What to Choose

## Current Step: "Choose a connection method"

### ✅ **CHOOSE THIS:** "Drivers" (under "Connect to your application")

**Why?**
- You're building a Next.js application
- You need the connection string for your code
- This gives you the MongoDB connection URI

---

## 📋 Step-by-Step Guide

### Step 1: Click "Drivers" 
- Look for the card with binary code icon (1011 over 1011)
- Click the right arrow or the card itself

### Step 2: Select Your Driver
- **Choose:** `Node.js`
- **Version:** Select the latest version (usually `5.5 or later`)

### Step 3: Copy Connection String
You'll see something like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Step 4: Replace Placeholders
1. Replace `<username>` with your database username
2. Replace `<password>` with your database password
3. Add your database name before the `?`:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/admin-panel-rootkit?retryWrites=true&w=majority
   ```

### Step 5: Update .env.local
Open your `.env.local` file and update:
```env
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/admin-panel-rootkit?retryWrites=true&w=majority
```

### Step 6: Enable Real Database Auth
Since you're now using MongoDB, update `.env.local`:
```env
USE_MOCK_AUTH=false
```

### Step 7: Restart Server
```bash
npm run stop
npm run dev
```

### Step 8: Seed Database
Visit: http://localhost:3000/api/seed

---

## ❌ Don't Choose These (for now)

- **Compass** - GUI tool (optional, for later)
- **Shell** - Command line (optional, for later)
- **MongoDB for VS Code** - VS Code extension (optional)
- **Atlas SQL** - SQL interface (not needed)

These are useful tools but not what you need right now for your Next.js app.

---

## 🔐 Important: Before Connecting

Make sure you've completed:

1. ✅ **Database Access** - Created a database user
   - Go to "Database Access" in left sidebar
   - Create username and password
   - Save these credentials!

2. ✅ **Network Access** - Whitelisted your IP
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (for development)
   - Or add your current IP address

---

## 🎯 Quick Checklist

- [ ] Clicked "Drivers"
- [ ] Selected "Node.js" driver
- [ ] Copied connection string
- [ ] Replaced `<username>` and `<password>`
- [ ] Added database name: `admin-panel-rootkit`
- [ ] Updated `.env.local` with full connection string
- [ ] Set `USE_MOCK_AUTH=false` in `.env.local`
- [ ] Restarted server
- [ ] Seeded database at `/api/seed`

---

## 💡 Pro Tip

**Keep the connection string safe!** It contains your password. Never commit it to Git.

Your `.env.local` file is already in `.gitignore`, so you're safe! ✅

---

Once you have the connection string, paste it into your `.env.local` file and you're all set! 🚀
