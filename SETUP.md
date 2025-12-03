# Echo Groove Battle - Backend Setup Guide

This guide will help you set up the Supabase backend for Echo Groove Battle.

## 📋 What's Been Created

### Database Schema
Complete PostgreSQL schema with:
- **13 tables**: profiles, rooms, seasons, submissions, boosts, playlists, and more
- **Automated triggers**: For boost counting, velocity calculation, curator points
- **Row Level Security (RLS)**: Comprehensive security policies for all tables
- **Indexes**: Optimized for leaderboards, trending calculations, and queries

### Authentication System
- Email/password authentication via Supabase Auth
- User profiles with platform-wide scoring
- Sign up, sign in, and sign out flows
- Profile management capabilities

### File Structure
```
supabase/
├── migrations/
│   ├── 20250101000000_initial_schema.sql      # Core tables and schema
│   ├── 20250101000001_triggers_and_functions.sql  # Business logic
│   └── 20250101000002_rls_policies.sql        # Security policies

src/
├── lib/
│   └── supabase.ts                           # Supabase client configuration
├── types/
│   └── database.ts                            # TypeScript types
├── contexts/
│   └── AuthContext.tsx                        # Authentication context
└── components/
    └── auth/
        ├── AuthModal.tsx                      # Login/signup modal
        └── EchoLoginModal.tsx                 # Legacy (to be deprecated)
```

## 🚀 Setup Instructions

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in:
   - **Project Name**: echo-groove-battle
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to your users
4. Wait for the project to be created (~2 minutes)

### Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### Step 3: Configure Environment Variables

1. Create a `.env` file in the project root:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Apply Database Migrations

You have two options to apply the schema:

#### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-id
```

4. Apply migrations:
```bash
supabase db push
```

#### Option B: Manual SQL Execution

1. In Supabase Dashboard, go to **SQL Editor**
2. Run these SQL files in order:
   - `supabase/migrations/20250101000000_initial_schema.sql`
   - `supabase/migrations/20250101000001_triggers_and_functions.sql`
   - `supabase/migrations/20250101000002_rls_policies.sql`
3. Click "RUN" for each file

### Step 5: Create Your First Admin User

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Click "Add User" → "Create new user"
3. Fill in:
   - **Email**: your-email@example.com
   - **Password**: your-secure-password
   - **Auto Confirm User**: ✅ (check this)
4. Click "Create user"

5. Now make yourself an admin by running this SQL in the SQL Editor:
```sql
UPDATE profiles
SET is_admin = true
WHERE id = 'paste-your-user-id-here';
```

To get your user ID:
- Go to **Authentication** → **Users**
- Click on your user
- Copy the UUID from the URL or the "UID" field

### Step 6: Start the Development Server

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` and click "Sign In" to test authentication!

## 🎯 Next Steps

Now that the backend is set up, you need to:

1. **Create API Hooks**: Build React Query hooks for data fetching
2. **Migrate Mock Data**: Replace mock data with real database calls
3. **Add Real-time Subscriptions**: Implement live updates for boosts and submissions
4. **Test Everything**: Ensure all features work with the real backend

## 📊 Database Schema Overview

### Key Tables

**profiles**
- User account data and platform stats
- Links to Supabase Auth
- Stores community points, curator points, and admin status

**rooms**
- Competition spaces
- Has many seasons
- Admin-curated playlists

**seasons**
- Time-limited submission periods
- Status: upcoming → active → voting → completed
- Media type constraints

**submissions**
- User-submitted tracks/media
- Links to external providers (Audius, SoundCloud, YouTube)
- Boost velocity and trending calculations

**boosts**
- User votes/engagement
- Triggers update boost counts and velocity
- Used for calculating curator accuracy

**user_room_scores**
- Per-user, per-room statistics
- Curator accuracy tracking
- Leaderboard data

### Automated Features

**Boost Velocity**: Automatically calculated on each boost event

**Trending Algorithm**: Submissions with high velocity get marked as trending

**Curator Points**: Auto-awarded when boosted submissions make it to playlists

**Daily Limits**: Boost counts reset daily via `reset_daily_boost_counts()` function

## 🔒 Security

All tables have Row Level Security (RLS) enabled:

- ✅ Public profiles are viewable by everyone
- ✅ Users can only update their own data
- ✅ Admins can moderate content
- ✅ Room creators control their seasons
- ✅ Authenticated users can vote/boost

## 🐛 Troubleshooting

### "Missing environment variables" Error
- Make sure `.env` file exists and has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart your dev server after creating `.env`

### Can't sign up
- Check that migrations ran successfully
- Verify RLS policies are enabled
- Check browser console for detailed errors

### Profile not created after signup
- Ensure the `handle_new_user()` trigger exists
- Check **Database** → **Functions** in Supabase Dashboard

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- The database types are auto-generated in `src/types/database.ts`

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Updates](https://supabase.com/docs/guides/realtime)

## 🎨 Design Decisions

### Why Denormalized Counters?
Boost counts, submission counts, etc. are denormalized for performance. Calculating these on-the-fly would be expensive with large datasets.

### Why Weighted Boosts?
Early boosters get slightly more weight to encourage discovering new submissions rather than piling on to already-popular tracks.

### Why Separate boost_history?
Allows tracking per-user, per-submission boost history for calculating community points with decay and curator accuracy.

### Why Daily Limits?
Prevents spam and encourages quality voting over quantity.

---

**Ready to continue?** The next step is creating the API layer with React Query hooks!
