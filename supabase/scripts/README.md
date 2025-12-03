# Supabase SQL Scripts

This directory contains utility SQL scripts for managing the Echo Groove Battle database.

## Scripts

### 1. `seed_phonk_monsta.sql`
**Purpose:** Create the "Phonk Monsta" test room with an active season

**What it does:**
- Creates a room titled "Phonk Monsta" with slug `phonk-monsta`
- Creates an active season titled "Season 1: The Awakening"
- Season runs for 30 days from creation
- Allows up to 3 submissions per user

**How to use:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire script
3. Click **RUN**
4. Verify the room and season were created using the SELECT queries at the end

---

### 2. `clear_users.sql`
**Purpose:** Clear all users and their data from the database

**⚠️ WARNING:** This script deletes ALL user data! Use only for testing/development.

**What it does:**
- Deletes all boosts
- Deletes all submissions
- Deletes all profiles
- Provides instructions for deleting auth.users

**How to use:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire script
3. Review the warnings
4. Click **RUN**
5. Manually delete auth.users from Authentication → Users panel

**After running:**
- All user data will be cleared
- You can sign up for a fresh account
- Use `make_user_admin.sql` to grant admin privileges

---

### 3. `make_user_admin.sql`
**Purpose:** Grant admin privileges to a user and make them moderator of Phonk Monsta

**What it does:**
- Sets `is_admin = true` for the specified user
- Adds user as moderator of Phonk Monsta room
- Sets user as creator of Phonk Monsta room

**How to use:**
1. Sign up for a new account (if needed)
2. Note the email address you used
3. Open Supabase Dashboard → SQL Editor
4. Copy the script
5. **Replace `'USER_EMAIL_HERE'`** with the actual email (keep the quotes!)
6. Click **RUN**
7. Verify admin status using the SELECT queries at the end

**Example:**
```sql
-- Change this line:
WHERE email = 'USER_EMAIL_HERE'

-- To this (with your email):
WHERE email = 'sean@example.com'
```

---

## Testing Workflow

Follow this sequence to set up a clean test environment:

### Step 1: Clear existing users
```bash
# Run clear_users.sql in Supabase SQL Editor
# Then manually delete users from Authentication panel
```

### Step 2: Create test room
```bash
# Run seed_phonk_monsta.sql in Supabase SQL Editor
```

### Step 3: Sign up for new account
1. Go to http://localhost:8080/
2. Click "Sign In"
3. Create a new account with your test email

### Step 4: Make yourself admin
```bash
# Run make_user_admin.sql in Supabase SQL Editor
# Remember to replace 'USER_EMAIL_HERE' with your email!
```

### Step 5: Verify
1. Refresh the app
2. You should now see the Admin link in navigation
3. Visit Admin panel to see Phonk Monsta room
4. Visit Home page to see Phonk Monsta in room list

---

## Notes

- All scripts include verification queries at the end
- Scripts are idempotent where possible (using `ON CONFLICT` clauses)
- Always test in development before running in production
- Keep backups before running destructive operations

---

## Support

If you encounter issues:
1. Check Supabase logs for error messages
2. Verify RLS policies are correctly set up
3. Ensure migrations have been applied
4. Check that you're using the correct email/UUID
