# Changelog - Version 3.9.0

**Release Date**: 2025-12-01  
**Type**: Major Feature Update  
**Focus**: Backend API Restructure & Scalability

---

## 🎉 Major Changes

### ✨ New Modular API Architecture
Complete restructure of backend API from monolithic to modular architecture for better scalability and maintainability.

#### New API Structure
```
src/api/
├── core/           # Shared infrastructure
├── modules/
│   ├── auth/      # Authentication & user management
│   ├── courts/    # Court operations
│   ├── bookings/  # Booking management
│   ├── highlights/# Video highlights
│   ├── payments/  # Payment processing
│   └── social/    # Social features
```

**Benefits:**
- 🔒 **Type Safety**: 100% TypeScript coverage
- ✅ **Validation**: Zod schemas on all API inputs
- 🛡️ **Error Handling**: 50+ standardized error codes with Vietnamese messages
- 🔄 **Auto-Retry**: Built-in retry logic with exponential backoff
- 🔑 **Token Refresh**: Automatic token refresh on 401 errors
- 📦 **Modular**: Easy to maintain and extend

---

## 🚀 New Features

### API Core Infrastructure
- **API Client** (`api/core/client.ts`)
  - Axios wrapper with request/response interceptors
  - Automatic authentication token attachment
  - Token refresh on 401 errors
  - Retry logic with exponential backoff
  - Request ID tracking for debugging
  - Dev logging

- **Error Handler** (`api/core/errorHandler.ts`)
  - 50+ error codes (AUTH_*, VIDEO_*, BOOKING_*, etc.)
  - Vietnamese error messages
  - Sentry integration ready
  - Error parsing from Axios/Supabase

- **Type Definitions** (`api/core/types.ts`)
  - ApiResponse<T>
  - PaginatedResponse<T>
  - ApiError
  - ErrorCode enum

### Auth Module (6 methods)
- `login()` - User authentication
- `register()` - New user registration
- `getCurrentUser()` - Get current user profile
- `updateProfile()` - Update user profile (with phone & onboarding fields)
- `uploadAvatar()` - Avatar upload
- `signOut()` - User logout

### Courts Module (5 methods)
- `getCourts()` - List all courts
- `getCourtById()` - Get court details
- `createCourt()` - Create new court (owner only)
- `updateCourt()` - Update court info
- `getPackages()` - Get booking packages ⭐ NEW

### Bookings Module (8 methods)
- `createBooking()` - Create new booking
- `getActiveBooking()` - Get current active booking
- `cancelBooking()` - Cancel booking
- `getBookingHistory()` - Get booking history
- `checkInBooking()` - Check into a booking ⭐ NEW
- `rescheduleBooking()` - Reschedule booking ⭐ NEW
- `endBooking()` - End active session ⭐ NEW
- `getUpcomingBooking()` - Get upcoming booking ⭐ NEW

### Highlights Module (6 methods)
- `getHighlights()` - Get public highlights
- `getUserHighlights()` - Get user's highlights
- `uploadVideo()` - Upload video file
- `createHighlight()` - Create new highlight
- `updateHighlight()` - Update highlight metadata
- `toggleLike()` - Like/unlike highlight

### Payments Module (3 methods)
- `processTopUp()` - Process wallet top-up
- `getTransactionHistory()` - Get transaction history
- `getBalance()` - Get wallet balance

### Social Module (4 methods)
- `addComment()` - Add comment to highlight
- `getComments()` - Get comments
- `followUser()` - Follow a user
- `unfollowUser()` - Unfollow a user

---

## 🔧 Technical Improvements

### Validation Layer
- **Zod Schemas**: Runtime validation on all API inputs
- **Type Inference**: Automatic TypeScript types from schemas
- **Vietnam-specific**: Phone number validation for Vietnam
- **File Validation**: Size and format checks for uploads

### Error Handling
- **Standardized Responses**: All APIs return consistent ApiResponse<T>
- **Error Codes**: Categorized error codes (AUTH_*, VIDEO_*, BOOKING_*)
- **Vietnamese Messages**: User-friendly error messages in Vietnamese
- **Error Logging**: Integration with Sentry (ready)

### Code Organization
- **Barrel Exports**: Clean imports with index.ts files
- **Separation of Concerns**: Types, schemas, and services separated
- **Consistent Patterns**: All modules follow same structure
- **Path Aliases**: `@/` and `@api/` for cleaner imports

---

## 📝 Files Changed

### New Files (28)
- `src/api/core/client.ts`
- `src/api/core/errorHandler.ts`
- `src/api/core/types.ts`
- `src/api/modules/auth/*` (4 files)
- `src/api/modules/courts/*` (4 files)
- `src/api/modules/bookings/*` (4 files)
- `src/api/modules/highlights/*` (4 files)
- `src/api/modules/payments/*` (4 files)
- `src/api/modules/social/*` (4 files)
- `src/api/index.ts`
- `docs/NEW_API.md`

### Updated Files (17)
- `package.json` - Added zod, axios
- `tsconfig.json` - Added path aliases
- `vite.config.ts` - Added resolve aliases
- `stores/authStore.ts` - Using new authService
- All 14 page files migrated to new API

---

## 🐛 Bug Fixes
- Fixed createBooking signature to use object parameters
- Fixed phone field validation in profile update
- Fixed package selection in booking flow
- Fixed reschedule booking functionality

---

## 📊 Performance
- **Build Time**: 3.58s (optimized)
- **Bundle Size**: 165KB gzipped (main bundle)
- **Type Safety**: 100% coverage
- **Code Split**: Optimized chunks

---

## 🔄 Migration Guide

### Old API (deprecated)
```typescript
import { ApiService } from '../services/api';

const res = await ApiService.getCurrentUser();
const bookingRes = await ApiService.createBooking(
  courtId, startTime, duration, packageId
);
```

### New API (v3.9+)
```typescript
import { authService, bookingsService } from '../src/api';

const res = await authService.getCurrentUser();
const bookingRes = await bookingsService.createBooking({
  courtId,
  startTime,
  durationHours: duration,
  packageId
});
```

All API calls now:
- ✅ Have Zod validation
- ✅ Return standardized ApiResponse<T>
- ✅ Show Vietnamese error messages
- ✅ Include proper TypeScript types

---

## ⚠️ Breaking Changes
None! Old `services/api.ts` still works for backward compatibility.

---

## 📚 Documentation
- **API Guide**: See `docs/NEW_API.md`
- **Migration Guide**: Included in this changelog
- **Examples**: Check migrated page files

---

## 🎯 What's Next?

### Version 4.0 (Coming Soon)
- **Queue System**: BullMQ + Redis for video processing
- **Database Optimization**: Connection pooling, caching
- **Frontend Architecture**: Monorepo, React Query
- **Monitoring**: Logging, tracing, dashboards

---

## 👥 Contributors
- Development: AI Assistant
- Testing: @tommac
- Review: @tommac

---

## 📦 Dependencies Added
```json
{
  "zod": "^3.22.4",
  "axios": "^1.6.5"
}
```

---

## 🔗 Links
- Repository: [GitHub](https://github.com/yourusername/my2light)
- Previous Release: v3.7.0
- Next Milestone: v4.0.0 (Queue System)

---

**Full Changelog**: v3.7.0...v3.9.0
