import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, X, Settings, Mic, Zap, RotateCcw,
  CheckCircle, AlertTriangle, ChevronLeft, RefreshCw,
  Play, Pause, Download, Upload, Calendar, MapPin,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '../components/Layout/PageTransition';
import { Button } from '../components/ui/Button';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { UploadService } from '../services/uploadService';
import { VideoStorage } from '../lib/storage';
import { supabase } from '../lib/supabase';

// Types
type RecordingStep = 'setup' | 'ready' | 'recording' | 'preview' | 'upload_form' | 'uploading' | 'done';

interface Court {
  id: string;
  name: string;
}

export const SelfRecording: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<RecordingStep>('setup');
  const [sessionId, setSessionId] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);

  // Settings State
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [highlightDuration, setHighlightDuration] = useState(10); // Default 10s
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');

  // Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Highlight Feedback State
  const [showHighlightFlash, setShowHighlightFlash] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    startRecording,
    stopRecording,
    addHighlight,
    switchCamera,
    isRecording,
    duration,
    stream,
    highlightCount,
    highlightEvents,
    error,
    facingMode,
    isMemoryMode,
    enableStream
  } = useMediaRecorder({
    onError: (err) => showToast(`Lỗi quay video: ${err.message}`, 'error'),
    onStorageWarning: (msg) => setStorageWarning(msg)
  });

  // Fetch courts on mount
  useEffect(() => {
    const fetchCourts = async () => {
      const { data } = await supabase.from('courts').select('id, name').limit(10);
      if (data) setCourts(data);
    };
    fetchCourts();
  }, []);

  // Effect to attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Helper to format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toast helper (simplified)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // In a real app, integrate with toast context
  };

  // --- Handlers ---

  const handleSetupComplete = async () => {
    setIsRequestingPermissions(true);
    try {
      await enableStream();
      setStep('ready');
    } catch (err) {
      console.error('Permission denied or error:', err);
      showToast('Không thể truy cập camera/mic', 'error');
    } finally {
      setIsRequestingPermissions(false);
    }
  };

  const handleStart = async () => {
    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    try {
      await startRecording(newSessionId);
      setStep('recording');
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleStop = async () => {
    await stopRecording();

    // Generate preview URL from stored chunks
    try {
      const blob = await VideoStorage.getSessionBlob(sessionId);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch (err) {
      console.error('Failed to generate preview:', err);
    }

    setStep('preview');
  };

  const handleMarkHighlight = () => {
    addHighlight();
    setShowHighlightFlash(true);
    setTimeout(() => setShowHighlightFlash(false), 300); // Flash duration
    showToast('Đã đánh dấu highlight!', 'success');
  };

  const handleSeekToHighlight = (timestamp: number) => {
    if (previewVideoRef.current) {
      // Seek to 'highlightDuration' seconds before the highlight (or 0 if less)
      const seekTime = Math.max(0, timestamp - highlightDuration);
      previewVideoRef.current.currentTime = seekTime;
      previewVideoRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleDownload = async () => {
    if (previewUrl) {
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = `my2light-recording-${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Đang tải video xuống...', 'success');
    }
  };

  const handleProceedToUpload = () => {
    // Set default title
    setTitle(`Highlight ${new Date().toLocaleString()}`);
    setStep('upload_form');
  };

  const handleUpload = async () => {
    if (!sessionId) return;

    setStep('uploading');
    try {
      await UploadService.uploadSession(sessionId, (progress) => {
        setUploadProgress(progress);
      }, {
        title,
        description,
        courtId: selectedCourtId || null,
        highlightEvents,
        duration
      });

      setStep('done');
      showToast('Tải lên thành công!', 'success');
    } catch (err: any) {
      console.error('Upload failed:', err);
      showToast(err.message || 'Lỗi tải lên', 'error');
      setStep('preview'); // Go back to preview on error
    }
  };

  // --- Render Views ---

  // 1. Setup View (New)
  if (step === 'setup') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
          {/* Header */}
          <div className="p-4 flex items-center gap-4 border-b border-slate-800">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold">Cài đặt quay</h1>
          </div>

          <div className="flex-1 p-6 space-y-8">
            {/* Voice Command */}
            <div className="bg-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-lime-400/20 flex items-center justify-center text-lime-400">
                    <Mic size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Ra lệnh giọng nói</h3>
                    <p className="text-sm text-slate-400">Nói "Highlight" để đánh dấu</p>
                  </div>
                </div>
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`w-14 h-8 rounded-full transition-colors relative ${voiceEnabled ? 'bg-lime-400' : 'bg-slate-600'
                    }`}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm ${voiceEnabled ? 'left-7' : 'left-1'
                    }`} />
                </button>
              </div>
            </div>

            {/* Highlight Duration */}
            <div className="bg-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Độ dài Highlight</h3>
                  <p className="text-sm text-slate-400">Thời gian xem lại trước khi đánh dấu</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-400">0s</span>
                  <span className="text-lime-400 text-2xl">{highlightDuration}s</span>
                  <span className="text-slate-400">60s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={highlightDuration}
                  onChange={(e) => setHighlightDuration(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-lime-400"
                />
                <p className="text-xs text-slate-500 text-center">
                  Khi xem lại, video sẽ lùi lại {highlightDuration} giây từ lúc bạn bấm nút.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md">
            <Button
              className="w-full bg-lime-400 hover:bg-lime-500 text-slate-900 font-bold py-4 text-lg flex items-center justify-center gap-2"
              onClick={handleSetupComplete}
              disabled={isRequestingPermissions}
            >
              {isRequestingPermissions ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
                  Đang xin quyền...
                </>
              ) : (
                <>
                  <Camera size={20} />
                  Bắt đầu quay
                </>
              )}
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // 2. Uploading View
  if (step === 'uploading') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-24 h-24 rounded-full border-4 border-slate-700 border-t-lime-400 animate-spin mb-6 flex items-center justify-center">
          <span className="text-xl font-bold text-lime-400">{Math.round(uploadProgress * 100)}%</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Đang tải lên...</h2>
        <p className="text-slate-400 text-center max-w-xs">
          Video đang được gửi lên server để xử lý. Vui lòng không tắt ứng dụng.
        </p>
      </div>
    );
  }

  // 3. Done View
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-20 h-20 bg-lime-400/20 rounded-full flex items-center justify-center mb-6 text-lime-400">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Hoàn tất!</h2>
        <p className="text-slate-400 text-center mb-8">
          Video của bạn đã được lưu và đang được xử lý. Bạn có thể xem lại trong thư viện.
        </p>
        <div className="flex gap-4 w-full max-w-xs">
          <Button
            className="flex-1 bg-slate-800"
            onClick={() => navigate('/')}
          >
            Về trang chủ
          </Button>
          <Button
            className="flex-1 bg-lime-400 text-slate-900"
            onClick={() => {
              setStep('setup'); // Go back to setup
              setSessionId('');
              setPreviewUrl(null);
            }}
          >
            Quay tiếp
          </Button>
        </div>
      </div>
    );
  }

  // 4. Upload Form View
  if (step === 'upload_form') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
          {/* Header */}
          <div className="p-4 flex items-center gap-4 border-b border-slate-800">
            <button onClick={() => setStep('preview')} className="p-2 hover:bg-slate-800 rounded-full">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold">Thông tin Video</h1>
          </div>

          <div className="flex-1 p-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Tiêu đề</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:border-lime-400 focus:outline-none transition-colors"
                placeholder="Nhập tiêu đề video..."
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white focus:border-lime-400 focus:outline-none transition-colors h-32 resize-none"
                placeholder="Mô tả trận đấu..."
              />
            </div>

            {/* Court Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Sân đấu</label>
              <div className="grid grid-cols-1 gap-2">
                {courts.map(court => (
                  <button
                    key={court.id}
                    onClick={() => setSelectedCourtId(court.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${selectedCourtId === court.id
                        ? 'bg-lime-400/10 border-lime-400 text-lime-400'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={18} />
                      <span className="font-medium">{court.name}</span>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => setSelectedCourtId('')}
                  className={`p-4 rounded-xl border text-left transition-all ${selectedCourtId === ''
                      ? 'bg-lime-400/10 border-lime-400 text-lime-400'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={18} />
                    <span className="font-medium">Sân khác / Không xác định</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md">
            <Button
              className="w-full bg-lime-400 hover:bg-lime-500 text-slate-900 font-bold py-4 text-lg"
              onClick={handleUpload}
            >
              Đăng Video
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // 5. Preview View
  if (step === 'preview') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-800">
            <button onClick={() => {
              if (confirm('Bạn có chắc muốn bỏ video này và quay lại?')) {
                setStep('setup'); // Go back to setup
                setPreviewUrl(null);
              }
            }} className="p-2 hover:bg-slate-800 rounded-full">
              <X size={24} />
            </button>
            <h1 className="text-lg font-bold">Xem lại Video</h1>
            <button onClick={handleDownload} className="p-2 hover:bg-slate-800 rounded-full text-lime-400">
              <Download size={24} />
            </button>
          </div>

          {/* Video Player */}
          <div className="aspect-video bg-black relative">
            {previewUrl ? (
              <video
                ref={previewVideoRef}
                src={previewUrl}
                className="w-full h-full object-contain"
                controls
                onPlay={() => setIsPlayingPreview(true)}
                onPause={() => setIsPlayingPreview(false)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>

          {/* Highlights List */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Danh sách Highlight ({highlightEvents.length})
            </h3>

            <div className="space-y-3">
              {highlightEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>Không có highlight nào được đánh dấu.</p>
                </div>
              ) : (
                highlightEvents.map((event, index) => (
                  <button
                    key={event.id}
                    onClick={() => handleSeekToHighlight(event.timestamp)}
                    className="w-full bg-slate-800 hover:bg-slate-700 p-4 rounded-xl flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-lime-400/10 text-lime-400 flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white">Highlight {index + 1}</div>
                        <div className="text-sm text-slate-400">
                          {formatTime(Math.max(0, event.timestamp - highlightDuration))} - {formatTime(event.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-lime-400 group-hover:text-slate-900 transition-colors">
                      <Play size={14} className="ml-0.5" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md">
            <Button
              className="w-full bg-lime-400 hover:bg-lime-500 text-slate-900 font-bold py-4 text-lg flex items-center justify-center gap-2"
              onClick={handleProceedToUpload}
            >
              <Upload size={20} />
              Đăng lên Thư viện
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // 6. Recording & Ready View
  return (
    <PageTransition>
      <div className="fixed inset-0 bg-black text-white overflow-hidden">
        {/* Highlight Flash Effect */}
        <AnimatePresence>
          {showHighlightFlash && (
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-white z-[100] pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Storage Warning */}
        <AnimatePresence>
          {storageWarning && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-4 right-4 bg-yellow-500/90 backdrop-blur-md rounded-xl p-4 z-50"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle size={24} className="text-yellow-950 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-950">{storageWarning}</p>
                  <button
                    onClick={() => setStorageWarning(null)}
                    className="text-xs font-bold text-yellow-900 mt-2 underline"
                  >
                    Đã hiểu
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera Preview */}
        {stream ? (
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            autoPlay
            playsInline
            muted
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 px-6">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Camera size={40} className="text-slate-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Đang khởi động camera...</h2>
            <p className="text-slate-400 text-center">
              Vui lòng cho phép truy cập camera và microphone để bắt đầu quay.
            </p>
          </div>
        )}

        {/* Overlays */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 z-10">
          {/* Top Bar */}
          <div className="flex justify-between items-start">
            {step === 'ready' ? (
              <button
                onClick={() => setStep('setup')}
                className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
            ) : (
              <div className="bg-red-500/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-xs font-bold uppercase tracking-wider">REC</span>
                <span className="text-xs font-mono w-12">{formatTime(duration)}</span>
              </div>
            )}

            {/* Camera Switch Button - Top Right (Show during recording or ready) */}
            {(step === 'recording' || step === 'ready') && (
              <motion.button
                key="camera-switch"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await switchCamera();
                    showToast(`Đã chuyển camera`, 'success');
                  } catch (err) {
                    console.error('[Camera] Switch failed:', err);
                  }
                }}
                className="absolute top-4 right-4 w-12 h-12 bg-slate-900/50 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-slate-800 active:scale-95 transition-all shadow-xl z-[100]"
              >
                <RefreshCw size={20} />
              </motion.button>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="flex flex-col gap-6 items-center">
            {step === 'recording' && (
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
                <Zap size={16} className="text-lime-400 fill-lime-400" />
                <span className="font-bold text-lime-400">{highlightCount}</span>
                <span className="text-sm text-white/80">Highlights</span>
              </div>
            )}

            <div className="flex items-center gap-8">
              {step === 'ready' ? (
                <button
                  onClick={handleStart}
                  className="w-20 h-20 bg-red-500 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/20"
                >
                  <div className="w-8 h-8 bg-white rounded-sm" />
                </button>
              ) : (
                <>
                  {/* Highlight Button */}
                  <button
                    onClick={handleMarkHighlight}
                    className="w-14 h-14 bg-lime-400 rounded-full flex items-center justify-center text-slate-900 hover:bg-lime-300 active:scale-95 transition-all shadow-lg shadow-lime-400/20"
                  >
                    <Zap size={24} className="fill-current" />
                  </button>

                  {/* Stop Button */}
                  <button
                    onClick={handleStop}
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                  >
                    <div className="w-8 h-8 bg-red-500 rounded-sm" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};
