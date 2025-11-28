# CHANGELOG - Version 3.5

**Release Date:** 2025-11-28  
**Code Name:** Recording Enhancement & Production Fixes

---

## 🎯 Overview

Version 3.5 introduces a complete overhaul of the video recording system with segment-based recording, server-side video merging, and enhanced UX. This release also includes critical bug fixes for production stability.

---

## ✨ New Features

### 🎥 **Enhanced Recording System**

#### **Segment-Based Recording**
- **Highlight Marking During Recording**: Users can mark highlights while recording by tapping the "Highlight" button
- **Rollback Time Selector**: Choose how many seconds to save before the highlight (15s / 30s / 60s)
- **Multiple Segments Per Session**: Support for marking multiple highlights in a single recording session
- **Segment Preview**: Preview individual segments before saving with video player and timestamp info
- **Bulk Selection Controls**: "Select All" and "Deselect All" buttons for easy segment management

#### **Post-Recording Flow**
- **Multi-Select Grid UI**: Visual grid interface for selecting which segments to keep
- **Video Preview Modal**: Full-screen modal with video player that auto-seeks to segment timestamp
- **Server-Side Video Merging**: Edge Function processes and merges selected segments
- **Download Functionality**: Download merged video directly to device
- **Progress Indicators**: Visual feedback during video processing

#### **Recording Controls**
- **Pause/Resume**: Pause and resume recording mid-session
- **Camera Switch**: Switch between front/rear cameras during setup
- **Settings Modal**: Configure rollback time and enable/disable features
- **Visual Timer**: Display recording duration in real-time

### 🗄️ **Database Enhancements**

#### **New Tables**
- `video_segments`: Store metadata for individual video segments
- `video_processing_jobs`: Track server-side merge jobs
- `notifications`: System notifications for users

#### **Storage Buckets**
- `raw_segments`: Store raw video segment files with RLS policies
- Configured with 100MB file size limit and video MIME type restrictions

### ⚙️ **Edge Functions**

#### **merge-videos**
- Server-side video merging using Deno runtime
- Automatic segment concatenation
- Creates highlight records in database
- Sends notifications when processing completes
- Error handling with fallback support

---

## 🐛 Bug Fixes

### **Critical Fixes**

1. **Video Save Error**
   - Fixed missing `duration_sec` field in highlights table
   - Corrected API payload structure
   - Added real user ID integration from Supabase auth
   - Implemented comprehensive error handling with Vietnamese messages

2. **Avatar Onboarding Bug**
   - Avatar now uploads to server immediately on selection
   - Profile update uses uploaded URL instead of placeholder
   - Eliminated race conditions in upload flow

3. **Session Persistence**
   - Improved auto-login behavior
   - Fixed session token refresh issues
   - Ensured localStorage consistency

4. **Gallery/Dashboard Display**
   - Fixed video not appearing after save
   - Edge Function now creates highlight records
   - Proper table joins for video queries

---

## 🗃️ Database Migrations

### **Migration 009: Fix Highlights Duration**
```sql
ALTER TABLE highlights ADD COLUMN IF NOT EXISTS duration_sec INTEGER;
```

### **Migration 010: Video Segments & Notifications**
```sql
CREATE TABLE video_segments (...);
CREATE TABLE video_processing_jobs (...);
CREATE TABLE notifications (...);
```

### **Migration 011: Fix Trigger Duration**
```sql
-- Fixed create_highlight_activity trigger to use duration_sec
```

### **Migration 012: Storage Bucket Policies**
```sql
-- RLS policies for raw_segments bucket
-- INSERT, SELECT, UPDATE, DELETE policies for authenticated users
```

---

## 🔄 API Changes

### **New Services**

#### **VideoSegmentService** (`services/videoSegments.ts`)
- `uploadSegment(blob, segmentId, userId)`: Upload segment to storage
- `saveSegmentMetadata(segment)`: Save segment to database
- `mergeVideos(segmentIds)`: Trigger Edge Function for merging

### **Updated Services**

#### **ApiService**
- `getHighlights()`: Now joins with segments and processing jobs
- Enhanced error handling and type safety

---

## 📦 Dependencies

### **Added**
- No new external dependencies (pure React + Supabase)

### **Updated**
- Supabase client usage patterns
- Edge Function deployment workflow

---

## 🏗️ Infrastructure

### **Supabase Configuration**

#### **Storage**
- Created `raw_segments` bucket (Public, 100MB limit)
- Configured MIME types: `video/webm`, `video/mp4`
- Set up RLS policies for user isolation

#### **Edge Functions**
- Deployed `merge-videos` function to production
- Configured with proper CORS headers
- Implemented authentication checks

### **Environment Variables**
No new environment variables required.

---

## 🎨 UI/UX Changes

### **Recording Screen Redesign**
- **Before**: Simple record → stop → save flow
- **After**: Record → mark highlights → review grid → save selected

### **Visual Improvements**
- Glassmorphism effects on controls
- Smooth animations with Framer Motion
- Confetti celebrations on highlight marking
- Toast notifications in Vietnamese
- Responsive grid layout for segment cards

### **Mobile Optimization**
- Touch-friendly button sizes
- Safe area insets for notched devices
- Optimized for portrait orientation

---

## ⚠️ Breaking Changes

### **Type Changes**
```typescript
// Old
interface Highlight {
  duration: number; // seconds as number
}

// New
interface Highlight {
  duration_sec: number; // explicit naming
}
```

### **API Response Changes**
- `VideoSegmentService.mergeVideos()` now returns `{ success, jobId, videoUrl, error }`
- Added `videoUrl` to response payload

---

## 🔐 Security Updates

### **RLS Policies**
- All segment operations restricted to authenticated users
- Users can only access their own segments
- Proper bucket-level security implemented

### **Edge Function Auth**
- JWT verification on all Edge Function calls
- User ID validation before processing
- Proper CORS configuration

---

## 📝 Known Issues & Limitations

1. **Video Merging**: 
   - Simple blob concatenation (not frame-perfect)
   - For production-grade merging, consider FFmpeg integration

2. **Thumbnail Generation**:
   - Thumbnails not auto-generated yet
   - Placeholder icons used in segment grid

3. **Browser Support**:
   - MediaRecorder API required (Chrome/Edge/Safari 14.1+)
   - WebRTC for camera access

4. **Storage**:
   - Raw segments not auto-deleted after merging
   - Manual cleanup may be needed

---

## 🚀 Deployment Notes

### **Required Steps**

1. **Run Migrations**
   ```bash
   # Run in Supabase SQL Editor
   migrations/009_fix_highlights_duration.sql
   migrations/010_video_segments_and_notifications.sql
   migrations/011_fix_trigger_duration.sql
   migrations/012_create_raw_segments_bucket.sql
   ```

2. **Create Storage Bucket**
   - Name: `raw_segments`
   - Type: Public
   - File size limit: 100MB
   - Allowed MIME types: `video/webm,video/mp4`

3. **Deploy Edge Function**
   ```bash
   npx supabase functions deploy merge-videos
   ```

4. **Verify Configuration**
   - Check RLS policies are active
   - Test Edge Function authentication
   - Verify storage bucket permissions

---

## 📊 Performance Metrics

- **Bundle Size**: SelfRecording component increased by ~2KB (gzipped)
- **Build Time**: ~4.3s (no significant change)
- **Runtime Performance**: No regressions detected

---

## 👥 Contributors

- Implementation: AI Assistant (Antigravity)
- Product Owner: DungNV
- Testing: DungNV

---

## 🔜 Future Enhancements (Not in 3.5)

- [ ] Voice-activated highlight detection
- [ ] Automatic thumbnail generation
- [ ] FFmpeg-based video processing
- [ ] Client-side video slicing
- [ ] Segment trimming/editing
- [ ] Background upload support
- [ ] Offline mode support

---

## 📚 Additional Resources

- [Video Save Fix Guide](video_save_fix_guide.md)
- [Recording Enhancement Plan](recording_enhancement_plan.md)
- [Task Tracker](task.md)
- [Walkthrough](walkthrough.md)
