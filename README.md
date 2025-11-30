# My2Light - Badminton Court Management & Social Platform

[![Version](https://img.shields.io/badge/version-3.7.0-blue.svg)](docs/RELEASE_NOTES_v3.7.md)
[![Status](https://img.shields.io/badge/status-production-green.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![Tests](https://img.shields.io/badge/tests-97%20passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)]()
[![React](https://img.shields.io/badge/React-18-blue.svg)]()

**My2Light** is a comprehensive mobile-first web application for badminton players and court owners in Vietnam. It combines court booking, AI-powered highlight recording, and social networking features.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Modern browser (Chrome/Edge/Safari 14.1+)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd my2light-main

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

Visit `http://localhost:5173` to see the app.

## ✨ Key Features

### For Players
- 🏸 **Court Discovery**: Find nearby badminton courts with filters
- 📅 **Easy Booking**: Book courts with Rally Mode or Full Match packages
- 🎥 **Self-Recording**: Record matches with AI voice commands
- 📱 **Social Feed**: Share highlights and connect with players
- 📊 **Statistics**: Track your playing history and achievements

### For Court Owners
- 🏢 **Court Management**: Manage multiple courts and facilities
- 📈 **Analytics Dashboard**: Revenue and occupancy insights
- 🎬 **Venue Recording**: MQTT-based camera control
- 💰 **Booking Management**: Handle reservations efficiently

## 📚 Documentation

### Essential Reading
- **[Project Overview](docs/PROJECT_OVERVIEW.md)** - Business context, tech stack, features
- **[Architecture](docs/ARCHITECTURE.md)** - System design and data flow
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** - Setup, development workflow, testing
- **[Database Schema](docs/DATABASE_SCHEMA.md)** - Complete database documentation
- **[Refactor Roadmap](docs/REFACTOR_ROADMAP.md)** - Performance optimization plan

### Additional Docs
- [Release Notes v3.7](docs/RELEASE_NOTES_v3.7.md)
- [Release Notes v3.6](docs/RELEASE_NOTES_v3.6.md)

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **State**: Zustand + TanStack Query
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **PWA**: Vite PWA Plugin + IndexedDB
- **Monitoring**: Sentry + Web Vitals
- **Testing**: Vitest + React Testing Library

## 🗄️ Database Setup

### Quick Setup

```bash
# Run migrations in Supabase SQL Editor (in order):
migrations/000_complete_schema.sql
migrations/001_court_management.sql
migrations/002_security_policies.sql
migrations/003_courts_extended_schema.sql
migrations/004_analytics_social.sql
migrations/005_production_hotfix.sql
# ... continue through migration 015
```

### Performance Scripts

```bash
# Analyze performance
scripts/performance-analysis.sql

# Clear test data
scripts/clear-database.sql

# Seed realistic data
scripts/seed-realistic-data.sql
```

See [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for complete schema documentation.

## ⚙️ Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Sentry (optional)
VITE_SENTRY_DSN=your-sentry-dsn

# Firebase (optional)
VITE_FIREBASE_API_KEY=your-firebase-key
VITE_FIREBASE_PROJECT_ID=your-project-id
```

## 🧪 Development

```bash
# Development server
npm run dev

# Build for production
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

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy dist/ folder to Vercel
```

### Database Migrations
Run SQL files in Supabase SQL Editor in numerical order.

### Storage Buckets
Create these buckets in Supabase:
- `videos` (private, 100MB limit)
- `avatars` (public, 5MB limit)
- `court-images` (public, 10MB limit)

See [Developer Guide](docs/DEVELOPER_GUIDE.md#deployment) for detailed instructions.

## 📁 Project Structure

```
my2light-main/
├── components/         # React components (49 files)
│   ├── admin/         # Admin dashboard
│   ├── features/      # Feature components
│   ├── Layout/        # Layout components
│   ├── social/        # Social features
│   └── ui/            # Reusable UI
├── hooks/             # Custom React hooks (7 files)
├── pages/             # Page components (29 files)
├── services/          # API services (12 files)
├── stores/            # Zustand stores (3 files)
├── types/             # TypeScript types
├── migrations/        # Database migrations (23 files)
├── scripts/           # Utility scripts (9 files)
└── docs/              # Documentation (11 files)
```

## 🐛 Troubleshooting

### Common Issues

**Camera not working?**
- Use HTTPS (required for getUserMedia)
- Check browser permissions
- Try Chrome/Edge (best support)

**Build errors?**
```bash
rm -rf node_modules dist
npm install
npm run build
```

**Database connection issues?**
- Verify `.env` credentials
- Check Supabase project status
- Review RLS policies

See [Developer Guide](docs/DEVELOPER_GUIDE.md#troubleshooting) for more solutions.

## ⚠️ Known Issues

- **Performance**: App runs slowly in production (see [REFACTOR_ROADMAP.md](docs/REFACTOR_ROADMAP.md))
- **Bundle Size**: 451KB main chunk (optimization needed)
- **Test Coverage**: ~40% (target: 80%)

## 🔜 Refactoring Roadmap

The codebase is being prepared for refactoring. See [REFACTOR_ROADMAP.md](docs/REFACTOR_ROADMAP.md) for:
- Performance optimization plan
- Code organization improvements
- Testing strategy
- 6-week timeline

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: GitHub Issues
- **Sentry**: Error tracking dashboard

---

**Version 3.7.0** - Gallery Redesign & Performance Fixes 🏸

Made with ❤️ for the Vietnamese badminton community
