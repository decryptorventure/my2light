# Developer Handover Guide - my2light v3.5

**Last Updated:** 2025-11-28  
**Project:** my2light (Basketball Highlight Recording App)  
**Version:** 3.5

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Key Features](#key-features)
5. [Database Schema](#database-schema)
6. [API & Services](#api--services)
7. [Authentication & Security](#authentication--security)
8. [Deployment](#deployment)
9. [Development Workflow](#development-workflow)
10. [Troubleshooting](#troubleshooting)
11. [Future Roadmap](#future-roadmap)

---

## 🎯 Project Overview

**my2light** is a mobile-first web application for basketball players to record their games, mark highlights in real-time, and share their best moments with the community.

### **Core Value Proposition**
- Record full basketball games
- Mark highlights during gameplay (last 15-60 seconds)
- Automatically merge selected highlights
- Share to community gallery
- Social features (likes, comments, follows)

### **Target Users**
- Amateur basketball players
- Basketball enthusiasts
- Court booking customers

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS (customized with slate theme)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useContext)

### **Backend**
- **Platform**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Database**: PostgreSQL
- **Storage**: Supabase Storage (S3-compatible)
- **Edge Functions**: Deno runtime

### **Media**
- **Recording**: MediaRecorder API (WebRTC)
- **Video Format**: WebM (default), MP4 (fallback)
- **Camera Access**: getUserMedia API

---

## 📁 Project Structure

```
my2light-app/
├── public/                  # Static assets
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Button, Card, Modal)
│   │   ├── Layout/         # Layout components (PageTransition)
│   │   └── social/         # Social features (CommentSection)
│   ├── pages/              # Route pages
│   │   ├── SelfRecording.tsx    ⭐ Main recording interface
│   │   ├── Gallery.tsx          # Community highlights
│   │   ├── Dashboard.tsx        # User dashboard
│   │   ├── Profile.tsx          # User profile
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   ├── useCamera.ts         # Camera management
│   │   ├── useMediaRecorder.ts  # Video recording
│   │   └── ...
│   ├── services/           # API & business logic
│   │   ├── api.ts              # Main API service
│   │   ├── videoSegments.ts     ⭐ Video segment handling
│   │   └── social.ts
│   ├── lib/                # Utilities
│   │   ├── supabase.ts         # Supabase client
│   │   └── confetti.ts         # Celebration effects
│   ├── stores/             # Global state
│   ├── types.ts            # TypeScript types
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── supabase/
│   ├── functions/               # Edge Functions
│   │   └── merge-videos/       ⭐ Video merging function
│   └── migrations/             # Database migrations
├── migrations/                  # SQL migration files
│   ├── 009_fix_highlights_duration.sql
│   ├── 010_video_segments_and_notifications.sql
│   ├── 011_fix_trigger_duration.sql
│   └── 012_create_raw_segments_bucket.sql
└── package.json
```

---

## 🎨 Key Features

### **1. Self Recording (`pages/SelfRecording.tsx`)**

**Flow:**
```
Ready → Recording → Review → Processing → Done
```

**Key Components:**
- `useCamera`: Manages camera permissions and stream
- `useMediaRecorder`: Handles video recording state
- `VideoSegmentService`: Uploads and processes segments

**State Management:**
```typescript
const [step, setStep] = useState<RecordingStep>('ready');
const [segments, setSegments] = useState<VideoSegment[]>([]);
const [rollbackTime, setRollbackTime] = useState(15);
const [previewSegment, setPreviewSegment] = useState<VideoSegment | null>(null);
```

**Highlight Marking:**
```typescript
const handleMarkHighlight = async () => {
  const newSegment: VideoSegment = {
    id: crypto.randomUUID(),
    start_time: Math.max(0, recordedTime - rollbackTime),
    end_time: recordedTime,
    duration: rollbackTime,
    status: 'pending'
  };
  setSegments(prev => [...prev, newSegment]);
};
```

### **2. Video Processing Pipeline**

**Client-Side:**
1. User marks highlights during recording
2. Full recording saved as Blob
3. User selects which segments to keep
4. Each segment uploaded to `raw_segments` bucket
5. Metadata saved to `video_segments` table

**Server-Side (Edge Function):**
1. Receive segment IDs
2. Fetch segment files from storage
3. Concatenate video blobs
4. Upload merged video to `videos` bucket
5. Create highlight record
6. Send notification to user

**Code Reference:**
- Client: `services/videoSegments.ts`
- Server: `supabase/functions/merge-videos/index.ts`

### **3. Gallery & Social Features**

**Stack:**
- Infinite scroll video feed
- Like/comment system
- Follow/unfollow users
- Activity tracking

**Key Files:**
- `pages/Gallery.tsx`: TikTok-style video feed
- `services/social.ts`: Social interactions
- `components/social/CommentSection.tsx`: Comments UI

---

## 🗄️ Database Schema

### **Core Tables**

#### **profiles**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  name TEXT,
  avatar TEXT,
  bio TEXT,
  phone TEXT,
  credits INTEGER DEFAULT 0,
  membership_tier TEXT DEFAULT 'free',
  has_onboarded BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **highlights** ⭐
```sql
CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  court_id UUID REFERENCES courts(id),
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  duration_sec INTEGER NOT NULL,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **video_segments** ⭐ NEW
```sql
CREATE TABLE video_segments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_session_id UUID NOT NULL,
  user_id UUID REFERENCES profiles(id),
  start_time REAL NOT NULL,
  end_time REAL NOT NULL,
  duration REAL NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **video_processing_jobs** ⭐ NEW
```sql
CREATE TABLE video_processing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  segment_ids UUID[] NOT NULL,
  status TEXT DEFAULT 'pending',
  output_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

#### **notifications** ⭐ NEW
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **Storage Buckets**

#### **videos**
- Public bucket
- Stores merged highlight videos
- No file size limit

#### **raw_segments** ⭐ NEW
- Public bucket
- Stores individual video segments
- 100MB file size limit
- RLS policies: users can only access their own segments

---

## 🔌 API & Services

### **ApiService** (`services/api.ts`)

Main service for all API calls.

**Key Methods:**
```typescript
// User
getCurrentUser(): Promise<ApiResponse<User>>
updateUserProfile(updates): Promise<ApiResponse<boolean>>

// Highlights
getHighlights(limit): Promise<ApiResponse<Highlight[]>>
uploadVideo(file): Promise<ApiResponse<string>>
postHighlight(data): Promise<ApiResponse<Highlight>>

// Social
toggleLike(highlightId): Promise<ApiResponse<boolean>>
```

### **VideoSegmentService** (`services/videoSegments.ts`) ⭐

Handles video segment operations.

**Methods:**
```typescript
uploadSegment(blob: Blob, segmentId: string, userId: string): Promise<string | null>
saveSegmentMetadata(segment: VideoSegment): Promise<VideoSegment | null>
mergeVideos(segmentIds: string[]): Promise<{ success, jobId, videoUrl, error }>
```

**Usage Example:**
```typescript
// 1. Upload segment video file
const videoUrl = await VideoSegmentService.uploadSegment(blob, seg.id, user.id);

// 2. Save metadata
await VideoSegmentService.saveSegmentMetadata({
  ...seg,
  user_id: user.id,
  video_url: videoUrl
});

// 3. Trigger merge
const result = await VideoSegmentService.mergeVideos(selectedIds);
```

### **Edge Functions**

#### **merge-videos** (`supabase/functions/merge-videos/index.ts`)

**Input:**
```typescript
{
  segmentIds: string[]  // Array of segment UUIDs
}
```

**Process:**
1. Verify user authentication
2. Fetch segments from database
3. Download segment videos from storage
4. Concatenate blobs
5. Upload merged video
6. Create highlight record
7. Send notification

**Output:**
```typescript
{
  success: boolean,
  jobId: string,
  videoUrl: string
}
```

**Deployment:**
```bash
npx supabase functions deploy merge-videos
```

---

## 🔐 Authentication & Security

### **Authentication Flow**

1. **Supabase Auth** handles all authentication
2. Session stored in localStorage
3. JWT token in Authorization header

**Check Auth Status:**
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session?.user) {
  // Not authenticated
}
```

### **Row Level Security (RLS)**

**Highlights:**
```sql
-- Users can read public highlights
CREATE POLICY "Public highlights are viewable by everyone"
  ON highlights FOR SELECT
  USING (is_public = true);

-- Users can insert their own highlights
CREATE POLICY "Users can insert own highlights"
  ON highlights FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Video Segments:**
```sql
-- Users can only access their own segments
CREATE POLICY "Users can insert own segments"
  ON video_segments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own segments"
  ON video_segments FOR SELECT
  USING (auth.uid() = user_id);
```

**Storage Policies:**
```sql
-- raw_segments bucket
CREATE POLICY "Users can upload own segments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'raw_segments' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 🚀 Deployment

### **Prerequisites**

1. **Supabase Project**
   - PostgreSQL database
   - Storage configured
   - Edge Functions enabled

2. **Environment Variables**
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### **Setup Steps**

#### **1. Database Migrations**

Run in order:
```bash
# In Supabase SQL Editor
migrations/009_fix_highlights_duration.sql
migrations/010_video_segments_and_notifications.sql
migrations/011_fix_trigger_duration.sql
migrations/012_create_raw_segments_bucket.sql
```

#### **2. Storage Buckets**

**Create `raw_segments` bucket:**
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `raw_segments`
4. Public: ✅
5. File size limit: 100 MB
6. Allowed MIME types: `video/webm,video/mp4`
7. Apply RLS policies from migration 012

#### **3. Edge Functions**

```bash
# Login to Supabase
npx supabase login

# Deploy function
npx supabase functions deploy merge-videos
```

#### **4. Frontend Deployment**

```bash
# Build
npm run build

# Deploy to your hosting (Vercel, Netlify, etc.)
# dist/ folder contains built assets
```

### **Environment-Specific Config**

**Development:**
```bash
npm run dev  # Runs on http://localhost:5173
```

**Production:**
- Build assets: `npm run build`
- Serve `dist/` folder
- Ensure HTTPS for camera access

---

## 💻 Development Workflow

### **Getting Started**

```bash
# Clone repo
git clone <repo-url>
cd my2light-app

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run dev server
npm run dev
```

### **Branch Strategy**

- `main`: Production code
- `feature/*`: New features
- `fix/*`: Bug fixes

**Example:**
```bash
git checkout -b feature/new-recording-ui
# ... make changes ...
git commit -m "feat: add new recording UI"
git push origin feature/new-recording-ui
# Create PR to main
```

### **Code Style**

- **TypeScript**: Strict mode enabled
- **Naming**: camelCase for variables, PascalCase for components
- **Imports**: Absolute imports from `src/`
- **Formatting**: Prettier (if configured)

### **Common Commands**

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run linter (if configured)
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Video Not Saving**

**Symptoms:** Video segments upload but don't appear in Gallery

**Solution:**
- Check Edge Function logs in Supabase Dashboard
- Verify `merge-videos` is deployed
- Ensure highlight record is created (check `highlights` table)

**Debug:**
```typescript
// Add logging in handleSaveSelected
console.log('Merge result:', mergeResult);
```

#### **2. Camera Permission Denied**

**Symptoms:** Camera doesn't start, black screen

**Solution:**
- Ensure HTTPS (required for getUserMedia)
- Check browser permissions
- Try different browser (Chrome/Edge recommended)

#### **3. Storage Upload Fails**

**Symptoms:** "Failed to upload segment" error

**Solution:**
- Check `raw_segments` bucket exists
- Verify RLS policies are correct
- Check file size (must be < 100MB)

#### **4. Build Errors**

**Symptoms:** TypeScript errors during build

**Common Fix:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### **Debugging Tools**

1. **Supabase Dashboard**
   - Check Storage for uploaded files
   - View Edge Function logs
   - Query database tables

2. **Browser DevTools**
   - Network tab: Check API calls
   - Console: Check for errors
   - Application → Storage: Check localStorage

3. **Database Queries**
```sql
-- Check recent segments
SELECT * FROM video_segments 
WHERE user_id = 'user-uuid' 
ORDER BY created_at DESC LIMIT 10;

-- Check processing jobs
SELECT * FROM video_processing_jobs 
WHERE status = 'failed';
```

---

## 🔜 Future Roadmap

### **Planned Features**

1. **Advanced Video Editing**
   - Trim segments
   - Add filters/effects
   - Speed adjustment

2. **AI Features**
   - Auto-detect highlight moments
   - Smart thumbnail generation
   - Action recognition (dunks, 3-pointers)

3. **Performance**
   - Client-side video slicing (FFmpeg.wasm)
   - Background upload
   - Progressive video loading

4. **Social**
   - Direct messaging
   - Team/squad features
   - Tournaments

5. **Monetization**
   - Premium memberships
   - Court booking integration
   - Sponsored content

### **Technical Debt**

- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Add E2E tests (Playwright)
- [ ] Implement proper error boundaries
- [ ] Add logging/monitoring (Sentry)
- [ ] Optimize bundle size
- [ ] Add PWA support
- [ ] Implement offline mode

---

## 📞 Support & Resources

### **Documentation**
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Framer Motion](https://www.framer.com/motion/)

### **Internal Docs**
- [CHANGELOG_v3.5.md](CHANGELOG_v3.5.md)
- [Video Save Fix Guide](video_save_fix_guide.md)
- [Recording Enhancement Plan](recording_enhancement_plan.md)

### **Contact**
- Product Owner: DungNV
- Repository: [GitHub Link]

---

**Good luck with the project! 🏀🎥**
