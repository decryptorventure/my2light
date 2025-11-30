# Phase 2: Core Feature Fixes - Implementation Plan

**Status**: Ready to start  
**Duration**: 6 weeks (Week 3-8)  
**Goal**: Fix all incomplete and broken features

---

## 🎯 Overview

Based on the original refactoring plan and code analysis, Phase 2 focuses on completing broken features:

### Priority (High → Low):
1. ✅ **Database indexes** (DONE - Migration 016)
2. 🔧 **Admin Panel TODOs** (Week 3) - Quick wins
3. 🔧 **Booking System** (Week 4) - Business critical
4. 🔧 **Self-Recording Ring Buffer** (Week 5-6) - Complex
5. 🔧 **MQTT Camera Control** (Week 6) - Hardware dependent
6. 🔧 **Social Features** (Week 7-8) - Nice to have

---

## 📋 Week 3: Admin Panel Completion

### Current Issues:

**Dashboard Analytics** (`pages/admin/Dashboard.tsx` line 257-258):
```typescript
totalBookings: 0, // TODO: Calculate from bookings  
monthlyRevenue: 0, // TODO: Calculate from bookings
```

**Revenue Reports** - Not calculating correctly

### Solution:

#### 1. Complete Stats Calculation

**File**: `services/admin.ts`

```typescript
async getStats(courtId?: string): Promise<ApiResponse<AdminStats>> {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    // Get bookings for calculation
    let query = supabase
      .from('bookings')
      .select('total_amount, status, created_at');
    
    if (courtId) {
      query = query.eq('court_id', courtId);
    }
    
    const { data: bookings, error } = await query
      .gte('created_at', startOfMonth.toISOString());
    
    if (error) throw error;
    
    // Calculate stats
    const totalBookings = bookings?.length || 0;
    const completedBookings = bookings?.filter(b => 
      b.status === 'completed' || b.status === 'confirmed'
    ).length || 0;
    
    const monthlyRevenue = bookings
      ?.filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    
    const avgBookingValue = totalBookings > 0 
      ? monthlyRevenue / totalBookings 
      : 0;
    
    return {
      success: true,
      data: {
        totalBookings,
        completedBookings,
        monthlyRevenue,
        avgBookingValue,
        // ... other stats
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

#### 2. Booking Management Filters

**File**: `pages/admin/BookingsManagement.tsx`

Add working filters:
- By date range
- By status (pending, confirmed, cancelled)
- By court
- Search by customer name

```typescript
const [filters, setFilters] = useState({
  dateFrom: null,
  dateTo: null,
  status: 'all',
  courtId: 'all',
  search: ''
});

const filteredBookings = bookings.filter(booking => {
  // Apply all filters
  if (filters.dateFrom && booking.start_time < filters.dateFrom) return false;
  if (filters.dateTo && booking.start_time > filters.dateTo) return false;
  if (filters.status !== 'all' && booking.status !== filters.status) return false;
  if (filters.courtId !== 'all' && booking.court_id !== filters.courtId) return false;
  if (filters.search && !booking.user_name.toLowerCase().includes(filters.search.toLowerCase())) return false;
  return true;
});
```

**Expected Impact**: Admin can now see accurate revenue data and filter bookings effectively.

---

## 📋 Week 4: Booking System Improvements

### Issues to Fix:

1. ❌ Real-time availability not syncing
2. ❌ Payment webhook insecure (no HMAC verification)
3. ❌ Notifications inconsistent after booking
4. ❌ Cancel/reschedule flow incomplete

### Solution 1: Real-Time Court Availability

**New File**: `hooks/useRealtimeBookings.ts`

```typescript
export const useRealtimeBookings = (courtId: string) => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel(`bookings:court_id=eq.${courtId}`)
      .on('postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookings',
          filter: `court_id=eq.${courtId}`
        },
        (payload) => {
          console.log('Booking changed:', payload);
          
          // Invalidate queries to refetch
          queryClient.invalidateQueries(['court-availability', courtId]);
          queryClient.invalidateQueries(['bookings', courtId]);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [courtId, queryClient]);
};
```

**Files to modify**:
- `pages/CourtDetail.tsx` - use `useRealtimeBookings(courtId)`
- `pages/Booking.tsx` - invalidate availability when booking

### Solution 2: Webhook Security

**New File**: `services/webhook.ts`

```typescript
import crypto from 'crypto';

export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
};

export const handlePaymentWebhook = async (
  payload: any,
  signature: string
): Promise<{ success: boolean; error?: string }> => {
  // Verify signature
  const isValid = verifyWebhookSignature(
    JSON.stringify(payload),
    signature,
    process.env.VITE_WEBHOOK_SECRET!
  );
  
  if (!isValid) {
    console.error('Invalid webhook signature');
    return { success: false, error: 'Invalid signature' };
  }
  
  // Process payment
  try {
    if (payload.status === 'success') {
      // Update booking status
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', payload.bookingId);
      
      // Send notification
      await NotificationService.send({
        userId: payload.userId,
        type: 'booking_confirmed',
        title: 'Đặt sân thành công!',
        data: { bookingId: payload.bookingId }
      });
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
```

**Files to modify**:
- `pages/PaymentCallback.tsx` - add signature verification
- `services/payment.ts` - integrate webhook handler

### Solution 3: Notifications

**File**: `services/notifications.ts`

```typescript
export const sendBookingNotification = async (
  bookingId: string,
  type: 'confirmed' | 'cancelled' | 'rescheduled'
) => {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, courts(*), profiles(*)')
    .eq('id', bookingId)
    .single();
  
  if (!booking) return;
  
  const notifications = {
    confirmed: {
      title: 'Đặt sân thành công! 🎉',
      body: `Bạn đã đặt sân ${booking.courts.name} lúc ${formatTime(booking.start_time)}`
    },
    cancelled: {
      title: 'Đã hủy đặt sân',
      body: `Đặt sân tại ${booking.courts.name} đã được hủy`
    },
    rescheduled: {
      title: 'Đã đổi lịch đặt sân',
      body: `Lịch đặt sân tại ${booking.courts.name} đã được cập nhật`
    }
  };
  
  await ApiService.createNotification({
    user_id: booking.user_id,
    type: `booking_${type}`,
    ...notifications[type],
    data: { bookingId }
  });
};
```

**Expected Impact**: Users receive timely, accurate notifications. Secure webhooks prevent fraud.

---

## 📋 Week 5-6: Self-Recording Ring Buffer

### Current Problem:

Video recording doesn't have ring buffer → can't save 30-60s **before** highlight button pressed.

### Solution: Implement Ring Buffer

**New File**: `hooks/useRingBuffer.ts`

```typescript
/**
 * Ring Buffer for video recording
 * Keeps last 30-60 seconds in memory, only saves when highlight triggered
 */
export const useRingBuffer = (durationSeconds: number = 30) => {
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [isBuffering, setIsBuffering] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const bufferRef = useRef<Blob[]>([]);
  
  const startBuffering = async (stream: MediaStream) => {
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: 2500000 // 2.5 Mbps
    });
    
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        // Add to ring buffer
        bufferRef.current.push(event.data);
        
        // Calculate total duration
        const totalDuration = bufferRef.current
          .reduce((sum, blob) => sum + estimateDuration(blob), 0);
        
        // Remove old chunks if over duration limit
        while (totalDuration > durationSeconds * 1000) {
          bufferRef.current.shift();
        }
      }
    };
    
    recorder.start(1000); // Capture every 1 second
    mediaRecorderRef.current = recorder;
    setIsBuffering(true);
  };
  
  const saveHighlight = () => {
    // Create highlight from ring buffer
    const highlightBlob = new Blob(bufferRef.current, {
      type: 'video/webm'
    });
    
    setChunks([...bufferRef.current]);
    
    return highlightBlob;
  };
  
  const stopBuffering = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsBuffering(false);
    }
  };
  
  return {
    startBuffering,
    saveHighlight,
    stopBuffering,
    isBuffering,
    bufferDuration: durationSeconds
  };
};

// Helper to estimate blob duration (rough estimate)
const estimateDuration = (blob: Blob): number => {
  // Assume 1 second per chunk (from recorder.start(1000))
  return 1000;
};
```

**Files to modify**:
- `pages/SelfRecording.tsx` - integrate ring buffer
- `hooks/useMediaRecorder.ts` - use ring buffer hook
- Add UI indicator showing buffer status

**Expected Impact**: Users can now save highlights retroactively! 30s before button press is saved.

---

## 📋 Week 6: MQTT Camera Control

### Issues:

1. Connection not stable
2. No reconnect logic
3. No message queuing when offline

### Solution:

**File**: `services/mqttService.ts`

```typescript
class MQTTService {
  private client: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageQueue: Array<{courtId: string, command: any}> = [];
  private isConnected = false;
  
  async connect() {
    try {
      this.client = mqtt.connect(process.env.VITE_MQTT_BROKER_URL!, {
        clientId: `web-${crypto.randomUUID()}`,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
      });
      
      this.client.on('connect', () => {
        console.log('MQTT connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Flush queued messages
        this.flushQueue();
      });
      
      this.client.on('error', (error: any) => {
        console.error('MQTT error:', error);
        this.handleReconnect();
      });
      
      this.client.on('close', () => {
        console.log('MQTT connection closed');
        this.isConnected = false;
        this.handleReconnect();
      });
    } catch (error) {
      console.error('MQTT connect failed:', error);
    }
  }
  
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      setTimeout(() => {
        console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
        this.connect();
      }, delay);
    }
  }
  
  private flushQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendCommand(message.courtId, message.command);
      }
    }
  }
  
  async sendCommand(courtId: string, command: CameraCommand) {
    // Queue if offline
    if (!this.isConnected) {
      this.messageQueue.push({ courtId, command });
      return { success: false, error: 'Offline - queued' };
    }
    
    try {
      const topic = `court/${courtId}/camera/command`;
      this.client.publish(topic, JSON.stringify(command), {
        qos: 1 // At least once delivery
      });
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export const mqttService = new MQTTService();
```

**Files to modify**:
- `components/admin/VenueControl.tsx` - use improved MQTT service
- `pages/ActiveSession.tsx` - add connection status indicator

**Expected Impact**: Reliable camera control with offline queueing.

---

## 📋 Week 7-8: Social Features

### TODO Items to Complete:

1. Share functionality (currently just TODO comment)
2. Leaderboard (shows "Coming Soon")
3. Nested comment replies

### Solution 1: Share Functionality

**File**: `pages/social/Feed.tsx`, `components/social/ActivityCard.tsx`

```typescript
const handleShare = async (highlight: Highlight) => {
  const url = `${window.location.origin}/#/highlight/${highlight.id}`;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: highlight.title || 'Check out my highlight!',
        text: highlight.description || '',
        url
      });
      
      // Track share
      await ApiService.incrementShares(highlight.id);
    } catch (error) {
      console.log('Share cancelled');
    }
  } else {
    // Fallback: Copy to clipboard
    await navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard!', 'success');
  }
};
```

### Solution 2: Leaderboard

**New File**: `pages/social/Leaderboard.tsx`

```typescript
export const Leaderboard: React.FC = () => {
  const [tab, setTab] = useState<'highlights' | 'followers'>('highlights');
  
  const { data: topPlayers } = useQuery(
    ['leaderboard', tab],
    async () => {
      const orderBy = tab === 'highlights' 
        ? 'total_highlights' 
        : 'followers_count';
      
      const { data } = await supabase
        .from('profiles')
        .select('id, name, avatar, total_highlights, followers_count')
        .order(orderBy, { ascending: false })
        .limit(20);
      
      return data;
    }
  );
  
  return (
    <PageTransition>
      <div className="min-h-screen">
        <h1>Bảng xếp hạng</h1>
        
        <Tabs value={tab} onChange={setTab}>
          <Tab value="highlights">Nhiều highlights</Tab>
          <Tab value="followers">Nhiều followers</Tab>
        </Tabs>
        
        {topPlayers?.map((player, index) => (
          <LeaderboardCard 
            key={player.id}
            rank={index + 1}
            player={player}
          />
        ))}
      </div>
    </PageTransition>
  );
};
```

**Expected Impact**: Complete social features, users can share and compete!

---

## 🎯 Summary

### Week Breakdown:
- **Week 3**: Admin panel (stats, filters) ✅ Quick wins
- **Week 4**: Booking (realtime, webhooks, notifications) ⚡ Business critical
- **Week 5-6**: Ring buffer implementation 🎥 Complex but important
- **Week 6**: MQTT improvements 📡 Hardware dependent
- **Week 7-8**: Social features polish 🌟 Nice to have

### Expected Outcomes:
- ✅ Admin panel fully functional with accurate data
- ✅ Secure, real-time booking system
- ✅ Revolutionary ring buffer for highlights
- ✅ Reliable camera control
- ✅ Complete social features

### Risk Assessment:
- **Low risk**: Admin panel, social features (pure code)
- **Medium risk**: Booking system (needs testing)
- **High risk**: Ring buffer (complex, needs extensive testing)
- **Hardware dependent**: MQTT (needs physical cameras)

---

## 📝 Next Steps

1. Start with **Week 3** (Admin panel) - easiest, quickest wins
2. Get user feedback on priorities
3. Test ring buffer extensively before deployment
4. Document all changes in CHANGELOG

Ready to start? 🚀
