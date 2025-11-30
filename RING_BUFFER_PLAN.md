# Week 5-6: Ring Buffer Implementation Plan

**Feature**: Revolutionary highlight recording - Save 30s BEFORE button press!  
**Complexity**: 🔥 **HIGH** (Most complex feature in Phase 2)  
**Duration**: 2 weeks  
**Status**: Planning

---

## 🎯 What is Ring Buffer?

### Current Problem:
```
User playing → Awesome shot happens → Press "Highlight" → Recording starts
❌ Result: Missed the awesome shot! Only recorded AFTER button press
```

### With Ring Buffer:
```
Recording always running in memory (circular buffer)
↓
Awesome shot happens (at 10:30)
↓
User presses "Highlight" at 10:35
↓
✅ Saves 30 seconds BEFORE (10:05 - 10:35) + continues for X seconds after
```

**Impact**: 🔥 **Revolutionary** - Never miss a moment again!

---

## 📊 Technical Architecture

### Ring Buffer Concept:

```
Memory Buffer (30 seconds):
┌─────────────────────────────────────┐
│ [Chunk1][Chunk2][Chunk3]...[Chunk30]│ ← Circular
└─────────────────────────────────────┘
      ↑                           ↑
   Oldest                      Newest
   
When full: Oldest chunk discarded, new chunk added
When "Highlight" pressed: All 30 chunks saved to disk
```

### Data Flow:

```
Camera Stream
     ↓
MediaRecorder (1 second chunks)
     ↓
Ring Buffer (keep last 30 chunks in memory)
     ↓
User presses "Highlight"
     ↓
Buffer → Disk → Upload to Supabase
```

---

## 🛠️ Implementation Strategy

### Phase 1: Core Ring Buffer Hook (Week 5, Day 1-3)

**File**: `hooks/useRingBuffer.ts`

**Features**:
- Circular buffer data structure
- Automatic chunk rotation (FIFO)
- Memory management (max 30 chunks)
- Chunk duration estimation
- Buffer state tracking

**Key Methods**:
```typescript
interface RingBufferHook {
  startBuffering(stream: MediaStream): void;
  stopBuffering(): void;
  captureHighlight(): Blob;  // Get last 30s + continue
  isBuffering: boolean;
  bufferDuration: number;
  memoryUsage: number;
}
```

### Phase 2: MediaRecorder Integration (Week 5, Day 4-5)

**Modify**: `hooks/useMediaRecorder.ts`

**Changes**:
- Replace direct MediaRecorder with ring buffer
- Chunk size: 1 second (balance between granularity and overhead)
- Format: webm (VP8 + Opus for compatibility)
- Bitrate: 2.5 Mbps (balance quality and size)

### Phase 3: UI Integration (Week 6, Day 1-3)

**Modify**: `pages/SelfRecording.tsx`

**Features**:
- Buffer indicator (shows buffering status)
- Memory usage display
- "Highlight" button triggers buffer capture
- Visual feedback (recording from X seconds ago)

**New Component**: `components/recording/BufferIndicator.tsx`
```tsx
<BufferIndicator 
  isBuffering={isBuffering}
  duration={bufferDuration}
  memoryUsage={memoryUsage}
/>
```

### Phase 4: Upload & Merge (Week 6, Day 4-5)

**New File**: `services/videoBuffer.ts`

**Features**:
- Merge buffer chunks into single video
- Upload to Supabase storage
- Cleanup memory after upload
- Progress tracking

---

## 📋 Detailed Implementation

### 1. Ring Buffer Data Structure

```typescript
// hooks/useRingBuffer.ts
class CircularBuffer {
  private chunks: Blob[] = [];
  private maxSize: number;
  private currentSize: number = 0;
  
  constructor(maxDurationSeconds: number) {
    this.maxSize = maxDurationSeconds; // 30 chunks for 30 seconds
  }
  
  add(chunk: Blob) {
    this.chunks.push(chunk);
    this.currentSize++;
    
    // Remove oldest if over limit
    if (this.currentSize > this.maxSize) {
      this.chunks.shift(); // Remove first (oldest)
      this.currentSize--;
    }
  }
  
  getAll(): Blob[] {
    return [...this.chunks]; // Copy to avoid mutation
  }
  
  clear() {
    this.chunks = [];
    this.currentSize = 0;
  }
  
  getSize(): number {
    return this.currentSize;
  }
  
  getTotalBytes(): number {
    return this.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
  }
}
```

### 2. MediaRecorder with Ring Buffer

```typescript
export const useRingBuffer = (durationSeconds: number = 30) => {
  const [isBuffering, setIsBuffering] = useState(false);
  const bufferRef = useRef<CircularBuffer>(new CircularBuffer(durationSeconds));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const captureStreamRef = useRef<MediaStream | null>(null);
  
  const startBuffering = async (stream: MediaStream) => {
    try {
      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });
      
      // Capture chunks every 1 second
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          bufferRef.current.add(event.data);
          console.log('[RingBuffer] Chunk added, total:', bufferRef.current.getSize());
        }
      };
      
      recorder.start(1000); // 1 second chunks
      mediaRecorderRef.current = recorder;
      captureStreamRef.current = stream;
      setIsBuffering(true);
      
      console.log('[RingBuffer] Started buffering');
    } catch (error) {
      console.error('[RingBuffer] Failed to start:', error);
    }
  };
  
  const captureHighlight = async (continueForSeconds: number = 5): Promise<Blob | null> => {
    if (!mediaRecorderRef.current) return null;
    
    // Get buffer chunks
    const bufferChunks = bufferRef.current.getAll();
    console.log('[RingBuffer] Capturing highlight, buffer chunks:', bufferChunks.length);
    
    // Continue recording for X more seconds
    const futureChunks: Blob[] = [];
    
    return new Promise((resolve) => {
      let secondsCaptured = 0;
      const targetSeconds = continueForSeconds;
      
      const tempHandler = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          futureChunks.push(event.data);
          secondsCaptured++;
          
          if (secondsCaptured >= targetSeconds) {
            // Done capturing future
            mediaRecorderRef.current?.removeEventListener('dataavailable', tempHandler);
            
            // Merge all chunks
            const allChunks = [...bufferChunks, ...futureChunks];
            const highlightBlob = new Blob(allChunks, { type: 'video/webm' });
            
            console.log('[RingBuffer] Highlight captured:', {
              pastChunks: bufferChunks.length,
              futureChunks: futureChunks.length,
              totalSize: highlightBlob.size
            });
            
            resolve(highlightBlob);
          }
        }
      };
      
      mediaRecorderRef.current?.addEventListener('dataavailable', tempHandler);
    });
  };
  
  const stopBuffering = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    if (captureStreamRef.current) {
      captureStreamRef.current.getTracks().forEach(track => track.stop());
      captureStreamRef.current = null;
    }
    
    bufferRef.current.clear();
    setIsBuffering(false);
    
    console.log('[RingBuffer] Stopped buffering');
  };
  
  return {
    startBuffering,
    stopBuffering,
    captureHighlight,
    isBuffering,
    bufferSize: bufferRef.current.getSize(),
    memoryUsage: bufferRef.current.getTotalBytes()
  };
};
```

### 3. Buffer Indicator Component

```typescript
// components/recording/BufferIndicator.tsx
export const BufferIndicator: React.FC<{
  isBuffering: boolean;
  duration: number;
  memoryUsage: number;
}> = ({ isBuffering, duration, memoryUsage }) => {
  if (!isBuffering) return null;
  
  return (
    <div className="fixed top-20 right-4 bg-slate-800 border border-lime-400 rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
        <span className="text-white text-sm font-bold">Buffering</span>
      </div>
      
      <div className="text-xs text-slate-400 space-y-1">
        <div>Buffer: {duration}s</div>
        <div>Memory: {(memoryUsage / 1024 / 1024).toFixed(1)} MB</div>
      </div>
      
      <div className="mt-2 text-xs text-lime-400">
        ✓ Ready to capture last {duration}s
      </div>
    </div>
  );
};
```

---

## 🧪 Testing Strategy

### Unit Tests:
- [ ] CircularBuffer add/remove logic
- [ ] Buffer size limits
- [ ] Chunk rotation (oldest removed)
- [ ] Memory calculation

### Integration Tests:
- [ ] MediaRecorder chunking
- [ ] Highlight capture (past + future)
- [ ] Blob merging
- [ ] Memory cleanup

### Manual Testing:
- [ ] Record for 60s, press highlight at 30s
- [ ] Verify saved video shows 30s before + 5s after
- [ ] Check memory usage doesn't exceed limits
- [ ] Test on different devices (mobile/desktop)

---

## ⚠️ Challenges & Solutions

### Challenge 1: Memory Management
**Problem**: 30s of 1080p video = ~50-70 MB in memory

**Solution**:
- Limit buffer to 30s max
- Use lower resolution for buffer (720p)
- Clear buffer after highlight saved
- Monitor memory usage

### Challenge 2: Chunk Sync
**Problem**: Video/audio chunks might not align perfectly

**Solution**:
- Use 1-second chunks (good balance)
- MediaRecorder handles sync internally
- WebM format supports timestamp metadata

### Challenge 3: Browser Compatibility
**Problem**: Safari has limited MediaRecorder support

**Solution**:
- Feature detection
- Fallback to regular recording (no buffer)
- Polyfill for iOS (if needed)

### Challenge 4: Upload Size
**Problem**: 35s video = ~80 MB to upload

**Solution**:
- Compress before upload
- Use Supabase multipart upload
- Show progress indicator
- Network retry logic

---

## 📊 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Buffer memory** | < 100 MB | Monitor in DevTools |
| **Chunk interval** | 1 second | MediaRecorder config |
| **Capture latency** | < 2s | Time from button to save |
| **Upload time** | < 30s | Network dependent |
| **CPU usage** | < 20% | Chrome Task Manager |

---

## 🎯 Success Criteria

- [ ] Buffer maintains last 30s in memory
- [ ] "Highlight" captures past 30s + future 5s
- [ ] Video playback is smooth (no gaps)
- [ ] Memory usage stays under 100 MB
- [ ] Works on Chrome, Firefox, Edge
- [ ] Mobile support (Android Chrome)
- [ ] User can see buffer status
- [ ] Upload completes successfully

---

## 📅 Week-by-Week Breakdown

### Week 5 (Days 1-5):
**Day 1-2**: CircularBuffer class + unit tests  
**Day 3**: useRingBuffer hook implementation  
**Day 4**: MediaRecorder integration  
**Day 5**: Testing & debugging

### Week 6 (Days 1-5):
**Day 1-2**: BufferIndicator UI component  
**Day 3**: SelfRecording page integration  
**Day 4**: Upload & merge logic  
**Day 5**: End-to-end testing

---

## 🚀 Next Steps

1. **Day 1**: Create CircularBuffer class
2. **Day 1**: Write unit tests
3. **Day 2**: Implement useRingBuffer hook
4. **Day 3**: Test with real MediaRecorder
5. **Day 4**: Create BufferIndicator component
6. **Day 5**: Integrate into SelfRecording

**Ready to start?** Let's build the most revolutionary feature! 🔥
