# Release Notes v3.7.0

## Advanced Features: PWA & Recording Infrastructure

**Release Date:** November 29, 2025

### 🎯 Major Features

#### 1. Progressive Web App (PWA) Support
- ✅ Configured `vite-plugin-pwa` for offline-first capability
- ✅ Installable app experience on all platforms
- ✅ Service Worker with precaching (49 entries)
- ✅ ReloadPrompt component for seamless updates

#### 2. Self-Recording Infrastructure (Hybrid Strategy)
- ✅ **Full Match Recording** with `MediaRecorder` API
  - Support for WebM VP9 codec with MP4 fallback
  - 10-second chunking for resilience
  - IndexedDB-based offline storage
- ✅ **Highlight Timestamp Capture**
  - Manual highlight marking during recording
  - Voice trigger support (future enhancement ready)
- ✅ **Background Upload Service**
  - Automatic upload of chunks + metadata to Supabase Storage
  - Resilient retry logic
  - Progress tracking

#### 3. Venue Recording (MQTT Infrastructure)
- ✅ MQTT broker connection for real-time communication
- ✅ Camera Agent simulator for development
- ✅ VenueControl admin component
  - Live camera status monitoring
  - Start/Stop/Highlight commands
  - Real-time connection status
- ✅ Integrated into Admin Dashboard

#### 4. Cloud Processing Preparation
- ✅ Cloud Worker Simulator (FFmpeg processing pipeline)
- ✅ Architecture ready for highlight extraction based on timestamps

###  🛠️ Technical Improvements

#### File Structure Consolidation
- Fixed inconsistent directory structure
- Moved all source files to root-level directories (`hooks/`, `services/`, `components/`, `lib/`)
- Updated all import paths for consistency
- Removed duplicate files

#### Type Safety Enhancements
- Added PWA type declarations (`types/pwa.d.ts`)
- Fixed all TypeScript compilation errors
- Improved type annotations in test files

#### Build Optimization
- Build size: 1.4 MB (gzipped)
- Code splitting implemented
- Vendor chunks optimized:
  - `qr-scanner`: 100 KB (gzipped)
  - `supabase`: 45.76 KB (gzipped)
  - `react-vendor`: 54.04 KB (gzipped)

### ✅ Quality Assurance

- **Tests:** 97 tests passing across 13 test files
- **Coverage:** 62.67% overall code coverage
- **Build:** Clean production build (no errors)
- **TypeScript:** Full type safety maintained

###  📦 Dependencies Added

- `@types/node`: For Node.js type definitions
- `vite-plugin-pwa`: PWA support and Service Worker generation
- `mqtt`: Real-time communication with venue cameras

### Breaking Changes

None. This release is fully backward compatible.

### 🐛 Bug Fixes

- Fixed `useMediaRecorder` hook missing properties
- Fixed duplicate import paths in Gallery and CourtsManagement
- Fixed duplicate `eq` property in test mocks
- Fixed PWA virtual module type declarations

### 🔄 Migration Guide

No migration required. Simply pull the latest code and rebuild.

### 📝 Notes

- **Cloud Processing:** Currently simulated. Production FFmpeg deployment requires serverless function setup
- **MQTT Broker:** Requires external MQTT broker configuration for production venue cameras
- **IndexedDB:** Storage quota limits apply based on browser (typically 50% of available disk space)

### 🚀 Next Steps (Phase 6 - Planned)

1. **Actual Cloud Processing**
   - Deploy FFmpeg worker to serverless platform
   - Implement S3/Storage bucket integration
   - Set up webhook notifications

2. **Enhanced UI/UX**
   - Real-time upload progress indicators
   - Video preview during recording
   - Highlight clip playback

3. **Production MQTT Setup**
   - Deploy MQTT broker (Mosquitto/EMQ X)
   - Secure authentication
   - WebSocket support for browser clients

4. **AI Highlight Detection**
   - Integrate ML model for automatic highlight detection
   - Score-based ranking system
   - Smart thumbnail generation

---

**Full Changelog:** v3.6.0...v3.7.0
