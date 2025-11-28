# Running Migration 004: Analytics & Social Features

## ⚠️ Important: Backup First!

Before running this migration, **create a backup** of your Supabase database.

## 📝 What This Migration Does

1. Creates 5 new tables:
   - `player_connections` - Follow/friend system
   - `highlight_interactions` - Likes, views, shares
   - `highlight_comments` - Comment system
   - `player_activities` - Activity feed
   - `analytics_cache` - Performance optimization

2. Alters existing tables:
   - `highlights` - Adds social counts (likes, views, shares, comments  + is_public flag
   - `profiles` - Adds social fields (bio, skill_level, followers_count, etc.)

3. Adds indexes for performance
4. Creates RLS policies for security
5. Creates triggers for automatic count updates

## 🚀 How to Run

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `migrations/004_analytics_social.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. Wait for success message: "Migration 004 completed successfully!"

### Option 2: Supabase CLI

```bash
cd my2light-app
supabase db push
```

## ✅ Verification

After running the migration, verify it succeeded:

```sql
-- Check new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'player_connections',
  'highlight_interactions', 
  'highlight_comments',
  'player_activities',
  'analytics_cache'
);
-- Should return 5 rows

-- Check new columns on highlights
SELECT column_name FROM information_schema.columns
WHERE table_name = 'highlights'
AND column_name IN ('likes_count', 'views_count', 'shares_count', 'comments_count', 'is_public');
-- Should return 5 rows

-- Check new columns on profiles
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('skill_level', 'bio', 'followers_count', 'following_count');
-- Should return 4 rows

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('player_connections', 'highlight_interactions', 'highlight_comments');
-- Should return multiple rows
```

## 🔄 Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Drop new tables
DROP TABLE IF EXISTS player_activities CASCADE;
DROP TABLE IF EXISTS analytics_cache CASCADE;
DROP TABLE IF EXISTS highlight_comments CASCADE;
DROP TABLE IF EXISTS highlight_interactions CASCADE;
DROP TABLE IF EXISTS player_connections CASCADE;

-- Remove new columns from highlights
ALTER TABLE highlights 
  DROP COLUMN IF EXISTS likes_count,
  DROP COLUMN IF EXISTS views_count,
  DROP COLUMN IF EXISTS shares_count,
  DROP COLUMN IF EXISTS comments_count,
  DROP COLUMN IF EXISTS is_public;

-- Remove new columns from profiles
ALTER TABLE profiles
  DROP COLUMN IF EXISTS skill_level,
  DROP COLUMN IF EXISTS profile_visibility,
  DROP COLUMN IF EXISTS show_stats,
  DROP COLUMN IF EXISTS bio,
  DROP COLUMN IF EXISTS followers_count,
  DROP COLUMN IF EXISTS following_count,
  DROP COLUMN IF EXISTS last_active_at;

-- Drop functions
DROP FUNCTION IF EXISTS update_follower_counts CASCADE;
DROP FUNCTION IF EXISTS update_highlight_interaction_counts CASCADE;
DROP FUNCTION IF EXISTS update_highlight_comment_counts CASCADE;
DROP FUNCTION IF EXISTS create_highlight_activity CASCADE;
DROP FUNCTION IF EXISTS create_connection_activity CASCADE;
```

## 📊 Expected Impact

- **Database size**: +~5 tables, minimal initial data
- **Performance**: Indexes added for fast queries
- **Security**: RLS policies ensure data privacy
- **Downtime**: None (migration is additive)

## 🐛 Troubleshooting

### Error: "relation already exists"
- Some tables might already exist from previous attempts
- Check existing tables and drop them first if needed

### Error: "permission denied"
- Make sure you're logged in with proper permissions
- Use service role key for CLI
- Use dashboard as project owner

### Error: "column already exists"
- ALTER TABLE commands are idempotent (use IF NOT EXISTS)
- Should not cause issues on re-run

## ✨ Next Steps

After successful migration:

1. ✅ Verify all tables and columns exist
2. ✅ Test RLS policies (try querying as a user)
3. ✅ Proceed to implement social services (`services/social.ts`)
4. ✅ Proceed to implement analytics services (`services/analytics.ts`)

---

**Need Help?** Check the migration file for inline comments explaining each section.
