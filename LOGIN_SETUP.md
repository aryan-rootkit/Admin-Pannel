# 🔐 Rootkit Admin Panel - Login Setup

## ✅ Configuration Complete

### 1. Environment Variables (.env.local)
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=bu3KGUxQd5C5edSp/BMiGhnLULcE2+Hc8shSQVJZCrM=
USE_MOCK_AUTH=true
```

### 2. Mock Credentials
- **Email:** `admin@rootkit.com` or `admin@rootkit.dev`
- **Password:** `admin123`

### 3. Features
- ✅ JWT session strategy
- ✅ 30-day session duration
- ✅ No 401 errors (proper error handling)
- ✅ Event logging (sign in/out)
- ✅ Clean console (no debug spam)

## 🚀 Quick Start

```bash
# Start development server
npm run dev

# Visit login page
http://localhost:3000/login
```

## 🧪 Test Login

1. Go to: http://localhost:3000/login
2. Credentials are pre-filled:
   - Email: `admin@rootkit.com`
   - Password: `admin123`
3. Click "Sign in"
4. Should redirect to `/dashboard` instantly

## ✅ Expected Results

- ✅ No console errors
- ✅ No 401 Unauthorized errors
- ✅ Instant redirect to dashboard
- ✅ Session persists across page refreshes
- ✅ Server console shows: "✅ User signed in: admin@rootkit.com"

## 🔧 Troubleshooting

If login doesn't work:

1. **Check .env.local exists:**
   ```bash
   cat .env.local | grep NEXTAUTH
   ```

2. **Restart server:**
   ```bash
   npm run stop && npm run dev
   ```

3. **Clear browser cookies:**
   - Open DevTools (F12)
   - Application → Cookies → Clear all for localhost:3000

4. **Check server console:**
   - Should see "✅ User signed in: admin@rootkit.com"
   - No error messages

## 📝 Notes

- Mock authentication is enabled by default (no database required)
- To switch to real database auth, set `USE_MOCK_AUTH=false` in .env.local
- Session lasts 30 days by default
