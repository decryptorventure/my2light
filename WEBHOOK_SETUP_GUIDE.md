# Webhook Setup Guide - Hướng Dẫn Cấu Hình Webhook

**Mục đích**: Bảo mật webhook payment và tự động xác nhận booking

---

## 📋 Bước 1: Tạo Webhook Secret Key

### Option A: Tạo Key Ngẫu Nhiên (Recommended)

**Trên Windows PowerShell**:
```powershell
# Tạo random secret 32 characters
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Kết quả ví dụ**:
```
Xy9mQ2vBnK4pL8rT3wA6hJ1sD5fG7cE0
```

### Option B: Tạo Online

1. Truy cập: https://www.random.org/strings/
2. Cài đặt:
   - Number of strings: `1`
   - Length: `32`
   - Characters: `Alphanumeric`
3. Click **Get Strings**
4. Copy key

### Option C: Tự Tạo

Tạo chuỗi random 32 ký tự bất kỳ:
```
abcd1234efgh5678ijkl9012mnop3456
```

**⚠️ Quan trọng**: 
- Key phải >= 32 characters
- Không share public
- Giữ bí mật như password

---

## 📋 Bước 2: Thêm Vào `.env.local`

### 2.1. Mở file `.env.local`

**Nếu chưa có file**:
```bash
# Tạo file mới
cd d:\my2light-app\my2light-main
New-Item -Path .env.local -ItemType File
```

### 2.2. Thêm webhook secret

Mở `.env.local` và thêm dòng:
```bash
VITE_WEBHOOK_SECRET=YOUR_SECRET_KEY_HERE
```

**Ví dụ thực tế**:
```bash
# Supabase credentials (đã có sẵn)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Webhook secret (THÊM MỚI)
VITE_WEBHOOK_SECRET=Xy9mQ2vBnK4pL8rT3wA6hJ1sD5fG7cE0
```

### 2.3. Save file

**⚠️ Lưu ý**: 
- File `.env.local` đã có trong `.gitignore` → an toàn
- Không commit file này lên GitHub
- Mỗi môi trường (dev, staging, production) dùng key riêng

---

## 📋 Bước 3: Restart Development Server

Sau khi thêm env variable:

```bash
# Stop server hiện tại (Ctrl + C)
# Restart lại
npm run dev
```

Vite sẽ load env variables mới.

---

## 📋 Bước 4: Verify Setup

### 4.1. Check trong console

Mở browser console và check:
```javascript
console.log('Webhook configured:', !!import.meta.env.VITE_WEBHOOK_SECRET);
// Should show: Webhook configured: true
```

### 4.2. Test webhook endpoint

Sau khi tích hợp vào `PaymentCallback.tsx`, test bằng curl:

**Valid signature**:
```bash
# Calculate signature
$payload = '{"bookingId":"123","status":"success","amount":100000}'
$secret = "YOUR_SECRET_KEY"
$hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($secret))
$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($payload))
$signature = [System.BitConverter]::ToString($hash).Replace('-','').ToLower()

# Send webhook
curl -X POST http://localhost:5173/payment-callback `
  -H "Content-Type: application/json" `
  -H "X-Signature: $signature" `
  -d $payload
```

**Invalid signature** (should be rejected):
```bash
curl -X POST http://localhost:5173/payment-callback `
  -H "Content-Type: application/json" `
  -H "X-Signature: invalid-signature" `
  -d '{"bookingId":"123","status":"success"}'
```

---

## 📋 Bước 5: Production Setup

### 5.1. Vercel / Netlify

Trong dashboard → Environment Variables:
```
VITE_WEBHOOK_SECRET = <production-secret-key>
```

**⚠️ Quan trọng**: Dùng key khác với development!

### 5.2. Supabase Edge Functions

Nếu dùng Supabase để nhận webhook:

1. Vào Supabase Dashboard → Settings → API
2. Copy **Service Role Key** (secret)
3. Dùng làm webhook secret

---

## 🔐 Webhook Security Best Practices

### 1. **Key Rotation**
Đổi key định kỳ (3-6 tháng):
```bash
# Old key
VITE_WEBHOOK_SECRET=old-key-here

# New key
VITE_WEBHOOK_SECRET=new-key-here
```

### 2. **Multiple Keys** (Advanced)
Support multiple keys trong transition period:
```bash
VITE_WEBHOOK_SECRET=current-key
VITE_WEBHOOK_SECRET_OLD=previous-key
```

### 3. **Key Storage**
- Dev: `.env.local`
- Production: Environment variables trong hosting platform
- Never hardcode trong code!

### 4. **Validate Payload**
Luôn validate payload structure:
```typescript
if (!payload.bookingId || !payload.status) {
  return { error: 'Invalid payload' };
}
```

---

## 🧪 Testing Checklist

- [ ] Webhook secret added to `.env.local`
- [ ] Server restarted
- [ ] Console shows webhook configured
- [ ] Valid signature → accepted
- [ ] Invalid signature → rejected
- [ ] Booking status updates correctly
- [ ] Notification sent to user

---

## 🚨 Troubleshooting

### Error: "Webhook secret not configured"

**Fix**:
```bash
# Check .env.local has the variable
cat .env.local | grep WEBHOOK

# Restart dev server
npm run dev
```

### Error: "Invalid signature" (but should be valid)

**Possible causes**:
1. Payload modified (whitespace, order)
2. Wrong secret key used
3. Different encoding

**Fix**: Log both hashes and compare:
```typescript
console.log('Expected:', expectedSignature);
console.log('Received:', signature);
```

### Webhook not triggering

**Check**:
1. Webhook URL correct?
2. PaymentCallback.tsx integrated?
3. CORS enabled on payment gateway?

---

## 📚 Additional Resources

- [HMAC Security](https://en.wikipedia.org/wiki/HMAC)
- [Webhook Best Practices](https://docs.stripe.com/webhooks/best-practices)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

---

## ✅ Summary

1. **Generate** webhook secret (32+ characters)
2. **Add** to `.env.local`:
   ```bash
   VITE_WEBHOOK_SECRET=your-secret-here
   ```
3. **Restart** dev server
4. **Verify** setup works
5. **Test** with valid/invalid signatures

**Estimated time**: 5-10 minutes

**Status**: Ready for production! 🚀
