# 🔍 Login Debugging Steps

## If Login Still Doesn't Work:

1. **Check Browser Console (F12):**
   - Look for any JavaScript errors
   - Check Network tab → look for `/api/auth/[...nextauth]` request
   - See if request returns 200 or error

2. **Check Server Logs:**
   - Look at terminal where `npm run dev` is running
   - Check for any error messages
   - Look for MongoDB connection errors

3. **Test Credentials:**
   - Email: `admin@rootkit.dev`
   - Password: `admin123`
   - Both should be pre-filled

4. **Clear Browser Data:**
   - Clear cookies for localhost:3000
   - Clear localStorage
   - Try in incognito/private window

5. **Check .env.local:**
   ```bash
   cat .env.local | grep NEXTAUTH
   ```
   Should show:
   - NEXTAUTH_URL=http://localhost:3000
   - NEXTAUTH_SECRET=... (some value)

6. **Manual Test:**
   - Open browser console
   - Type: `fetch('/api/auth/session').then(r => r.json()).then(console.log)`
   - Should show session data after login

