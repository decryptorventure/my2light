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
