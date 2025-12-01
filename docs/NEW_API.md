# New API Documentation

## Quick Start

### Import

```typescript
import { authService } from '@/api';
// or
import { authService } from '../src/api';  // Relative path
```

### Usage Example

```typescript
// Login
const loginResult = await authService.login({
  phone: '0987654321',
  password: 'mypassword'
});

if (loginResult.success) {
  const user = loginResult.data;
  console.log('Logged in:', user.name);
} else {
  console.error('Login failed:', loginResult.error);
}
```

---

## Auth Service

### Methods

#### `login(credentials)`
Login với phone và password.

**Parameters:**
```typescript
{
  phone: string;      // Vietnam format: 0xxx xxx xxx
  password: string;   // Min 6 characters
}
```

**Returns:**
```typescript
ApiResponse<User>
```

**Example:**
```typescript
const result = await authService.login({
  phone: '0987654321',
  password: '123456'
});
```

---

#### `register(data)`
Đăng ký tài khoản mới.

**Parameters:**
```typescript
{
  name: string;       // 2-50 characters
  phone: string;      // Vietnam format
  password: string;   // Min 6 characters
}
```

**Returns:**
```typescript
ApiResponse<User>
```

---

#### `getCurrentUser()`
Lấy thông tin user hiện tại.

**Returns:**
```typescript
ApiResponse<User>
```

---

#### `updateProfile(updates)`
Cập nhật profile.

**Parameters:**
```typescript
{
  name?: string;        // 2-50 characters
  bio?: string;         // Max 200 characters
  avatar?: string;      // URL
  is_public?: boolean;
}
```

**Returns:**
```typescript
ApiResponse<boolean>
```

---

#### `uploadAvatar(file)`
Upload avatar.

**Parameters:**
```typescript
file: File  // Max 5MB, JPG/PNG/WebP only
```

**Returns:**
```typescript
ApiResponse<string>  // Public URL
```

---

#### `signOut()`
Đăng xuất.

**Returns:**
```typescript
ApiResponse<boolean>
```

---

## Error Handling

### Error Codes

All methods return `ApiResponse<T>`:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;  // Vietnamese error message
}
```

### Common Error Codes

- `AUTH_INVALID_CREDENTIALS` - "Số điện thoại hoặc mật khẩu không đúng"
- `AUTH_TOKEN_EXPIRED` - "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại"
- `AUTH_PHONE_INVALID` - "Số điện thoại không hợp lệ"
- `AUTH_PASSWORD_WEAK` - "Mật khẩu phải có ít nhất 6 ký tự"

### Validation Errors

Zod validation errors are automatically converted to Vietnamese messages:

```typescript
const result = await authService.login({
  phone: '123',  // Invalid
  password: '12'  // Too short
});

// result.error = "Số điện thoại không hợp lệ"
```

---

## Migration Guide

### Before (Old API)

```typescript
import { ApiService } from '@/services/api';

const result = await ApiService.getCurrentUser();
if (result.success) {
  const user = result.data;
}
```

### After (New API)

```typescript
import { authService } from '@/api';

const result = await authService.getCurrentUser();
if (result.success) {
  const user = result.data;
}
```

### Changes Required

1. Update import statement
2. Replace `ApiService` with specific service (`authService`, etc.)
3. Method signatures unchanged - no breaking changes

---

## Advanced Features

### Auto-Retry

Network errors automatically retry 3 times with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: Wait 2s
- Attempt 3: Wait 4s

### Token Refresh

401 errors automatically trigger token refresh and retry the request.

### Request Tracing

All requests include a unique request ID for debugging:
```
X-Request-ID: req_1701234567890_abc123def
```

---

## Coming Soon

- Courts Service
- Bookings Service
- Highlights Service
- Payments Service
- Social Service

Each service will follow the same pattern as Auth Service.
