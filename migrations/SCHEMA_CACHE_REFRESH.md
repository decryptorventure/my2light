# Supabase Schema Cache Refresh Guide

## Problem
After running migrations, Supabase may show error:
```
Could not find the table 'bookings' in the schema cache
```

This happens because Supabase caches the database schema and hasn't refreshed it yet.

## Solution 1: Reload Schema in Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard
2. Navigate to **Table Editor**
3. Click the **Refresh** button (circular arrow icon)
4. OR: Go to **SQL Editor** and run:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

## Solution 2: Wait for Auto-Refresh

Supabase automatically refreshes schema cache every few minutes. Just wait 2-5 minutes and try again.

## Solution 3: Restart Supabase Connection (For Local Development)

If using local Supabase:
```bash
# Stop Supabase
supabase stop

# Start again
supabase start
```

## Solution 4: Manual Schema Reload via API

Run this in Supabase SQL Editor:
```sql
-- Force schema reload
SELECT pg_notify('pgrst', 'reload schema');

-- Verify tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'bookings';
```

## Verification

After refresh, verify the table is accessible:

```sql
-- Should return data without errors
SELECT COUNT(*) FROM bookings;
```

## For Production

If this happens in production:
1. The schema should auto-refresh within 2-5 minutes
2. Users may need to retry their action
3. Consider adding retry logic in the app

## Prevention

To prevent this issue:
1. Always refresh schema after running migrations
2. Add a delay after migration before testing
3. Use Supabase CLI for consistent deployments:
   ```bash
   supabase db push
   ```

## Related Files
- Migration: `migrations/000_complete_schema.sql`
- API: `services/api.ts` (createBooking function)
