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
