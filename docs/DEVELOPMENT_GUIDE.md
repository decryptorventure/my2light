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
# 🔑 Hướng Dẫn Lấy Supabase Anon Key

## Bước 1: Truy cập Supabase Dashboard

Mở link sau trong browser:
```
https://supabase.com/dashboard/project/uthuigqlvjiscmdqvhxz/settings/api
```

## Bước 2: Tìm và Copy Anon Key

1. Đăng nhập vào Supabase (nếu chưa)
2. Trong trang **API Settings**, tìm mục **Project API keys**
3. Tìm key có label: **`anon` `public`**
4. Click vào icon **Copy** bên cạnh key đó

## Bước 3: Paste vào file .env

1. Mở file `.env` trong project (đã được tạo sẵn)
2. Thay thế `your_supabase_anon_key_here` bằng key vừa copy
3. Save file

**Ví dụ file .env sau khi hoàn thành:**
```env
VITE_SUPABASE_URL=https://uthuigqlvjiscmdqvhxz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz...
```

## Bước 4: Verify

Chạy script kiểm tra:
```bash
./check-env.sh
```

Nếu thành công, bạn sẽ thấy:
```
✅ Môi trường dev đã sẵn sàng!
```

## Bước 5: Chạy Dev Server

```bash
npm run dev
```

Mở browser tại: http://localhost:5173/

---

## ⚠️ Lưu Ý Bảo Mật

- **KHÔNG** commit file `.env` lên Git
- File `.env` đã được thêm vào `.gitignore`
- Anon key là public key, an toàn để dùng ở frontend
- **Service Role Key** thì TUYỆT ĐỐI KHÔNG dùng ở frontend!

---

## 🆘 Nếu Không Tìm Thấy Key

1. Kiểm tra xem bạn đã đăng nhập đúng account Supabase chưa
2. Kiểm tra project ID có đúng không: `uthuigqlvjiscmdqvhxz`
3. Nếu vẫn không được, có thể tạo project mới hoặc liên hệ team owner

---

**Cập nhật**: 26/11/2025
# 📸 Avatar Upload Setup Guide

## Step 1: Create Storage Buckets on Supabase

1. Go to: https://supabase.com/dashboard/project/uthuigqlvjiscmdqvhxz/storage/buckets

2. Create `avatars` bucket:
   - Click "New bucket"
   - Name: `avatars`
   - Public bucket: ✅ YES (check this!)
   - Click "Create bucket"

3. Create `highlights` bucket:
   - Click "New bucket"  
   - Name: `highlights`
   - Public bucket: ✅ YES
   - Click "Create bucket"

## Step 2: Apply Storage Policies

Run the SQL in `storage_policies.sql` on Supabase SQL Editor.

**IMPORTANT:** If you get errors about policies already existing, run this first:
```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Highlight videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload highlights" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own highlights" ON storage.objects;
```

Then run `storage_policies.sql`.

## Step 3: Test Avatar Upload on Localhost

1. Open http://localhost:5173/
2. Login
3. Go to Profile page
4. Click on avatar (camera icon)
5. Select an image
6. Upload should work!

## Step 4: Verify Upload

After uploading, check:
1. Supabase Storage: https://supabase.com/dashboard/project/uthuigqlvjiscmdqvhxz/storage/buckets/avatars
2. Should see your uploaded image
3. Profile page should show new avatar

## Troubleshooting

**If upload fails:**
1. Check Console for errors
2. Verify buckets are PUBLIC
3. Verify storage policies are applied
4. Check RLS is disabled on profiles table
# 🔧 Hướng Dẫn Fix Lỗi my2light App

## ❌ Các lỗi hiện tại:
1. ✅ Trang Profile không hiển thị → **FIXED** (đã thêm error field vào ApiResponse)
2. ⚠️ Không có dữ liệu Courts/Packages → **CẦN FIX**
3. ⚠️ Gallery không có Highlights → **CẦN FIX**
4. ⚠️ Booking payment lỗi → **CẦN FIX**

---

## 📋 Các bước thực hiện (Làm theo thứ tự)

### **Bước 1: Fix Database Schema**
1. Mở **Supabase Dashboard** (https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **SQL Editor** (menu bên trái)
4. Copy toàn bộ nội dung file `fix_schema.sql` 
5. Paste vào SQL Editor
6. Click **Run** (hoặc Ctrl+Enter)
7. Kiểm tra kết quả: Bạn sẽ thấy message "Courts: 6, Packages: 6"

### **Bước 2: Tạo Highlights mẫu**
1. Vẫn ở **SQL Editor**
2. Chạy lệnh này để lấy User ID của bạn:
   ```sql
   SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
   ```
3. Copy **id** của user bạn vừa đăng ký
4. Mở file `create_highlights.sql`
5. Thay thế `YOUR_USER_ID_HERE` bằng id vừa copy
6. Copy toàn bộ script (chỉ phần INSERT)
7. Paste vào SQL Editor và **Run**

### **Bước 3: Test lại App**
1. **Refresh** trình duyệt (Ctrl+R hoặc F5)
2. Test từng luồng:
   - ✅ **Home**: Bạn sẽ thấy 3-6 sân hiển thị
   - ✅ **Gallery**: Bạn sẽ thấy 3 highlights
   - ✅ **Profile**: Thông tin user hiển thị bình thường
   - ✅ **QR Scan → Booking**: Chọn gói → Thanh toán (nếu lỗi, xem Console để biết lý do cụ thể)

---

## 🐛 Nếu vẫn gặp lỗi

### Lỗi: "Failed to load resource"
- **Nguyên nhân**: Supabase URL/Key không đúng
- **Fix**: Kiểm tra file `.env.local` có đúng `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` không

### Lỗi: "Not authenticated" khi booking
- **Nguyên nhân**: Session hết hạn
- **Fix**: Đăng xuất và đăng nhập lại

### Lỗi: "Sân này đang có người chơi"
- **Nguyên nhân**: Bạn đã có booking active
- **Fix**: Vào Profile → Lịch sử → Kiểm tra booking cũ

### Profile vẫn trống
- **Nguyên nhân**: RLS policy chặn
- **Fix**: Chạy lại script `supabase_schema.sql` (phần RLS policies)

---

## 📝 Notes
- Sau khi chạy script, **KHÔNG CẦN** restart dev server
- Chỉ cần **Refresh** trình duyệt
- Nếu vẫn lỗi, mở **Console** (F12) và chụp ảnh lỗi gửi cho tôi

---

## ✅ Checklist
- [ ] Đã chạy `fix_schema.sql`
- [ ] Đã tạo highlights với user ID thật
- [ ] Đã refresh trình duyệt
- [ ] Đã test Home page (thấy sân)
- [ ] Đã test Gallery (thấy highlights)
- [ ] Đã test Profile (thấy thông tin)
- [ ] Đã test Booking (thanh toán thành công)
# 🔧 EMERGENCY DEBUG GUIDE

## Vấn đề hiện tại
- ❌ Tên không lưu (hiện "Khách")
- ❌ Không vào được Profile
- ❌ Booking lỗi "Not authenticated"
- ❌ RLS policies đã fix nhưng vẫn lỗi

## Nguyên nhân có thể

### 1. Environment Variables trên Vercel SAI hoặc THIẾU
**Kiểm tra ngay:**
1. Vào: https://vercel.com/decryptorventure/my2light/settings/environment-variables
2. Xem có 2 biến này không:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **QUAN TRỌNG:** Giá trị phải GIỐNG HỆT trong file `.env.local`

**Nếu sai hoặc thiếu:**
- Xóa biến cũ
- Thêm lại với giá trị đúng từ `.env.local`
- **Redeploy** sau khi thêm

### 2. Supabase Auth Settings SAI
**Kiểm tra:**
1. Vào: https://supabase.com/dashboard/project/uthuigqlvjiscmdqvhxz/auth/url-configuration
2. **Site URL** phải là: `https://my2light.vercel.app`
3. **Redirect URLs** phải có:
   - `https://my2light.vercel.app/**`
   - `http://localhost:5173/**`

### 3. RLS vẫn chặn
**Tắt RLS tạm thời để test:**
```sql
-- TEMPORARY: Disable RLS for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE highlights DISABLE ROW LEVEL SECURITY;
```

**SAU KHI TEST XONG, BẬT LẠI:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
```

---

## GIẢI PHÁP NHANH NHẤT

### Option A: Test trên localhost trước
1. Mở http://localhost:5173/
2. Test đăng ký/onboarding
3. Nếu localhost OK → Vấn đề là Vercel env vars
4. Nếu localhost cũng lỗi → Vấn đề là code hoặc Supabase

### Option B: Tắt RLS hoàn toàn (TEMPORARY)
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE highlights DISABLE ROW LEVEL SECURITY;
```
Sau đó test lại production.

---

## STEPS TO FIX

1. **Kiểm tra Vercel Env Vars** (quan trọng nhất!)
2. **Kiểm tra Supabase Auth URLs**
3. **Tắt RLS tạm thời**
4. **Test lại**
5. **Nếu OK → Bật RLS và fix policies đúng**

---

## Nếu vẫn không được

Gửi cho tôi:
1. Screenshot Vercel Environment Variables
2. Screenshot Supabase Auth URL Configuration
3. Screenshot Console errors khi đăng ký
4. Kết quả test trên localhost
# 🚀 Hướng Dẫn Deploy lên Vercel

## Cách 1: Deploy qua Vercel Dashboard (Khuyến nghị)

### Bước 1: Truy cập Vercel Dashboard
1. Mở trình duyệt và vào: https://vercel.com/dashboard
2. Đăng nhập bằng tài khoản GitHub của bạn

### Bước 2: Import Project
1. Click nút **"Add New..."** → **"Project"**
2. Chọn repository **"my2light"** từ danh sách
3. Click **"Import"**

### Bước 3: Cấu hình Project
1. **Framework Preset**: Vite (tự động detect)
2. **Root Directory**: `./` (mặc định)
3. **Build Command**: `npm run build` (mặc định)
4. **Output Directory**: `dist` (mặc định)

### Bước 4: Thêm Environment Variables
Click **"Environment Variables"** và thêm:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | (Copy từ file `.env.local`) |
| `VITE_SUPABASE_ANON_KEY` | (Copy từ file `.env.local`) |

**Lưu ý:** Đảm bảo chọn **"Production"** cho cả 2 biến.

### Bước 5: Deploy
1. Click **"Deploy"**
2. Đợi 2-3 phút để Vercel build
3. Sau khi xong, bạn sẽ thấy URL: `https://my2light-xxx.vercel.app`

---

## Cách 2: Deploy qua CLI (Nếu fix được lỗi quyền)

### Fix lỗi Git author
```bash
# Option 1: Thêm email vào Vercel team
# Vào Vercel Dashboard → Settings → Members → Invite decryptorventure@gmail.com

# Option 2: Deploy với --force
vercel --prod --force
```

---

## ✅ Sau khi Deploy thành công

### Kiểm tra:
1. Mở URL production: `https://my2light-xxx.vercel.app`
2. Test các tính năng:
   - ✅ Đăng nhập/Đăng ký
   - ✅ Home page (thấy sân, highlights)
   - ✅ Gallery (thấy videos)
   - ✅ Profile (thấy thông tin)
   - ✅ Booking (đặt sân)

### Nếu gặp lỗi:
- Mở Console (F12) và chụp ảnh lỗi
- Kiểm tra Environment Variables đã đúng chưa
- Kiểm tra Supabase RLS policies

---

## 📝 Notes
- Mỗi lần push code mới lên GitHub, Vercel sẽ tự động deploy lại
- URL production sẽ không đổi
- Có thể xem logs tại: https://vercel.com/dashboard → Project → Deployments
