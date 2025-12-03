# Database Setup Required

## Issue: Blank Home Page

If you're seeing a blank page, it's because the database migrations haven't been applied yet.

## Quick Fix

You need to apply the database migrations to create all the necessary tables in Supabase.

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: jmrzmlrdyrpipqikedfk
3. **Go to SQL Editor** (left sidebar)
4. **Run each migration in order**:

#### Migration 1: Initial Schema
```bash
# Copy and paste the contents of:
supabase/migrations/20250101000000_initial_schema.sql
# Then click RUN
```

#### Migration 2: Triggers and Functions
```bash
# Copy and paste the contents of:
supabase/migrations/20250101000001_triggers_and_functions.sql
# Then click RUN
```

#### Migration 3: RLS Policies
```bash
# Copy and paste the contents of:
supabase/migrations/20250101000002_rls_policies.sql
# Then click RUN
```

#### Migration 4: Audius Integration
```bash
# Copy and paste the contents of:
supabase/migrations/20250102000000_audius_integration.sql
# Then click RUN
```

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your project
supabase link --project-ref jmrzmlrdyrpipqikedfk

# Push migrations to database
supabase db push
```

## Verification

After running the migrations, verify tables were created:

### Check in Supabase Dashboard

1. Go to **Table Editor** (left sidebar)
2. You should see these tables:
   - `profiles`
   - `rooms`
   - `seasons`
   - `submissions`
   - `boosts`
   - `playlists`
   - `playlist_tracks`

### Test the App

1. Refresh your browser at http://localhost:8080/
2. You should now see the empty state for "No rooms yet"
3. If you still see a blank page, open browser console (F12) and check for errors

## After Database Setup

Once migrations are applied, you can:

1. **Run the seed script** to create Phonk Monsta room:
   ```bash
   # In Supabase SQL Editor, run:
   supabase/scripts/seed_phonk_monsta.sql
   ```

2. **Sign up for an account**
   - Go to http://localhost:8080/
   - Click "Sign In" → "Sign Up"

3. **Make yourself admin**
   ```bash
   # In Supabase SQL Editor, run:
   supabase/scripts/make_user_admin.sql
   # (Remember to replace 'USER_EMAIL_HERE' with your email!)
   ```

## Common Issues

### Issue: "relation 'rooms' does not exist"
**Solution**: Migrations haven't been run. Follow steps above.

### Issue: "permission denied for table rooms"
**Solution**: RLS policies migration hasn't been run. Run migration 3.

### Issue: Still blank page after migrations
**Solution**:
1. Open browser console (F12)
2. Look for JavaScript errors
3. Check the Network tab for failed requests
4. Check Supabase logs in dashboard

## Need Help?

If you're still seeing issues after applying migrations:
1. Check browser console for errors
2. Check Supabase dashboard logs
3. Verify all 4 migrations ran successfully
4. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
