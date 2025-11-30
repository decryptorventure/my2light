# My2Light - Badminton Court Management & Social Platform

## 🎯 Project Overview

**My2Light** is a comprehensive mobile-first web application for badminton players and court owners in Vietnam. It combines court booking, AI-powered highlight recording, and social networking features.

### Business Context
- **Target Market**: Vietnamese badminton community
- **Primary Users**: Players (amateur to professional) and court owners
- **Key Value Propositions**:
  - Easy court discovery and booking
  - AI-powered highlight generation from matches
  - Social networking for players
  - Court management tools for owners

### Current Version
- **Version**: 3.7.0
- **Status**: Production (with performance issues)
- **Last Updated**: November 30, 2025

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: React 18.2 + TypeScript 5.2
- **Build Tool**: Vite 5.0
- **Routing**: React Router DOM 6.20
- **State Management**: 
  - Zustand 5.0 (global state)
  - TanStack Query 5.90 (server state)
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion 10.16
- **UI Icons**: Lucide React 0.294

### Backend & Database
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (videos, images)
- **Real-time**: Supabase Realtime subscriptions

### PWA & Offline
- **Service Worker**: Vite PWA Plugin
- **Offline Storage**: IndexedDB (idb-keyval)
- **Media Recording**: MediaRecorder API
- **QR Scanning**: html5-qrcode

### Monitoring & Analytics
- **Error Tracking**: Sentry 10.27
- **Performance**: Web Vitals 5.1
- **Lighthouse CI**: Automated performance testing

### Testing
- **Test Runner**: Vitest 4.0
- **Testing Library**: React Testing Library 16.3
- **Coverage**: Vitest Coverage V8

---

## 📁 Project Structure

```
my2light-main/
├── components/          # React components (49 files)
│   ├── admin/          # Admin dashboard components
│   ├── features/       # Feature-specific components
│   ├── Layout/         # Layout components (BottomNav, etc)
│   ├── social/         # Social features (ActivityCard, etc)
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts (Notifications)
├── hooks/              # Custom React hooks (7 files)
│   ├── useApi.ts      # API hooks with React Query
│   ├── useMediaRecorder.ts  # Video recording
│   └── ...
├── lib/                # Third-party library configs
│   ├── supabase.ts    # Supabase client
│   ├── queryClient.ts # React Query config
│   └── ...
├── pages/              # Page components (29 files)
│   ├── admin/         # Admin pages
│   ├── social/        # Social pages (Feed, Discover, etc)
│   ├── Home.tsx       # Dashboard
│   ├── Gallery.tsx    # User's video library
│   ├── Profile.tsx    # User profile
│   └── ...
├── services/           # API services (12 files)
│   ├── api.ts         # Main API service
│   ├── social.ts      # Social features API
│   ├── uploadService.ts # Video upload handling
│   └── ...
├── stores/             # Zustand stores (3 files)
│   ├── authStore.ts   # Authentication state
│   └── ...
├── types/              # TypeScript types
│   ├── index.ts       # Main types (User, Court, etc)
│   └── social.ts      # Social feature types
├── migrations/         # Database migrations (23 files)
├── scripts/            # Utility scripts (9 files)
│   ├── performance-analysis.sql
│   ├── clear-database.sql
│   └── seed-realistic-data.sql
├── docs/               # Documentation (11 files)
├── App.tsx             # Root component
├── index.tsx           # Entry point
└── vite.config.ts      # Vite configuration
```

---

## 🔑 Core Features

### 1. Court Discovery & Booking
- **Location**: `pages/Home.tsx`, `pages/CourtDetail.tsx`, `pages/Booking.tsx`
- Search and filter courts by distance, price, rating
- Real-time court availability status
- Package-based booking (Rally Mode, Full Match)
- QR code check-in at courts

### 2. AI-Powered Highlight Recording
- **Location**: `pages/SelfRecording.tsx`, `hooks/useMediaRecorder.ts`
- Self-recording with voice commands
- Automatic highlight capture
- Thumbnail generation
- Background upload with progress tracking
- IndexedDB for offline storage

### 3. Social Networking
- **Location**: `pages/social/`, `services/social.ts`
- Activity feed (global and connections)
- Player connections (follow/unfollow)
- Highlight interactions (like, comment, share)
- Player discovery and suggestions
- Leaderboards (planned)

### 4. User Profile & Gallery
- **Location**: `pages/Profile.tsx`, `pages/Gallery.tsx`
- User statistics (highlights, hours played, courts visited)
- Video library with filters (public/private)
- Booking history
- Membership tiers (free, pro, elite)

### 5. Court Owner Dashboard
- **Location**: `pages/admin/`
- Court management (CRUD)
- Booking management
- Revenue analytics
- Venue recording control (MQTT-based)

---

## 🗄️ Database Schema

### Core Tables
- **profiles**: User profiles (extends auth.users)
- **courts**: Court information
- **court_owners**: Court owner business info
- **bookings**: Court bookings
- **packages**: Booking packages
- **highlights**: User-generated videos

### Social Tables
- **player_connections**: Follow relationships
- **player_activities**: Activity feed entries
- **highlight_interactions**: Likes, views, shares
- **highlight_comments**: Comments on highlights

### Supporting Tables
- **match_requests**: Matchmaking system
- **user_memberships**: Subscription packages
- **transactions**: Payment records
- **notifications**: User notifications
- **video_segments**: Recording segments
- **analytics_cache**: Pre-computed analytics

### Storage Buckets
- **videos**: User-uploaded videos and highlights
- **avatars**: User profile pictures
- **court-images**: Court photos

---

## 🔐 Authentication & Authorization

### Authentication Flow
1. Supabase Auth (email/password, social login)
2. JWT tokens stored in localStorage
3. Auto-refresh on token expiry
4. Protected routes via `ProtectedRoute` component

### Authorization Levels
- **Player**: Default role, can book courts and upload highlights
- **Court Owner**: Can manage courts and bookings
- **Both**: Combined player + owner permissions

### Row Level Security (RLS)
- All tables have RLS policies
- Users can only access their own data
- Public highlights visible to all
- Court owners can view their court bookings

---

## 🚀 Deployment

### Current Setup
- **Hosting**: Vercel (production)
- **Database**: Supabase (cloud PostgreSQL)
- **Storage**: Supabase Storage
- **CDN**: Vercel Edge Network

### Build Process
```bash
npm run build  # TypeScript compile + Vite build
npm run preview # Preview production build
```

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SENTRY_DSN=your_sentry_dsn
```

---

## ⚠️ Known Issues & Limitations

### Performance Issues
1. **Slow Loading**: App runs slowly in production
   - Possible causes: Large bundle size, unoptimized images, excessive re-renders
   - Database may have accumulated test data

2. **Bundle Size**: ~450KB gzipped (could be optimized)

3. **Database**: No data cleanup strategy implemented

### Technical Debt
1. **Code Organization**: Some components are too large (e.g., `SelfRecording.tsx`)
2. **Type Safety**: Some `any` types used in places
3. **Error Handling**: Inconsistent error handling patterns
4. **Testing**: Only 97 tests, coverage incomplete
5. **State Management**: Mix of Zustand and React Query (could be simplified)

### Missing Features
1. **Payment Integration**: Placeholder only
2. **Push Notifications**: Not fully implemented
3. **Video Processing**: No server-side processing (client-side only)
4. **Search**: Basic search, no fuzzy matching or advanced filters
5. **Offline Mode**: Partial implementation

---

## 📊 Performance Metrics

### Lighthouse Scores (Target)
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

### Current Status
- Build time: ~16s
- Bundle size: 451KB (main), 2.8MB total
- Test suite: 97 tests passing

---

## 🔄 Recent Changes (v3.7.0)

1. Fixed Gallery navigation to point to new UI
2. Fixed Community Feed RLS policy
3. Corrected database column names (full_name → name)
4. Added thumbnail generation for self-recorded videos
5. Fixed camera flip functionality
6. Separated Booking History to dedicated page

---

## 📝 Next Steps for Refactoring Team

### Immediate Priorities
1. **Performance Audit**: Run `scripts/performance-analysis.sql`
2. **Database Cleanup**: Use `scripts/clear-database.sql` and `scripts/seed-realistic-data.sql`
3. **Bundle Optimization**: Code splitting, lazy loading, image optimization
4. **Component Refactoring**: Break down large components
5. **Type Safety**: Remove `any` types, add strict type checking

### Recommended Refactoring Areas
1. **State Management**: Consolidate to React Query + Context
2. **API Layer**: Create unified API client with better error handling
3. **Component Library**: Extract reusable components
4. **Testing**: Increase coverage to 80%+
5. **Documentation**: Add JSDoc comments to all public APIs

See `docs/REFACTOR_ROADMAP.md` for detailed plan.

---

## 📞 Support & Resources

- **Repository**: [GitHub](https://github.com/your-org/my2light)
- **Supabase Dashboard**: [Link to dashboard]
- **Sentry**: [Link to Sentry project]
- **Figma Designs**: [Link if available]

---

**Last Updated**: November 30, 2025  
**Prepared for**: Refactoring Team Handoff
