# 🚀 Hướng Dẫn Cài Đặt Môi Trường Dev - my2light

## ✅ Các Bước Đã Hoàn Thành

### 1. Kiểm tra Node.js và npm
- ✅ Node.js version: **v22.3.0**
- ✅ npm version: **10.8.1**

### 2. Cài đặt Dependencies
- ✅ Đã chạy `npm install` thành công
- ✅ Đã cài đặt **382 packages**
- ⚠️ Có 2 moderate severity vulnerabilities (không ảnh hưởng đến development)

## 📋 Các Bước Cần Thực Hiện Tiếp

### 3. Cấu Hình Environment Variables

**File `.env` hiện tại đang trống!** Bạn cần điền thông tin Supabase vào file `.env`:

```bash
VITE_SUPABASE_URL=https://uthuigqlvjiscmdqvhxz.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### Cách lấy Supabase Anon Key:

1. Truy cập: https://supabase.com/dashboard/project/uthuigqlvjiscmdqvhxz/settings/api
2. Copy giá trị **anon/public** key
3. Paste vào file `.env` (thay thế `your_supabase_anon_key_here`)

### 4. Setup Database (nếu chưa)

Nếu database Supabase chưa được thiết lập, chạy các script SQL sau theo thứ tự:

1. **Schema chính**: `supabase_schema.sql`
   - Tạo các tables: users, courts, sessions, plays, highlights
   - Thiết lập RLS policies

2. **Storage policies**: `storage_policies.sql`
   - Tạo policies cho avatar và highlight uploads
   - **Lưu ý**: Phải tạo buckets `avatars` và `highlights` trước (xem AVATAR_SETUP.md)

3. **Sample data** (optional): `seed_data.sql`
   - Dữ liệu mẫu để test

### 5. Chạy Development Server

Sau khi cấu hình `.env` xong:

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: http://localhost:5173/

### 6. Kiểm Tra Code Quality

```bash
# Kiểm tra linting
npm run lint

# Format code
npm run format
```

## 🔧 Scripts Có Sẵn

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy development server (Vite) |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build |
| `npm run lint` | Kiểm tra code với ESLint |
| `npm run format` | Format code với Prettier |

## 📁 Cấu Trúc Dự Án

```
my2light/
├── components/          # React components
│   ├── Layout/         # BottomNav, IOSInstallPrompt
│   └── ui/             # Card, Modal, LoadingSpinner
├── pages/              # Route pages
├── services/           # API và mock data
├── lib/                # Supabase client config
├── .env               # ⚠️ CẦN CẤU HÌNH!
├── package.json       # Dependencies
└── vite.config.ts     # Vite configuration
```

## 🐛 Troubleshooting

### Lỗi npm install
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

### Lỗi kết nối Supabase
1. Kiểm tra file `.env` có đúng format không
2. Kiểm tra SUPABASE_URL và ANON_KEY có chính xác không
3. Kiểm tra network connection

### Port 5173 đã được sử dụng
```bash
# Vite sẽ tự động chọn port khác (5174, 5175...)
# Hoặc kill process đang dùng port 5173
lsof -ti:5173 | xargs kill
```

## 📚 Tài Liệu Tham Khảo

- [README.md](./README.md) - Tổng quan dự án
- [AVATAR_SETUP.md](./AVATAR_SETUP.md) - Hướng dẫn setup avatar upload
- [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) - Hướng dẫn deploy lên Vercel
- [FIX_GUIDE.md](./FIX_GUIDE.md) - Hướng dẫn fix các lỗi thường gặp

## ⚡ Quick Start (TL;DR)

```bash
# 1. Cài dependencies (✅ Đã xong)
npm install

# 2. Cấu hình .env (⚠️ CẦN LÀM)
# Điền Supabase URL và Anon Key vào file .env

# 3. Chạy dev server
npm run dev

# 4. Mở browser
# http://localhost:5173/
```

## 🎯 Checklist Hoàn Thành Setup

- [x] Node.js và npm đã cài đặt
- [x] Dependencies đã cài đặt (`npm install`)
- [ ] **File `.env` đã được cấu hình với Supabase credentials**
- [ ] Database schema đã được setup trên Supabase
- [ ] Storage buckets (`avatars`, `highlights`) đã được tạo
- [ ] Development server chạy thành công
- [ ] Đăng nhập thành công trên localhost

---

**Cập nhật**: 26/11/2025 22:47
