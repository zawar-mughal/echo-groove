# 🚀 Quick Start Guide

Your backend is **LIVE**! Here's how to get started in 5 minutes.

## ✅ What's Already Done

- ✅ Database created with 13 tables
- ✅ All triggers and functions deployed
- ✅ Row Level Security configured
- ✅ Environment variables set
- ✅ Authentication system integrated

## 🏁 Start Using Your App (5 Steps)

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Open Your App
Navigate to: **http://localhost:5173**

### 3. Create Your Account
1. Click **"Sign In"** button (top right)
2. Click **"Sign up"** at the bottom
3. Enter:
   - **Email**: your@email.com
   - **Password**: (min 6 characters)
   - **Username**: admin
4. Click **"Sign Up"**

✨ Your profile is automatically created!

### 4. Make Yourself Admin

**Get your User ID:**
1. Go to: https://supabase.com/dashboard/project/jmrzmlrdyrpipqikedfk/auth/users
2. Click on your user
3. Copy the **UID**

**Run this SQL:**
1. Go to: https://supabase.com/dashboard/project/jmrzmlrdyrpipqikedfk/sql/new
2. Paste:
```sql
UPDATE profiles
SET is_admin = true
WHERE id = 'YOUR-USER-ID-HERE';  -- Paste your UID here
```
3. Click **RUN**

### 5. Refresh & You're Done! 🎉

Refresh your app - you now have admin access!

## 🎯 What to Test

### Create a Room
1. Click your avatar → **"Create Room"**
2. Fill in the form
3. Submit!

### Create a Season
1. Go to **Admin Panel**
2. Select your room
3. **Create Season**
4. Set dates and media type

### Submit a Track
1. Navigate to your room
2. Click **"Upload"** or paste a track URL
3. Submit!

### Boost Tracks
Click the 🔥 button on any submission to boost it!

## 📊 View Your Data

Check your Supabase dashboard to see data flowing in:
- **Tables**: https://supabase.com/dashboard/project/jmrzmlrdyrpipqikedfk/editor
- **Users**: https://supabase.com/dashboard/project/jmrzmlrdyrpipqikedfk/auth/users

## 🆘 Issues?

### "Missing environment variables"
```bash
# Make sure .env exists
cat .env

# Should show:
# VITE_SUPABASE_URL=https://jmrzmlrdyrpipqikedfk.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...

# Restart dev server
npm run dev
```

### Sign up not working
- Check browser console (F12)
- Verify you're using a valid email
- Password must be 6+ characters

### Not seeing admin features
- Make sure you ran the `UPDATE profiles` SQL
- Refresh the page
- Sign out and sign back in

---

**That's it! You're ready to build! 🚀**
