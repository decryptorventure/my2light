# My2Light - System Architecture

## 🏛️ Architecture Overview

My2Light follows a **modern JAMstack architecture** with a React frontend, Supabase backend, and edge deployment.

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   React    │  │  Zustand   │  │   React    │            │
│  │ Components │  │   Store    │  │   Query    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│         │              │                 │                   │
│         └──────────────┴─────────────────┘                   │
│                        │                                     │
└────────────────────────┼─────────────────────────────────────┘
                         │
                    API Layer
                         │
┌────────────────────────┼─────────────────────────────────────┐
│                   SERVICE LAYER                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │    API     │  │   Social   │  │   Upload   │            │
│  │  Service   │  │  Service   │  │  Service   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└────────────────────────┼─────────────────────────────────────┘
                         │
                    Supabase SDK
                         │
┌────────────────────────┼─────────────────────────────────────┐
│                   SUPABASE LAYER                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │ PostgreSQL │  │    Auth    │  │  Storage   │            │
│  │  Database  │  │   (JWT)    │  │  (S3-like) │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐                             │
│  │  Realtime  │  │  Functions │                             │
│  │ (WebSocket)│  │ (Edge Fns) │                             │
│  └────────────┘  └────────────┘                             │
└──────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Architecture

### Component Hierarchy

```
App.tsx (Root)
├── Router (HashRouter)
│   ├── Layout Components
│   │   ├── BottomNav
│   │   ├── IOSInstallPrompt
│   │   └── NotificationPermissionPrompt
│   │
│   ├── Pages
│   │   ├── Home (Dashboard)
│   │   ├── Gallery (User Library)
│   │   ├── Profile
│   │   ├── SelfRecording
│   │   ├── Social/
│   │   │   ├── Feed
│   │   │   ├── Discover
│   │   │   └── Connections
│   │   └── Admin/
│   │       ├── Dashboard
│   │       ├── CourtsManagement
│   │       └── BookingsManagement
│   │
│   └── Providers
│       ├── QueryClientProvider (React Query)
│       ├── NotificationProvider
│       ├── ToastProvider
│       └── ErrorBoundary
```

### Component Categories

#### 1. Layout Components (`components/Layout/`)
- **BottomNav**: Main navigation bar
- **PageTransition**: Animated page transitions
- **IOSInstallPrompt**: PWA install prompt for iOS

#### 2. Feature Components (`components/features/`)
- **SearchBar**: Court search
- **FilterPanel**: Court filtering
- **CourtCard**: Court display card
- **HighlightCard**: Video highlight card

#### 3. Social Components (`components/social/`)
- **ActivityCard**: Activity feed item
- **CommentSection**: Comments UI
- **PlayerCard**: Player profile card

#### 4. UI Components (`components/ui/`)
- **Button**: Reusable button
- **Card**: Container component
- **Modal**: Modal dialog
- **Toast**: Notification toast
- **LoadingSpinner**: Loading indicator
- **Skeleton**: Loading skeleton
- **ErrorBoundary**: Error handling

#### 5. Admin Components (`components/admin/`)
- **AdminLayout**: Admin dashboard layout
- **CourtForm**: Court creation/edit form
- **BookingTable**: Booking list table
- **VenueControl**: MQTT camera control

---

## 🔄 Data Flow Architecture

### State Management Strategy

```
┌──────────────────────────────────────────────────────────┐
│                    STATE LAYERS                           │
├──────────────────────────────────────────────────────────┤
│  1. Server State (React Query)                           │
│     - API data caching                                   │
│     - Automatic refetching                               │
│     - Optimistic updates                                 │
│                                                           │
│  2. Global Client State (Zustand)                        │
│     - Authentication state                               │
│     - User preferences                                   │
│     - UI state (modals, etc)                             │
│                                                           │
│  3. Local Component State (useState)                     │
│     - Form inputs                                        │
│     - UI toggles                                         │
│     - Temporary data                                     │
│                                                           │
│  4. Context State (React Context)                        │
│     - Notifications                                      │
│     - Theme (if implemented)                             │
└──────────────────────────────────────────────────────────┘
```

### React Query Usage

```typescript
// Example: useHighlights hook
const { data: highlights, isLoading } = useQuery({
  queryKey: ['highlights', userId],
  queryFn: () => ApiService.getHighlights(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

**Benefits**:
- Automatic caching and deduplication
- Background refetching
- Optimistic updates
- Loading and error states

### Zustand Store Pattern

```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (credentials) => { /* ... */ },
  logout: async () => { /* ... */ },
}));
```

---

## 🗄️ Database Architecture

### Entity Relationship Diagram

```
┌─────────────┐
│   profiles  │ (extends auth.users)
└──────┬──────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌─────────────┐  ┌──────────────┐
│  highlights │  │player_connect│
│             │  │    ions      │
└──────┬──────┘  └──────┬───────┘
       │                │
       ├────────┐       │
       │        │       │
       ▼        ▼       ▼
┌──────────┐ ┌────────────┐
│highlight_│ │  player_   │
│interactions│ │ activities │
└──────────┘ └────────────┘
       │
       ▼
┌──────────┐
│highlight_│
│ comments │
└──────────┘

┌─────────────┐
│court_owners │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   courts    │
└──────┬──────┘
       │
       ├──────────┐
       │          │
       ▼          ▼
┌──────────┐ ┌──────────┐
│ bookings │ │highlights│
└──────────┘ └──────────┘
```

### Key Relationships

1. **User → Highlights**: One-to-Many
2. **User → Connections**: Many-to-Many (self-referencing)
3. **User → Bookings**: One-to-Many
4. **Court → Bookings**: One-to-Many
5. **Highlight → Interactions**: One-to-Many
6. **Highlight → Comments**: One-to-Many

### Indexing Strategy

```sql
-- Performance-critical indexes
CREATE INDEX idx_highlights_user_id ON highlights(user_id);
CREATE INDEX idx_highlights_created_at ON highlights(created_at DESC);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_player_activities_created ON player_activities(created_at DESC);
```

---

## 🔌 API Architecture

### Service Layer Pattern

```typescript
// services/api.ts
export const ApiService = {
  // Courts
  getCourts: () => supabase.from('courts').select('*'),
  getCourtById: (id) => supabase.from('courts').select('*').eq('id', id).single(),
  
  // Highlights
  getHighlights: (limit) => supabase.from('highlights').select('*').limit(limit),
  
  // Bookings
  createBooking: (data) => supabase.from('bookings').insert(data),
};

// services/social.ts
export const SocialService = {
  getFeed: (page, limit) => { /* ... */ },
  followPlayer: (userId) => { /* ... */ },
  likeHighlight: (highlightId) => { /* ... */ },
};
```

### API Call Flow

```
Component
    │
    ▼
Custom Hook (useApi.ts)
    │
    ▼
React Query
    │
    ▼
Service Layer (api.ts, social.ts)
    │
    ▼
Supabase Client
    │
    ▼
Supabase API (REST/GraphQL)
    │
    ▼
PostgreSQL Database
```

---

## 🎬 Video Recording Architecture

### Self-Recording Flow

```
User Starts Recording
    │
    ▼
MediaRecorder API
    │
    ├─→ Video Stream (getUserMedia)
    │   └─→ Thumbnail Capture (Canvas API)
    │
    ▼
Chunk Generation (5s intervals)
    │
    ▼
IndexedDB Storage (Offline-first)
    │
    ▼
Background Upload Queue
    │
    ├─→ Upload Video Chunks
    ├─→ Upload Thumbnail
    └─→ Upload Metadata
    │
    ▼
Supabase Storage
    │
    ▼
Database Record Creation
```

### Upload Service Pattern

```typescript
// services/uploadService.ts
class UploadService {
  async uploadSession(sessionId, onProgress, thumbnailBlob) {
    // 1. Get chunks from IndexedDB
    const chunks = await VideoStorage.getAllChunksForSession(sessionId);
    
    // 2. Upload chunks in parallel
    await Promise.all(chunks.map(chunk => 
      supabase.storage.from('videos').upload(path, chunk.blob)
    ));
    
    // 3. Upload thumbnail
    await supabase.storage.from('videos').upload(thumbPath, thumbnailBlob);
    
    // 4. Create database record
    await supabase.from('highlights').insert({ /* ... */ });
  }
}
```

---

## 🔒 Security Architecture

### Authentication Flow

```
1. User Login
   │
   ▼
2. Supabase Auth
   │
   ├─→ JWT Token Generation
   │   └─→ Access Token (1 hour)
   │   └─→ Refresh Token (7 days)
   │
   ▼
3. Token Storage (localStorage)
   │
   ▼
4. Auto-refresh on Expiry
   │
   ▼
5. Authenticated Requests
   │
   └─→ Authorization: Bearer <token>
```

### Row Level Security (RLS)

```sql
-- Example: Highlights table
CREATE POLICY "Users can view public highlights"
  ON highlights FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own highlights"
  ON highlights FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Security Best Practices
1. ✅ All tables have RLS enabled
2. ✅ JWT tokens auto-refresh
3. ✅ Sensitive data encrypted at rest
4. ✅ HTTPS only in production
5. ⚠️ API keys in environment variables (not committed)

---

## 📱 PWA Architecture

### Service Worker Strategy

```javascript
// Workbox configuration
{
  registerType: 'autoUpdate',
  strategies: {
    // Cache-first for static assets
    assets: 'CacheFirst',
    
    // Network-first for API calls
    api: 'NetworkFirst',
    
    // Stale-while-revalidate for images
    images: 'StaleWhileRevalidate',
  }
}
```

### Offline Capabilities

1. **Static Assets**: Cached on install
2. **API Responses**: Cached with React Query
3. **Video Chunks**: Stored in IndexedDB
4. **Background Sync**: Upload when online

---

## 🚀 Deployment Architecture

### Build Pipeline

```
GitHub Push
    │
    ▼
Vercel Build Trigger
    │
    ├─→ Install Dependencies
    ├─→ TypeScript Compile
    ├─→ Vite Build
    ├─→ Generate Service Worker
    └─→ Optimize Assets
    │
    ▼
Deploy to Edge Network
    │
    └─→ Global CDN Distribution
```

### Environment Configuration

```
Development:  localhost:5173
Staging:      staging.my2light.app (if exists)
Production:   my2light.app
```

---

## 📊 Monitoring Architecture

### Error Tracking (Sentry)

```typescript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new BrowserTracing(),
    new Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
});
```

### Performance Monitoring

1. **Web Vitals**: LCP, FID, CLS tracking
2. **Lighthouse CI**: Automated performance audits
3. **React Query Devtools**: Query performance
4. **Sentry Performance**: Transaction tracking

---

## 🔄 Real-time Architecture

### Supabase Realtime

```typescript
// Example: Live booking updates
const subscription = supabase
  .channel('bookings')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'bookings' },
    (payload) => {
      // Update UI with new booking
    }
  )
  .subscribe();
```

### Use Cases
1. Court availability updates
2. New activity feed items
3. Booking confirmations
4. Chat messages (future)

---

## 🎯 Performance Optimization Strategies

### Current Optimizations
1. ✅ Code splitting (lazy loading routes)
2. ✅ Image lazy loading
3. ✅ React Query caching
4. ✅ Memoization (useMemo, useCallback)
5. ✅ Virtual scrolling (react-window)

### Recommended Improvements
1. ⚠️ Bundle size reduction (tree shaking)
2. ⚠️ Image optimization (WebP, responsive images)
3. ⚠️ Database query optimization
4. ⚠️ Reduce re-renders (React.memo)
5. ⚠️ Implement pagination everywhere

---

**Last Updated**: November 30, 2025  
**Architecture Version**: 3.7.0
