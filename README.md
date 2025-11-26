# my2light - Version 1.0 Documentation

## 📋 Tổng quan dự án

**my2light** là một Progressive Web App (PWA) được xây dựng bằng React + TypeScript + Vite, tích hợp Supabase cho backend và authentication.

### Công nghệ sử dụng
- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3
- **Routing**: React Router DOM v6 (HashRouter)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend/Auth**: Supabase
- **Deployment**: Vercel
- **Code Quality**: ESLint + Prettier

---

## 🚀 Cài đặt và Chạy dự án

### 1. Clone repository
```bash
git clone https://github.com/decryptorventure/my2light.git
cd my2light
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình Environment Variables
Tạo file `.env.local` từ `.env.example`:
```bash
cp .env.example .env.local
```

Sau đó điền thông tin Supabase vào `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Chạy development server
```bash
npm run dev
```

Ứng dụng sẽ chạy tại: `http://localhost:5173/`

### 5. Build production
```bash
npm run build
```

### 6. Preview production build
```bash
npm run preview
```

---

## 📁 Cấu trúc dự án

```
my2light-app/
├── components/          # UI components
│   ├── Layout/         # BottomNav, IOSInstallPrompt
│   └── ui/             # Card, Modal, LoadingSpinner, Transition
├── pages/              # Route components
│   ├── Splash.tsx
│   ├── Login.tsx
│   ├── Home.tsx
│   ├── QRScan.tsx
│   ├── ActiveSession.tsx
│   ├── Gallery.tsx
│   ├── Profile.tsx
│   └── SelfRecording.tsx
├── services/           # API services
│   ├── api.ts          # API calls
│   └── mockDb.ts       # Mock data
├── lib/                # Configuration
│   └── supabase.ts     # Supabase client
├── App.tsx             # Main app component
├── index.tsx           # Entry point
├── types.ts            # TypeScript types
├── index.css           # Tailwind directives
├── tailwind.config.js  # Tailwind configuration
├── postcss.config.js   # PostCSS configuration
├── .eslintrc.json      # ESLint configuration
├── .prettierrc         # Prettier configuration
├── vite.config.ts      # Vite configuration
└── vercel.json         # Vercel deployment config
```

---

## 🛠️ Scripts có sẵn

```bash
npm run dev      # Chạy development server
npm run build    # Build production
npm run preview  # Preview production build
npm run lint     # Kiểm tra code với ESLint
npm run format   # Format code với Prettier
```

---

## 🌐 Deployment

### Deploy lên Vercel

1. **Đăng nhập Vercel CLI**:
```bash
vercel login
```

2. **Deploy dự án**:
```bash
vercel
```

3. **Deploy production**:
```bash
vercel --prod
```

### Hoặc deploy qua Vercel Dashboard:
1. Truy cập [vercel.com](https://vercel.com)
2. Import repository từ GitHub
3. Vercel sẽ tự động detect Vite và deploy

**Lưu ý**: Nhớ thêm Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) trong Vercel Dashboard.

---

## 📝 Các tối ưu đã thực hiện (Version 1.0)

### ✅ 1. Tailwind CSS Configuration
- ✅ Di chuyển config từ inline trong `index.html` sang `tailwind.config.js`
- ✅ Tạo `postcss.config.js` cho PostCSS
- ✅ Tạo `index.css` với Tailwind directives

### ✅ 2. Code Quality Tools
- ✅ Cài đặt ESLint với TypeScript và React plugins
- ✅ Cài đặt Prettier cho code formatting
- ✅ Thêm scripts `lint` và `format` vào `package.json`

### ✅ 3. Environment Setup
- ✅ Tạo `.env.example` template
- ✅ Cấu hình Git repository
- ✅ Kết nối với GitHub repository
- ✅ Cài đặt Vercel CLI

### ✅ 4. Git & GitHub
- ✅ Khởi tạo Git repository
- ✅ Kết nối với remote repository
- ✅ Push code lên GitHub
- ✅ Resolve merge conflicts

---

## 🔮 Kế hoạch tối ưu tiếp theo (Version 2.0)

### 1. State Management
- [ ] Implement AuthContext cho global auth state
- [ ] Tạo custom hooks cho reusable logic

### 2. Performance Optimization
- [ ] Implement code splitting với React.lazy
- [ ] Add Suspense boundaries
- [ ] Optimize images và assets

### 3. Testing
- [ ] Setup Vitest cho unit testing
- [ ] Add React Testing Library
- [ ] Write tests cho critical components

### 4. CI/CD
- [ ] Setup GitHub Actions
- [ ] Automated testing trước khi deploy
- [ ] Automated deployment

---

## 📞 Liên hệ & Support

- **GitHub**: [decryptorventure/my2light](https://github.com/decryptorventure/my2light)
- **Supabase Project**: [Dashboard](https://supabase.com/dashboard)
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)

---

## 📄 License

Private Project - All Rights Reserved
