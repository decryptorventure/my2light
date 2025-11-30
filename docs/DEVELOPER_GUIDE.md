# My2Light - Developer Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git
- Supabase account
- Code editor (VS Code recommended)

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/your-org/my2light.git
cd my2light-main

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Configure environment variables
# Edit .env with your Supabase credentials

# 5. Start development server
npm run dev
```

### Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Sentry (optional)
VITE_SENTRY_DSN=your-sentry-dsn

# Firebase (optional, for push notifications)
VITE_FIREBASE_API_KEY=your-firebase-key
VITE_FIREBASE_PROJECT_ID=your-project-id
```

---

## 📁 Project Structure Deep Dive

### Component Organization

```
components/
├── admin/              # Admin-only components
│   ├── layout/
│   │   └── AdminLayout.tsx
│   ├── CourtForm.tsx
│   └── VenueControl.tsx
│
├── features/           # Feature-specific components
│   ├── SearchBar.tsx
│   ├── FilterPanel.tsx
│   └── CourtCard.tsx
│
├── Layout/             # App layout components
│   ├── BottomNav.tsx   # Main navigation
│   ├── PageTransition.tsx
│   └── IOSInstallPrompt.tsx
│
├── social/             # Social feature components
│   ├── ActivityCard.tsx
│   ├── CommentSection.tsx
│   └── PlayerCard.tsx
│
└── ui/                 # Reusable UI primitives
    ├── Button.tsx
    ├── Card.tsx
    ├── Modal.tsx
    ├── Toast.tsx
    └── LoadingSpinner.tsx
```

### Service Layer

```
services/
├── api.ts              # Main API service (courts, bookings, etc)
├── social.ts           # Social features (feed, connections)
├── uploadService.ts    # Video upload handling
├── videoStorage.ts     # IndexedDB video storage
└── notifications.ts    # Push notifications
```

### Hooks

```
hooks/
├── useApi.ts           # React Query hooks for API
├── useMediaRecorder.ts # Video recording hook
├── useNotifications.ts # Notification management
└── useInfiniteScroll.ts # Infinite scroll pagination
```

---

## 🔧 Development Workflow

### Running the App

```bash
# Development mode (hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Lint code
npm run lint

# Format code
npm run format
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: code style changes (formatting)
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

---

## 🗄️ Database Development

### Running Migrations

```bash
# In Supabase SQL Editor, run migrations in order:
# 1. migrations/000_complete_schema.sql
# 2. migrations/001_court_management.sql
# 3. migrations/002_security_policies.sql
# ... and so on
```

### Creating New Migrations

```sql
-- migrations/016_your_migration_name.sql
-- =====================================================
-- Migration 016: Description
-- =====================================================

-- Your SQL here
ALTER TABLE your_table ADD COLUMN new_column TEXT;

-- Create index
CREATE INDEX idx_your_index ON your_table(new_column);

-- Update RLS policies if needed
CREATE POLICY "policy_name" ON your_table FOR SELECT USING (true);
```

### Database Best Practices

1. **Always use migrations**: Never modify schema directly in production
2. **Test locally first**: Use Supabase local development
3. **Add indexes**: For frequently queried columns
4. **Enable RLS**: All tables must have Row Level Security
5. **Use transactions**: For multi-step operations

---

## 🎨 UI Development

### Component Pattern

```typescript
// components/ui/YourComponent.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface YourComponentProps {
  title: string;
  onAction?: () => void;
}

export const YourComponent: React.FC<YourComponentProps> = ({ 
  title, 
  onAction 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 bg-slate-800 rounded-lg"
    >
      <h2 className="text-xl font-bold">{title}</h2>
      {onAction && (
        <button onClick={onAction} className="mt-2">
          Action
        </button>
      )}
    </motion.div>
  );
};
```

### Styling Guidelines

1. **Use Tailwind classes**: Prefer utility classes over custom CSS
2. **Follow design system**: Use consistent spacing, colors, typography
3. **Mobile-first**: Design for mobile, enhance for desktop
4. **Dark mode**: All components should work in dark mode
5. **Accessibility**: Use semantic HTML, ARIA labels

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#84cc16',    // lime-400
        secondary: '#3b82f6',  // blue-500
        danger: '#ef4444',     // red-500
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

---

## 🔌 API Development

### Creating New API Endpoints

```typescript
// services/api.ts
export const ApiService = {
  // ... existing methods
  
  // New method
  async getYourData(params: YourParams): Promise<ApiResponse<YourData>> {
    try {
      const { data, error } = await supabase
        .from('your_table')
        .select('*')
        .eq('field', params.value);
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error: any) {
      console.error('Error fetching data:', error);
      return { success: false, error: error.message };
    }
  },
};
```

### Creating React Query Hooks

```typescript
// hooks/useApi.ts
export const useYourData = (params: YourParams) => {
  return useQuery({
    queryKey: ['yourData', params],
    queryFn: () => ApiService.getYourData(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!params.value, // Only run if params exist
  });
};
```

### Usage in Components

```typescript
// pages/YourPage.tsx
const YourPage: React.FC = () => {
  const { data, isLoading, error } = useYourData({ value: 'test' });
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{/* Render data */}</div>;
};
```

---

## 🧪 Testing

### Writing Tests

```typescript
// components/ui/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test Button.test.tsx

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

---

## 🐛 Debugging

### React Query Devtools

```typescript
// Already configured in App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Available in development mode
// Press Ctrl+Shift+K to toggle
```

### Sentry Error Tracking

```typescript
// Errors are automatically captured
// Manual error reporting:
import * as Sentry from '@sentry/react';

try {
  // Your code
} catch (error) {
  Sentry.captureException(error);
}
```

### Browser DevTools

1. **React DevTools**: Inspect component tree
2. **Network Tab**: Monitor API calls
3. **Application Tab**: Check localStorage, IndexedDB
4. **Console**: View logs and errors

---

## 📦 Building & Deployment

### Production Build

```bash
# Build for production
npm run build

# Output: dist/ folder
# - index.html
# - assets/ (JS, CSS, images)
# - sw.js (service worker)
```

### Deployment Checklist

- [ ] Update version in `package.json`
- [ ] Run tests: `npm test`
- [ ] Build locally: `npm run build`
- [ ] Check bundle size
- [ ] Update environment variables
- [ ] Run database migrations
- [ ] Deploy to Vercel
- [ ] Test production build
- [ ] Monitor Sentry for errors

---

## 🔍 Code Quality

### ESLint Configuration

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Pre-commit Hooks

```json
// .lintstagedrc.json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ]
}
```

---

## 🚨 Common Issues & Solutions

### Issue: Supabase Connection Error

```
Error: Invalid API key
```

**Solution**: Check `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Issue: Build Fails with TypeScript Errors

```
Error: Type 'X' is not assignable to type 'Y'
```

**Solution**: 
1. Check `types.ts` for type definitions
2. Use `as` type assertion if necessary
3. Fix type mismatches

### Issue: React Query Not Refetching

**Solution**:
```typescript
// Force refetch
queryClient.invalidateQueries({ queryKey: ['yourKey'] });

// Or use refetch function
const { refetch } = useYourData();
refetch();
```

### Issue: IndexedDB Quota Exceeded

**Solution**:
```typescript
// Clear old video chunks
await VideoStorage.clearOldSessions(7); // Keep last 7 days
```

---

## 📚 Resources

### Documentation
- [React Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Tools
- [VS Code](https://code.visualstudio.com/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Supabase Studio](https://supabase.com/dashboard)
- [Sentry Dashboard](https://sentry.io/)

---

## 🤝 Contributing

### Pull Request Process

1. Create feature branch
2. Make changes
3. Write/update tests
4. Update documentation
5. Run linter and tests
6. Create PR with description
7. Wait for review
8. Address feedback
9. Merge when approved

### Code Review Checklist

- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] No TypeScript `any` types
- [ ] Accessibility considered
- [ ] Performance considered

---

**Last Updated**: November 30, 2025  
**For Questions**: Contact development team
