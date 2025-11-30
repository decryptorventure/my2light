# My2Light - Database Schema Documentation

## 📊 Schema Overview

My2Light uses PostgreSQL (via Supabase) with Row Level Security (RLS) enabled on all tables.

**Database Version**: PostgreSQL 15  
**Schema Version**: 3.7.0  
**Last Migration**: 015_fix_community_feed_rls.sql

---

## 🗂️ Core Tables

### profiles
Extends Supabase `auth.users` with application-specific data.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  avatar TEXT,
  phone TEXT DEFAULT '',
  credits INTEGER DEFAULT 200000,
  membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'pro', 'elite')),
  total_highlights INTEGER DEFAULT 0,
  has_onboarded BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'court_owner', 'both')),
  
  -- Social fields (added in migration 004)
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'pro')),
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'connections', 'private')),
  show_stats BOOLEAN DEFAULT TRUE,
  bio TEXT CHECK (bio IS NULL OR char_length(bio) <= 200),
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_profiles_role` on `role`
- `idx_profiles_last_active` on `last_active_at DESC`
- `idx_profiles_skill_level` on `skill_level`

**RLS Policies**:
- Users can view all profiles
- Users can only update their own profile

---

### courts
Court information and availability.

```sql
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES court_owners(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  price_per_hour INTEGER NOT NULL DEFAULT 0,
  open_time TEXT DEFAULT '06:00',
  close_time TEXT DEFAULT '22:00',
  facilities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('live', 'busy', 'available', 'maintenance')),
  rating DECIMAL DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  distance_km DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  auto_approve_bookings BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_courts_owner_id` on `owner_id`
- `idx_courts_is_active` on `is_active`
- `idx_courts_created_at` on `created_at DESC`

**RLS Policies**:
- Anyone can view active courts
- Court owners can manage their own courts

---

### highlights
User-generated video highlights.

```sql
CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration_sec INTEGER NOT NULL,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  
  -- Social fields (added in migration 004)
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_highlights_user_id` on `user_id`
- `idx_highlights_court_id` on `court_id`
- `idx_highlights_created_at` on `created_at DESC`
- `idx_highlights_is_public` on `is_public`

**RLS Policies**:
- Anyone can view public highlights
- Users can only manage their own highlights

---

### bookings
Court booking records.

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  package_id TEXT REFERENCES packages(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  total_amount INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  rescheduled_from TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_bookings_user_id` on `user_id`
- `idx_bookings_court_id` on `court_id`
- `idx_bookings_status` on `status`
- `idx_bookings_start_time` on `start_time`

**RLS Policies**:
- Users can view their own bookings
- Court owners can view bookings for their courts

---

## 🤝 Social Tables

### player_connections
Follow/friend relationships between players.

```sql
CREATE TABLE player_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(requester_id, receiver_id),
  CHECK (requester_id != receiver_id)
);
```

**Indexes**:
- `idx_connections_requester` on `requester_id`
- `idx_connections_receiver` on `receiver_id`
- `idx_connections_status` on `status`
- `idx_connections_created` on `created_at DESC`

**Triggers**:
- `update_follower_counts`: Updates `followers_count` and `following_count` on profiles

---

### player_activities
Activity feed entries for social features.

```sql
CREATE TABLE player_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('highlight_posted', 'match_completed', 'badge_unlocked', 'new_connection', 'court_review')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_activities_user` on `user_id`
- `idx_activities_type` on `activity_type`
- `idx_activities_created` on `created_at DESC`

**RLS Policies**:
- Users can view all activities (global feed)
- System creates activities via triggers

**Triggers**:
- `create_highlight_activity`: Creates activity when highlight is posted
- `create_connection_activity`: Creates activity when connection is accepted

---

### highlight_interactions
Likes, views, and shares on highlights.

```sql
CREATE TABLE highlight_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'view', 'share')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(highlight_id, user_id, interaction_type)
);
```

**Indexes**:
- `idx_interactions_highlight` on `highlight_id`
- `idx_interactions_user` on `user_id`
- `idx_interactions_type` on `interaction_type`
- `idx_interactions_created` on `created_at DESC`

**Triggers**:
- `update_highlight_interaction_counts`: Updates counts on highlights table

---

### highlight_comments
Comments on highlights with nested reply support.

```sql
CREATE TABLE highlight_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL CHECK (char_length(comment) > 0 AND char_length(comment) <= 500),
  parent_id UUID REFERENCES highlight_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_comments_highlight` on `highlight_id`
- `idx_comments_user` on `user_id`
- `idx_comments_parent` on `parent_id`
- `idx_comments_created` on `created_at DESC`

**Triggers**:
- `update_highlight_comment_counts`: Updates `comments_count` on highlights

---

## 💼 Business Tables

### court_owners
Court owner business information.

```sql
CREATE TABLE court_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  tax_id TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  bank_account TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### packages
Booking packages (Rally Mode, Full Match, etc).

```sql
CREATE TABLE packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price INTEGER NOT NULL,
  type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'full_match')),
  is_best_value BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Default Data**:
```sql
INSERT INTO packages VALUES
  ('pkg_basic', 'Rally Mode', 'Tự động lưu highlight, 30 giây/clip', 60, 150000, 'standard', false),
  ('pkg_premium', 'Full Match', 'Quay toàn bộ trận, AI tạo highlight, Tải về full HD', 120, 300000, 'full_match', true);
```

---

### transactions
Payment and credit transactions.

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'booking', 'refund', 'reward')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔔 Supporting Tables

### notifications
User notifications.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### video_segments
Recording session segments for self-recording feature.

```sql
CREATE TABLE video_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_session_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  duration INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'processed', 'failed')),
  video_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### match_requests
Matchmaking system for finding playing partners.

```sql
CREATE TABLE match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
  preferred_time TEXT NOT NULL,
  skill_level TEXT NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'pro')),
  match_type TEXT NOT NULL CHECK (match_type IN ('singles', 'doubles', 'any')),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'mixed', 'any')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'cancelled', 'expired')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📦 Storage Buckets

### videos
Stores user-uploaded videos and highlights.

**Configuration**:
- Public: false
- File size limit: 100MB
- Allowed MIME types: video/mp4, video/webm

**RLS Policies**:
- Users can upload to their own folder
- Users can view their own videos
- Public highlights are viewable by all

---

### avatars
User profile pictures.

**Configuration**:
- Public: true
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png, image/webp

---

### court-images
Court photos and thumbnails.

**Configuration**:
- Public: true
- File size limit: 10MB
- Allowed MIME types: image/jpeg, image/png, image/webp

---

## 🔐 Row Level Security (RLS)

All tables have RLS enabled. Key patterns:

### User Data Access
```sql
-- Users can only access their own data
USING (auth.uid() = user_id)
```

### Public Content
```sql
-- Anyone can view public content
USING (is_public = true OR auth.uid() = user_id)
```

### Court Owner Access
```sql
-- Court owners can access their court data
USING (court_id IN (
  SELECT c.id FROM courts c
  INNER JOIN court_owners co ON c.owner_id = co.id
  WHERE co.profile_id = auth.uid()
))
```

---

## 🔄 Database Functions & Triggers

### update_updated_at_column()
Updates `updated_at` timestamp on row modification.

**Applied to**: profiles, courts, bookings, court_owners, player_connections, highlight_comments

### update_follower_counts()
Maintains denormalized follower/following counts on profiles.

**Triggered by**: INSERT, UPDATE, DELETE on player_connections

### update_highlight_interaction_counts()
Maintains denormalized interaction counts on highlights.

**Triggered by**: INSERT, DELETE on highlight_interactions

### update_highlight_comment_counts()
Maintains denormalized comment counts on highlights.

**Triggered by**: INSERT, DELETE on highlight_comments

### create_highlight_activity()
Creates activity feed entry when highlight is posted.

**Triggered by**: INSERT on highlights (if is_public = true)

### create_connection_activity()
Creates activity feed entry when connection is accepted.

**Triggered by**: INSERT, UPDATE on player_connections (if status = 'accepted')

---

## 📈 Performance Indexes

### Composite Indexes (Recommended)
```sql
-- For activity feed queries
CREATE INDEX idx_activities_user_created ON player_activities(user_id, created_at DESC);

-- For booking queries
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_court_time ON bookings(court_id, start_time);

-- For highlight queries
CREATE INDEX idx_highlights_user_public ON highlights(user_id, is_public);
CREATE INDEX idx_highlights_public_created ON highlights(is_public, created_at DESC) WHERE is_public = true;
```

---

## 🗃️ Data Retention & Cleanup

### Recommended Cleanup Policies

```sql
-- Delete old video segments (older than 30 days)
DELETE FROM video_segments 
WHERE created_at < NOW() - INTERVAL '30 days' 
  AND status IN ('uploaded', 'failed');

-- Archive old bookings (older than 1 year)
-- Move to bookings_archive table

-- Delete old notifications (older than 90 days, read)
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '90 days' 
  AND is_read = true;
```

---

## 🔍 Common Queries

### Get User Feed
```sql
SELECT 
  pa.*,
  p.name,
  p.avatar
FROM player_activities pa
JOIN profiles p ON pa.user_id = p.id
ORDER BY pa.created_at DESC
LIMIT 20;
```

### Get User's Highlights with Stats
```sql
SELECT 
  h.*,
  c.name as court_name
FROM highlights h
LEFT JOIN courts c ON h.court_id = c.id
WHERE h.user_id = $1
ORDER BY h.created_at DESC;
```

### Get Court Availability
```sql
SELECT * FROM courts
WHERE is_active = true
  AND status IN ('available', 'live')
  AND distance_km <= $1
ORDER BY distance_km ASC;
```

---

## 📊 Schema Diagram

```
auth.users (Supabase)
    │
    └─→ profiles (1:1)
         ├─→ highlights (1:N)
         │    ├─→ highlight_interactions (1:N)
         │    └─→ highlight_comments (1:N)
         │
         ├─→ player_connections (M:N self-ref)
         ├─→ player_activities (1:N)
         ├─→ bookings (1:N)
         ├─→ match_requests (1:N)
         ├─→ transactions (1:N)
         ├─→ notifications (1:N)
         └─→ video_segments (1:N)

court_owners (1:1 with profiles)
    │
    └─→ courts (1:N)
         └─→ bookings (1:N)
```

---

**Last Updated**: November 30, 2025  
**Schema Version**: 3.7.0  
**Total Tables**: 16  
**Total Indexes**: 40+
