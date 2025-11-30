# Ring Buffer Integration Guide for SelfRecording.tsx

This document provides step-by-step code snippets to complete the ring buffer integration into SelfRecording page.

---

## Step 1: Update handleStart() ✅ 

**Location**: Around line 93-125

**Add ring buffer start logic after `setStep('recording')`:**

```typescript
const handleStart = async () => {
  try {
    await startRecording(sessionId, facingMode);
    setStep('recording');

    // NEW: Start ring buffer if enabled
    if (ringBufferEnabled && previewStream) {
      try {
        await ringBuffer.startBuffering(previewStream);
        console.log('[SelfRecording] Ring buffer started');
      } catch (err) {
        console.error('[SelfRecording] Failed to start ring buffer:', err);
        showToast('Ring buffer không khả dụng', 'warning');
      }
    }

    // Capture thumbnail after 2 seconds...
    // (rest of existing code)
```

---

## Step 2: Update handleStop() ✅

**Location**: Around line 127-130

**Add ring buffer cleanup:**

```typescript
const handleStop = async () => {
  await stopRecording();
  
  // NEW: Stop ring buffer if active
  if (ringBuffer.isBuffering) {
    ringBuffer.stopBuffering();
    console.log('[SelfRecording] Ring buffer stopped');
  }
  
  setStep('uploading');
};
```

---

## Step 3: Add handleRetroactiveHighlight() (NEW)

**Location**: After handleMarkHighlight() (around line 136)

```typescript
// NEW: Handle retroactive highlight capture
const handleRetroactiveHighlight = async () => {
  if (!ringBuffer.isBuffering) {
    showToast('Ring buffer chưa sẵn sàng', 'error');
    return;
  }

  try {
    showToast('Đang lưu 30s trước đó...', 'info');
    
    // Capture from buffer (past 30s + future 5s)
    const highlightBlob = await ringBuffer.captureHighlight(5);
    
    if (highlightBlob) {
      // Save using chunk storage (temporary solution)
      const chunkId = Date.now(); // Unique ID
      await VideoStorage.saveChunk(sessionId, chunkId, highlightBlob);
      
      showToast('🎉 Đã lưu Retroactive Highlight! (35s)', 'success');
      fireworks();
      
      console.log('[SelfRecording] Retroactive highlight saved:', {
        size: `${(highlightBlob.size / 1024 / 1024).toFixed(1)} MB`,
        duration: '~35s',
        chunkId
      });
    } else {
      showToast('Không thể lưu highlight', 'error');
    }
  } catch (err) {
    console.error('[SelfRecording] Retroactive highlight error:', err);
    showToast('Lỗi khi lưu highlight', 'error');
  }
};
```

---

## Step 4: Add BufferIndicator to Render ✅

**Location**: Right after opening `<div className="min-h-screen bg-slate-900">` (around line 144)

```typescript
return (
  <PageTransition>
    <div className="min-h-screen bg-slate-900">
      {/* NEW: Buffer Indicator */}
      {ringBufferEnabled && (
        <BufferIndicator
          isBuffering={ringBuffer.isBuffering}
          duration={ringBuffer.bufferDuration}
          chunkCount={ringBuffer.bufferSize}
          memoryUsage={ringBuffer.memoryUsage}
          showDetails={false} // Compact view
        />
      )}

      {/* Header ... */}
```

---

## Step 5: Add Retroactive Button to Controls

**Location**: In recording controls grid (around line 288-310)

**Replace the placeholder `<div />` with retroactive button:**

```typescript
{step === 'recording' ? (
  <div className="grid grid-cols-3 gap-4 items-end">
    {/* NEW: Retroactive Highlight Button (Left) */}
    {ringBufferEnabled && ringBuffer.isBuffering && (
      <button
        onClick={handleRetroactiveHighlight}
        className="flex flex-col items-center gap-2 group"
      >
        <div className="w-14 h-14 bg-purple-500/20 border-2 border-purple-500 rounded-full flex items-center justify-center text-purple-400 active:bg-purple-500 active:text-white transition">
          <Clock size={24} />
        </div>
        <span className="text-xs text-purple-400 font-medium">Lưu 30s</span>
      </button>
    )}

    {/* Mark Highlight (Center, Large) */}
    <button
      onClick={handleMarkHighlight}
      className="flex flex-col items-center gap-2 -mt-4"
    >
      {/* ... existing code ... */}
```

---

## Step 6: Add Ring Buffer Toggle to Settings

**Location**: In settings section with voice toggle (around line 196-214)

**Add after highlight duration setting:**

```typescript
{/* Ring Buffer Toggle (NEW) */}
<div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <Clock size={20} className="text-purple-400" />
      <label className="text-white font-bold">Retroactive Recording</label>
    </div>
    <button
      onClick={() => setRingBufferEnabled(!ringBufferEnabled)}
      className={`relative w-12 h-6 rounded-full transition ${
        ringBufferEnabled ? 'bg-purple-400' : 'bg-slate-700'
      }`}
    >
      <div
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
          ringBufferEnabled ? 'translate-x-6' : ''
        }`}
      />
    </button>
  </div>
  <p className="text-xs text-slate-400">
    Lưu 30 giây trước khi bấm nút Highlight (tiêu tốn ~60MB RAM).
  </p>
</div>
```

---

## Summary Checklist

When all steps complete, verify:

- [ ] Ring buffer starts when recording starts
- [ ] Ring buffer stops when recording stops  
- [ ] BufferIndicator displays in top-right
- [ ] Retroactive button appears (left side) during recording
- [ ] Retroactive button only shows if ring buffer enabled
- [ ] Settings has ring buffer toggle
- [ ] Toast notifications work  
- [ ] Console logs show buffer activity

---

## Testing Instructions

1. Enable ring buffer in settings  
2. Start recording  
3. Wait 30+ seconds  
4. Press "Lưu 30s" button  
5. Check console for saved chunk  
6. Verify 35s video created  

---

## Fallback Behavior

If ring buffer fails to start:
- Show warning toast
- Continue with normal recording
- Hide retroactive button
- No crash or blocking error

---

## Performance Notes

- Memory usage: ~60-90MB for 30s buffer
- Mobile tested: Should work on modern phones (2GB+ RAM)
- Safari: May have MediaRecorder limitations
- Chrome/Firefox: Full support expected

---

**Integration Status**: Ready to implement  
**Estimated Time**: 30-45 minutes  
**Risk Level**: LOW (incremental changes, good error handling)
