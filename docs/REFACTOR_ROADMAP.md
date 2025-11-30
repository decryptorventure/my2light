# My2Light - Refactoring Roadmap

## 🎯 Executive Summary

This document outlines a comprehensive refactoring plan for My2Light v3.7.0. The current codebase has accumulated technical debt and performance issues that need to be addressed before adding new features.

**Current Status**: Production app running slowly, needs optimization and code cleanup  
**Goal**: Improve performance, maintainability, and developer experience  
**Timeline**: 4-6 weeks (estimated)  
**Priority**: High

---

## 🚨 Critical Issues to Address

### 1. Performance Problems
- **Symptom**: App runs slowly in production
- **Likely Causes**:
  - Large bundle size (451KB main chunk)
  - Unoptimized images
  - Excessive re-renders
  - Database queries without proper indexing
  - No code splitting for large components

### 2. Code Quality Issues
- Large components (e.g., `SelfRecording.tsx` is 400+ lines)
- Inconsistent error handling
- Mix of state management patterns
- Some `any` types in TypeScript
- Incomplete test coverage (97 tests, ~40% coverage)

### 3. Database Issues
- Accumulated test data
- Missing indexes on some queries
- RLS policies too restrictive in some cases

---

## 📋 Refactoring Phases

## Phase 1: Performance Audit & Quick Wins (Week 1)

### Goals
- Identify performance bottlenecks
- Implement quick performance improvements
- Establish performance baseline

### Tasks

#### 1.1 Database Optimization
```sql
-- Run performance analysis
-- File: scripts/performance-analysis.sql

-- Clear test data
-- File: scripts/clear-database.sql

-- Seed realistic data
-- File: scripts/seed-realistic-data.sql
```

**Actions**:
- [ ] Run `performance-analysis.sql` in Supabase
- [ ] Document slow queries
- [ ] Add missing indexes
- [ ] Clear old test data
- [ ] Seed with realistic Vietnamese data

#### 1.2 Bundle Size Optimization
```bash
# Analyze bundle
npm run build
npx vite-bundle-visualizer

# Expected improvements:
# - Remove unused dependencies
# - Code split large routes
# - Lazy load heavy components
```

**Actions**:
- [ ] Analyze bundle composition
- [ ] Remove unused dependencies
- [ ] Implement route-based code splitting
- [ ] Lazy load admin components
- [ ] Target: Reduce main chunk to <300KB

#### 1.3 Image Optimization
**Actions**:
- [ ] Convert images to WebP format
- [ ] Implement responsive images
- [ ] Add lazy loading for images
- [ ] Use Blurhash placeholders
- [ ] Compress thumbnails

#### 1.4 React Performance
**Actions**:
- [ ] Add React.memo to expensive components
- [ ] Optimize useCallback/useMemo usage
- [ ] Reduce unnecessary re-renders
- [ ] Use React DevTools Profiler
- [ ] Target: Reduce render time by 50%

**Expected Outcome**: 30-40% performance improvement

---

## Phase 2: Code Organization & Structure (Week 2-3)

### Goals
- Improve code maintainability
- Establish consistent patterns
- Reduce component complexity

### 2.1 Component Refactoring

#### Break Down Large Components
```
Current:
pages/SelfRecording.tsx (400+ lines)

Refactor to:
pages/SelfRecording.tsx (100 lines)
├── components/recording/RecordingControls.tsx
├── components/recording/VideoPreview.tsx
├── components/recording/UploadProgress.tsx
└── components/recording/ThumbnailCapture.tsx
```

**Actions**:
- [ ] Split `SelfRecording.tsx` into smaller components
- [ ] Extract `Gallery.tsx` filters to separate component
- [ ] Refactor `Profile.tsx` tabs
- [ ] Create reusable form components
- [ ] Target: Max 200 lines per component

#### 2.2 Establish Component Patterns

**Create Component Templates**:
```typescript
// components/templates/PageTemplate.tsx
// Standard page layout with header, content, footer

// components/templates/FormTemplate.tsx
// Standard form with validation and error handling

// components/templates/ListTemplate.tsx
// Standard list with pagination and filtering
```

**Actions**:
- [ ] Create page template component
- [ ] Create form template component
- [ ] Create list template component
- [ ] Migrate existing pages to templates
- [ ] Document component patterns

#### 2.3 Service Layer Refactoring

**Current Issues**:
- Inconsistent error handling
- No request/response interceptors
- Duplicate code across services

**Proposed Structure**:
```typescript
// services/core/apiClient.ts
// Unified API client with interceptors

// services/core/errorHandler.ts
// Centralized error handling

// services/features/
// ├── courtService.ts
// ├── bookingService.ts
// ├── highlightService.ts
// └── socialService.ts
```

**Actions**:
- [ ] Create unified API client
- [ ] Implement error handling middleware
- [ ] Add request/response logging
- [ ] Standardize error responses
- [ ] Add retry logic for failed requests

---

## Phase 3: State Management Consolidation (Week 3-4)

### Goals
- Simplify state management
- Reduce boilerplate
- Improve data flow

### 3.1 React Query Migration

**Current State**:
- Mix of Zustand and React Query
- Some components fetch data directly
- Inconsistent caching strategies

**Target State**:
- React Query for all server state
- Zustand only for UI state
- Consistent caching and refetching

**Actions**:
- [ ] Audit all data fetching
- [ ] Migrate remaining API calls to React Query
- [ ] Standardize query keys
- [ ] Implement optimistic updates
- [ ] Add query invalidation strategies

### 3.2 Zustand Store Cleanup

**Keep in Zustand**:
- Authentication state
- UI preferences
- Modal/drawer state
- Theme settings

**Move to React Query**:
- User profile data
- Courts data
- Bookings data
- Highlights data
- Social data

**Actions**:
- [ ] Remove server state from Zustand
- [ ] Simplify auth store
- [ ] Create UI state store
- [ ] Document state management patterns

---

## Phase 4: Type Safety & Testing (Week 4-5)

### Goals
- Eliminate `any` types
- Increase test coverage to 80%
- Add E2E tests

### 4.1 TypeScript Improvements

**Actions**:
- [ ] Enable strict mode in `tsconfig.json`
- [ ] Remove all `any` types
- [ ] Add proper type guards
- [ ] Use discriminated unions for complex types
- [ ] Add JSDoc comments to public APIs

### 4.2 Testing Strategy

**Current Coverage**: ~40%  
**Target Coverage**: 80%

**Priority Areas**:
1. Services (API, Upload, Social)
2. Custom hooks
3. Critical user flows
4. Form validation

**Actions**:
- [ ] Write tests for all services
- [ ] Test custom hooks
- [ ] Add integration tests
- [ ] Set up E2E testing (Playwright)
- [ ] Configure coverage thresholds

---

## Phase 5: Database & API Optimization (Week 5-6)

### Goals
- Optimize database queries
- Reduce API response times
- Implement proper pagination

### 5.1 Database Optimization

**Actions**:
- [ ] Add composite indexes for common queries
- [ ] Optimize RLS policies
- [ ] Implement database views for complex queries
- [ ] Add query performance monitoring
- [ ] Set up connection pooling

### 5.2 API Optimization

**Actions**:
- [ ] Implement cursor-based pagination
- [ ] Add field selection (GraphQL-style)
- [ ] Reduce payload sizes
- [ ] Implement response caching
- [ ] Add API rate limiting

### 5.3 Real-time Optimization

**Actions**:
- [ ] Optimize Supabase subscriptions
- [ ] Implement connection pooling
- [ ] Add reconnection logic
- [ ] Reduce subscription payload size

---

## Phase 6: Documentation & Handoff (Week 6)

### Goals
- Complete documentation
- Knowledge transfer
- Establish maintenance procedures

### 6.1 Documentation

**Actions**:
- [x] PROJECT_OVERVIEW.md
- [x] ARCHITECTURE.md
- [x] DEVELOPER_GUIDE.md
- [ ] API_REFERENCE.md
- [ ] DATABASE_SCHEMA.md
- [ ] DEPLOYMENT_GUIDE.md
- [ ] TROUBLESHOOTING.md

### 6.2 Code Documentation

**Actions**:
- [ ] Add JSDoc to all public APIs
- [ ] Document complex algorithms
- [ ] Add inline comments for tricky code
- [ ] Create architecture diagrams
- [ ] Document design decisions

---

## 🎯 Success Metrics

### Performance Metrics
- [ ] Lighthouse Performance Score: 90+
- [ ] First Contentful Paint: <1.5s
- [ ] Time to Interactive: <3s
- [ ] Bundle Size: <300KB (main chunk)
- [ ] API Response Time: <200ms (p95)

### Code Quality Metrics
- [ ] Test Coverage: 80%+
- [ ] TypeScript Strict Mode: Enabled
- [ ] ESLint Errors: 0
- [ ] Max Component Size: 200 lines
- [ ] Max Function Complexity: 10

### Developer Experience
- [ ] Build Time: <20s
- [ ] Hot Reload: <1s
- [ ] Test Run Time: <30s
- [ ] Documentation Coverage: 100% (public APIs)

---

## 🚧 Migration Strategy

### Incremental Refactoring
1. **Don't rewrite from scratch**: Refactor incrementally
2. **Feature flags**: Use flags for major changes
3. **Parallel development**: Keep main branch stable
4. **Continuous testing**: Run tests after each change
5. **Gradual rollout**: Deploy changes in small batches

### Risk Mitigation
1. **Backup database**: Before any schema changes
2. **Feature flags**: For risky changes
3. **Rollback plan**: Document rollback procedures
4. **Monitoring**: Watch Sentry for new errors
5. **Gradual rollout**: Deploy to staging first

---

## 📊 Effort Estimation

| Phase | Duration | Complexity | Priority |
|-------|----------|------------|----------|
| Phase 1: Performance Audit | 1 week | Medium | Critical |
| Phase 2: Code Organization | 2 weeks | High | High |
| Phase 3: State Management | 1 week | Medium | High |
| Phase 4: Type Safety & Testing | 1 week | Medium | Medium |
| Phase 5: Database & API | 1 week | High | High |
| Phase 6: Documentation | 1 week | Low | Medium |

**Total**: 6-8 weeks (with 1-2 developers)

---

## 🔧 Tools & Resources

### Required Tools
- [ ] Vite Bundle Visualizer
- [ ] React DevTools Profiler
- [ ] Lighthouse CI
- [ ] Playwright (E2E testing)
- [ ] Database query analyzer

### Recommended Reading
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Supabase Performance Guide](https://supabase.com/docs/guides/database/performance)
- [Web Vitals](https://web.dev/vitals/)

---

## 📝 Next Steps

### Immediate Actions (This Week)
1. Run `scripts/performance-analysis.sql`
2. Clear test data with `scripts/clear-database.sql`
3. Seed realistic data with `scripts/seed-realistic-data.sql`
4. Analyze bundle size
5. Create refactoring branch

### Week 1 Deliverables
- Performance audit report
- Database optimization plan
- Bundle size reduction (target: -30%)
- Quick wins implemented

---

## ⚠️ Important Notes

1. **Don't break production**: All changes must be backward compatible
2. **Test thoroughly**: Every change needs tests
3. **Document decisions**: Keep ADR (Architecture Decision Records)
4. **Communicate**: Regular updates to stakeholders
5. **Measure impact**: Track metrics before and after

---

**Last Updated**: November 30, 2025  
**Status**: Ready for Review  
**Next Review**: After Phase 1 completion
