# Kế Hoạch Triển Khai Phase 3 & 4 - Court Management

## 📋 Tổng Quan

**Mục tiêu:** Hoàn thiện các tính năng quản lý sân cơ bản cho chủ sân
**Thời gian ước tính:** 2-3 buổi làm việc
**Trạng thái hiện tại:** Phase 1 & 2 đã hoàn thành

---

## ✅ Đã Hoàn Thành (Phase 1 & 2)

### Phase 1: Foundation & Role System
- ✅ Database migration (profiles.role, court_owners table)
- ✅ Type definitions (types/admin.ts)
- ✅ useRole hook cho role management
- ✅ ProtectedRoute component
- ✅ AdminService API (getCourtOwnerProfile, createCourtOwnerProfile, getStats)
- ✅ Update getCurrentUser để lấy role

### Phase 2: UI Foundation & Role Switcher
- ✅ Profile page: Role switcher & "Become Court Owner" CTA
- ✅ BecomeCourtOwner registration page
- ✅ AdminLayout (Sidebar + Header)
- ✅ Dashboard page với stats cards
- ✅ Routing configuration với ProtectedRoute

---

## 🎯 Phase 3: Courts Management (Buổi 1 - Tối nay)

### Task 3.1: Courts List Page
**File:** `pages/admin/Courts.tsx`

**Chức năng:**
- Hiển thị danh sách tất cả sân của chủ sân
- Card view với thông tin: tên sân, địa chỉ, giá, trạng thái
- Filter: Active/Inactive
- Search by name
- Empty state khi chưa có sân

**Implementation:**
```tsx
// pages/admin/Courts.tsx
import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Search, MapPin, DollarSign } from 'lucide-react';

export const Courts: React.FC = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive

  useEffect(() => {
    loadCourts();
  }, []);

  const loadCourts = async () => {
    // TODO: Call AdminService.getCourts()
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý sân</h1>
          <p className="text-slate-400">Danh sách sân của bạn</p>
        </div>
        <Button onClick={() => navigate('/admin/courts/new')}>
          <Plus size={20} />
          Thêm sân mới
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm sân..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
        >
          <option value="all">Tất cả</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Tạm ngưng</option>
        </select>
      </div>

      {/* Courts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courts.map(court => (
          <CourtCard key={court.id} court={court} onEdit={handleEdit} />
        ))}
      </div>

      {/* Empty State */}
      {courts.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <Building2 size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Chưa có sân nào</h3>
          <p className="text-slate-400 mb-6">Bắt đầu bằng cách thêm sân đầu tiên</p>
          <Button onClick={() => navigate('/admin/courts/new')}>
            Thêm sân mới
          </Button>
        </Card>
      )}
    </div>
  );
};
```

---

### Task 3.2: Add Court Form
**File:** `pages/admin/CourtForm.tsx`

**Chức năng:**
- Form tạo/edit sân
- Fields: name, address, description, pricePerHour, openTime, closeTime
- Upload ảnh sân (optional)
- Toggle active status

**API cần thêm vào `services/admin.ts`:**
```typescript
// Get courts của owner
getCourts: async (): Promise<ApiResponse<Court[]>> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, data: [] };

  const { data: owner } = await supabase
    .from('court_owners')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!owner) return { success: false, data: [] };

  const { data, error } = await supabase
    .from('courts')
    .select('*')
    .eq('owner_id', owner.id)
    .order('created_at', { ascending: false });

  if (error) return { success: false, data: [], error: error.message };
  return { success: true, data };
},

// Create court
createCourt: async (courtData: {
  name: string;
  address: string;
  description: string;
  pricePerHour: number;
  openTime: string;
  closeTime: string;
  imageUrl?: string;
}): Promise<ApiResponse<Court>> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, data: null as any };

  const { data: owner } = await supabase
    .from('court_owners')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!owner) return { success: false, data: null as any };

  const { data, error } = await supabase
    .from('courts')
    .insert({
      owner_id: owner.id,
      name: courtData.name,
      address: courtData.address,
      description: courtData.description,
      price_per_hour: courtData.pricePerHour,
      open_time: courtData.openTime,
      close_time: courtData.closeTime,
      image_url: courtData.imageUrl,
      is_active: true,
      rating: 0
    })
    .select()
    .single();

  if (error) return { success: false, data: null as any, error: error.message };
  return { success: true, data };
},

// Update court
updateCourt: async (courtId: string, updates: Partial<Court>): Promise<ApiResponse<boolean>> => {
  const { error } = await supabase
    .from('courts')
    .update(updates)
    .eq('id', courtId);

  if (error) return { success: false, data: false, error: error.message };
  return { success: true, data: true };
}
```

---

### Task 3.3: Court Card Component
**File:** `components/admin/courts/CourtCard.tsx`

```tsx
import React from 'react';
import { Card } from '../../ui/Card';
import { MapPin, DollarSign, Clock, Edit, MoreVertical } from 'lucide-react';
import { Court } from '../../../types';

interface CourtCardProps {
  court: Court;
  onEdit: (court: Court) => void;
}

export const CourtCard: React.FC<CourtCardProps> = ({ court, onEdit }) => {
  return (
    <Card className="p-4 hover:border-lime-400/50 transition-colors cursor-pointer">
      {/* Image */}
      <div className="aspect-video rounded-lg bg-slate-700 mb-3 overflow-hidden">
        <img 
          src={court.imageUrl} 
          alt={court.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-white">{court.name}</h3>
          <button 
            onClick={() => onEdit(court)}
            className="p-1 hover:bg-slate-700 rounded"
          >
            <Edit size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-400">
          <MapPin size={14} />
          <span className="truncate">{court.address}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign size={14} className="text-lime-400" />
            <span className="text-white font-semibold">
              {court.pricePerHour.toLocaleString()}đ/giờ
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock size={12} />
            <span>{court.openTime} - {court.closeTime}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="pt-2 border-t border-slate-700">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            court.isActive 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-slate-700 text-slate-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${court.isActive ? 'bg-green-400' : 'bg-slate-400'}`} />
            {court.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
          </span>
        </div>
      </div>
    </Card>
  );
};
```

---

## 🎯 Phase 4: Bookings Management (Buổi 2)

### Task 4.1: Bookings List Page
**File:** `pages/admin/Bookings.tsx`

**Chức năng:**
- Hiển thị tất cả bookings của các sân
- Filter: Pending, Confirmed, Completed, Cancelled
- Filter by date range
- Search by player name/phone
- Booking details modal

**API cần thêm:**
```typescript
// Get all bookings của owner
getOwnerBookings: async (filters?: {
  status?: string;
  courtId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ApiResponse<BookingManagement[]>> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, data: [] };

  const { data: owner } = await supabase
    .from('court_owners')
    .select('id, courts(id)')
    .eq('profile_id', user.id)
    .single();

  if (!owner) return { success: false, data: [] };

  const courtIds = owner.courts.map(c => c.id);

  let query = supabase
    .from('bookings')
    .select(`
      *,
      court:courts(name),
      profile:profiles(name, phone)
    `)
    .in('court_id', courtIds)
    .order('start_time', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) return { success: false, data: [], error: error.message };

  const bookings: BookingManagement[] = data.map(b => ({
    id: b.id,
    courtName: b.court.name,
    playerName: b.profile.name,
    playerPhone: b.profile.phone,
    startTime: new Date(b.start_time).getTime(),
    endTime: new Date(b.end_time).getTime(),
    status: b.status,
    totalAmount: b.total_amount,
    packageName: 'Standard', // TODO: Get from packages
    createdAt: b.created_at
  }));

  return { success: true, data: bookings };
}
```

---

### Task 4.2: Enhanced Dashboard
**File:** Update `pages/admin/Dashboard.tsx`

**Thêm:**
- Revenue chart (7 ngày gần nhất)
- Recent bookings table
- Quick actions với real navigation

**Component cần tạo:**
```tsx
// components/admin/dashboard/RevenueChart.tsx
import React from 'react';
import { Card } from '../../ui/Card';
import { RevenueData } from '../../../types/admin';

export const RevenueChart: React.FC<{ data: RevenueData[] }> = ({ data }) => {
  const maxRevenue = Math.max(...data.map(d => d.amount));

  return (
    <Card className="p-5">
      <h3 className="font-bold text-white mb-4">Doanh thu 7 ngày</h3>
      <div className="flex items-end gap-2 h-48">
        {data.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="flex-1 w-full flex items-end">
              <div 
                className="w-full bg-lime-400 rounded-t"
                style={{ height: `${(day.amount / maxRevenue) * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{day.date}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// components/admin/dashboard/RecentBookings.tsx
import React from 'react';
import { Card } from '../../ui/Card';
import { BookingManagement } from '../../../types/admin';

export const RecentBookings: React.FC<{ bookings: BookingManagement[] }> = ({ bookings }) => {
  return (
    <Card className="p-5">
      <h3 className="font-bold text-white mb-4">Booking gần đây</h3>
      <div className="space-y-3">
        {bookings.slice(0, 5).map(booking => (
          <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div>
              <p className="font-semibold text-white">{booking.playerName}</p>
              <p className="text-xs text-slate-400">{booking.courtName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-lime-400">
                {booking.totalAmount.toLocaleString()}đ
              </p>
              <p className="text-xs text-slate-400">
                {new Date(booking.startTime).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
```

---

## 📝 Checklist Triển Khai

### Buổi 1 (Tối nay):
- [ ] Tạo `pages/admin/Courts.tsx`
- [ ] Tạo `pages/admin/CourtForm.tsx`
- [ ] Tạo `components/admin/courts/CourtCard.tsx`
- [ ] Thêm API methods vào `services/admin.ts`:
  - [ ] `getCourts()`
  - [ ] `createCourt()`
  - [ ] `updateCourt()`
- [ ] Update routing trong `App.tsx`
- [ ] Test: Tạo sân mới, edit sân, toggle status
- [ ] Commit: "Phase 3: Courts Management"

### Buổi 2:
- [ ] Tạo `pages/admin/Bookings.tsx`
- [ ] Tạo `components/admin/dashboard/RevenueChart.tsx`
- [ ] Tạo `components/admin/dashboard/RecentBookings.tsx`
- [ ] Thêm API: `getOwnerBookings()`
- [ ] Update Dashboard với chart và recent bookings
- [ ] Test: Xem bookings, filter, search
- [ ] Commit: "Phase 4: Bookings Management & Enhanced Dashboard"

---

## 🎨 Design Guidelines

**Colors:**
- Primary: Lime-400 (#a3e635)
- Background: Slate-900 (#0f172a)
- Cards: Slate-800 (#1e293b)
- Borders: Slate-700 (#334155)
- Text: White, Slate-400

**Components:**
- Sử dụng lại components từ `components/ui/`
- Consistent spacing: p-4, p-5, p-6
- Rounded corners: rounded-lg, rounded-xl
- Hover effects: hover:border-lime-400/50

---

## 🚀 Tips

1. **Copy existing patterns:** Xem `pages/Home.tsx`, `pages/Profile.tsx` để học cách structure
2. **Reuse components:** Button, Card, Input đã có sẵn
3. **API pattern:** Follow pattern trong `services/api.ts`
4. **Error handling:** Luôn có try-catch và show toast
5. **Loading states:** Dùng LoadingSpinner khi fetch data
6. **Empty states:** Luôn có UI khi chưa có data

---

## 📞 Support

Nếu gặp vấn đề:
1. Check console log
2. Check Supabase RLS policies
3. Verify API response format
4. Test với Postman/curl nếu cần

Good luck! 🚀
