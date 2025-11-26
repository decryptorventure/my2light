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
