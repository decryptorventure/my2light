# my2light - Basketball Highlight Recording App

[![Version](https://img.shields.io/badge/version-3.5.0-blue.svg)](docs/CHANGELOG_v3.5.md)
[![Status](https://img.shields.io/badge/status-production-green.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

**my2light** is a mobile-first web application that enables basketball players to record their games, mark highlights in real-time, and share their best moments with the community.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Modern browser (Chrome/Edge/Safari 14.1+)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd my2light-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

Visit `http://localhost:5173` to see the app.

### Build for Production

```bash
npm run build
```

## ✨ Features (v3.5)

- 🎥 **Segment-Based Recording**: Mark highlights in real-time while recording
- ⏱️ **Rollback Time Selection**: Choose 15s/30s/60s for each highlight
- 📹 **Video Preview**: Preview segments before saving with full video player
- ⚡ **Bulk Operations**: Select All / Deselect All buttons
- 💾 **Download**: Download merged videos directly to device
- 🔄 **Server-Side Merging**: Automatic video processing via Edge Functions
- 🎨 **Modern UI**: Dark theme with smooth animations

## 📚 Documentation

- **[Getting Started](docs/DEVELOPER_HANDOVER.md)** - Complete developer guide
- **[Changelog](docs/CHANGELOG_v3.5.md)** - Version history and technical details
- **[Release Notes](docs/RELEASE_NOTES_v3.5.md)** - User-facing features

### For New Developers

Start here: **[docs/DEVELOPER_HANDOVER.md](docs/DEVELOPER_HANDOVER.md)**

This comprehensive guide covers:
- Project structure
- Tech stack details
- Database schema
- API documentation
- Deployment procedures
- Troubleshooting

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Animations**: Framer Motion
- **Media**: MediaRecorder API (WebRTC)

## 🗄️ Database Setup

### Running Migrations

Run these SQL files in your Supabase SQL Editor in order:

```sql
migrations/009_fix_highlights_duration.sql
migrations/010_video_segments_and_notifications.sql
migrations/011_fix_trigger_duration.sql
migrations/012_create_raw_segments_bucket.sql
```

### Create Storage Buckets

1. **`videos`** bucket (if not exists)
   - Public bucket for merged highlight videos

2. **`raw_segments`** bucket (required for v3.5)
   - Public bucket
   - File size limit: 100MB
   - Allowed MIME types: `video/webm,video/mp4`

See [Video Save Fix Guide](docs/DEVELOPER_HANDOVER.md#deployment) for detailed setup.

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🚀 Deployment

### Edge Functions

Deploy the video merging function:

```bash
npx supabase login
npx supabase functions deploy merge-videos
```

### Frontend

```bash
# Build
npm run build

# Deploy dist/ folder to your hosting (Vercel, Netlify, etc.)
```

## 🧪 Testing

### Manual Testing

1. Open the app in a modern browser
2. Navigate to "Self Recording"
3. Allow camera permissions
4. Record and mark highlights
5. Review, select, and save

### Browser Compatibility

✅ Chrome (v90+)  
✅ Edge (v90+)  
✅ Safari (v14.1+)  
⚠️ Firefox (limited MediaRecorder support)

## 📁 Project Structure

```
my2light-app/
├── docs/                    # Documentation
├── migrations/              # Database migrations
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Route pages
│   ├── services/           # API services
│   └── types.ts            # TypeScript types
├── supabase/
│   └── functions/          # Edge Functions
└── package.json
```

## 🐛 Troubleshooting

### Common Issues

**Camera not working?**
- Ensure you're using HTTPS (required for getUserMedia)
- Check browser permissions
- Try Chrome/Edge (best support)

**Video not saving?**
- Check Supabase dashboard for Edge Function logs
- Verify `raw_segments` bucket exists
- Ensure migrations are applied

**Build errors?**
```bash
rm -rf node_modules dist
npm install
npm run build
```

See [Developer Handover Guide](docs/DEVELOPER_HANDOVER.md#troubleshooting) for more solutions.

## 🔜 Roadmap

- [ ] Voice-activated highlight detection
- [ ] Automatic thumbnail generation
- [ ] FFmpeg-based video processing
- [ ] Advanced video editing (trim, filters)
- [ ] AI-powered highlight detection
- [ ] Offline mode / PWA support

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- Documentation: [docs/](docs/)
- Issues: GitHub Issues
- Contact: [Your Contact Info]

---

**Version 3.5.0** - Recording Revolution 🎥🏀

Made with ❤️ for basketball players
