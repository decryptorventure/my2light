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
