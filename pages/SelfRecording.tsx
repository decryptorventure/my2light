import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Square, Sparkles, Play, Check, Download,
  RefreshCw, X, Clock, Settings, Pause, Mic, Info, UploadCloud, Camera
} from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { celebrate, fireworks } from '../lib/confetti';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { UploadService } from '../services/uploadService';
import { Modal } from '../components/ui/Modal';
import { VideoStorage } from '../lib/storage';

type RecordingStep = 'ready' | 'recording' | 'uploading' | 'done';

export const SelfRecording: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  // State
  const [step, setStep] = useState<RecordingStep>('ready');
  const [sessionId] = useState(() => crypto.randomUUID());
  const [showSettings, setShowSettings] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

  // Settings state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [highlightDuration, setHighlightDuration] = useState(15); // seconds
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // front or back camera

  // Recording Hook
  const {
    startRecording,
    stopRecording,
    addHighlight,
    isRecording,
    isPaused,
    duration,
    stream,
    highlightCount,
    error
  } = useMediaRecorder({
    onError: (err) => showToast(`Recording error: ${err.message}`, 'error')
  });

  // Effect to initialize camera preview BEFORE recording
  useEffect(() => {
    const initPreview = async () => {
      try {
        // Stop existing stream if switching cameras
        if (previewStream) {
          previewStream.getTracks().forEach(track => track.stop());
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });
        setPreviewStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Failed to get camera preview:', err);
        showToast('Không thể truy cập camera. Vui lòng cho phép quyền camera.', 'error');
      }
    };

    initPreview();

    // Cleanup preview stream on unmount
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Effect to attach recording stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleStart = async () => {
    try {
      await startRecording(sessionId);
      setStep('recording');
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleStop = async () => {
    await stopRecording();
    setStep('uploading');
  };

  const handleMarkHighlight = () => {
    addHighlight();
    showToast('Đã đánh dấu Highlight! 🏆', 'success');
    celebrate({ particleCount: 30, spread: 50 });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-900">
        {/* Header (Only visible when not uploading/done) */}
        {step !== 'uploading' && step !== 'done' && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 pt-safe flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition">
              <ChevronLeft size={24} />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-white hover:bg-white/10 rounded-full transition"
              >
                <Settings size={24} />
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="pt-0 pb-safe h-screen flex flex-col">
          <AnimatePresence mode="wait">

            {/* READY & RECORDING STATE */}
            {(step === 'ready' || step === 'recording') && (
              <motion.div
                key="camera-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 relative bg-black"
              >
                {/* Camera Preview */}
                {(stream || previewStream) ? (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />

                    {/* Camera Flip Button - Only show when ready (not recording) */}
                    {step === 'ready' && (
                      <button
                        onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                        className="absolute top-24 right-4 z-50 p-3 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-black/80 transition active:scale-95 shadow-lg border border-white/10"
                        aria-label="Đổi camera"
                      >
                        <Camera size={24} />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    <div className="text-slate-500">Đang khởi tạo camera...</div>
                  </div>
                )}

                {/* Recording Overlay */}
                {step === 'recording' && (
                  <div className="absolute top-24 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-red-500 animate-pulse'}`} />
                      <span className="text-xl font-mono font-black text-white">
                        {formatTime(duration)}
                      </span>
                    </div>

                    {highlightCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-lime-400/90 rounded-full px-3 py-1 flex items-center gap-2"
                      >
                        <Sparkles size={14} className="text-slate-900" />
                        <span className="text-sm font-bold text-slate-900">
                          {highlightCount} Highlights
                        </span>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent pb-safe-bottom pt-20">
                  {step === 'recording' ? (
                    <div className="grid grid-cols-3 gap-4 items-end">
                      {/* Placeholder for future Pause/Resume */}
                      <div />

                      {/* Mark Highlight (Center, Large) */}
                      <button
                        onClick={handleMarkHighlight}
                        className="flex flex-col items-center gap-2 -mt-4"
                      >
                        <div className="w-24 h-24 bg-lime-400 rounded-full flex items-center justify-center shadow-lg shadow-lime-400/30 active:scale-95 transition border-4 border-black/20">
                          <Sparkles size={40} className="text-slate-900" />
                        </div>
                        <span className="text-xs text-lime-400 font-bold uppercase tracking-wider">Highlight</span>
                      </button>

                      {/* Stop */}
                      <button
                        onClick={handleStop}
                        className="flex flex-col items-center gap-2 group"
                      >
                        <div className="w-14 h-14 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center text-red-500 active:bg-red-500 active:text-white transition">
                          <Square size={24} fill="currentColor" />
                        </div>
                        <span className="text-xs text-red-400 font-medium">Kết thúc</span>
                      </button>
                    </div>
                  ) : (
                    /* Start Button */
                    <div className="pb-8">
                      <Button
                        onClick={handleStart}
                        size="xl"
                        className="w-full py-6 text-lg shadow-xl shadow-lime-400/20"
                        icon={<Play size={28} fill="currentColor" />}
                      >
                        Bắt đầu quay
                      </Button>
                      <p className="text-center text-slate-400 text-sm mt-4">
                        Nhấn quay để bắt đầu ghi lại trận đấu của bạn
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* UPLOADING STATE */}
            {step === 'uploading' && (
              <UploadStep
                sessionId={sessionId}
                onComplete={() => setStep('done')}
                onProgress={setUploadProgress}
              />
            )}

            {/* DONE STATE */}
            {step === 'done' && (
              <DoneStep
                onGoHome={() => navigate('/home')}
                highlightCount={highlightCount}
              />
            )}

          </AnimatePresence>
        </div>

        {/* Settings Modal */}
        <Modal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          title="Cài đặt Quay Video"
        >
          <div className="space-y-6">
            {/* Voice Recognition Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic size={20} className="text-lime-400" />
                  <label className="text-white font-medium">Nhận diện giọng nói</label>
                </div>
                <button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`relative w-12 h-6 rounded-full transition ${voiceEnabled ? 'bg-lime-400' : 'bg-slate-700'
                    }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${voiceEnabled ? 'translate-x-6' : ''
                      }`}
                  />
                </button>
              </div>
              <p className="text-sm text-slate-400">
                Tự động đánh dấu highlight khi bạn nói &quot;Highlight&quot; hoặc &quot;Ghi lại&quot;
              </p>
            </div>

            {/* Highlight Duration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-lime-400" />
                <label className="text-white font-medium">Độ dài highlight</label>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Trước điểm đánh dấu</span>
                  <span className="text-white font-mono">{highlightDuration}s</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={highlightDuration}
                  onChange={(e) => setHighlightDuration(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>5s</span>
                  <span>15s</span>
                  <span>30s</span>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                Thời lượng video trước khi bạn đánh dấu highlight sẽ được lưu lại
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-lime-400 mt-0.5" />
                <div className="text-sm text-slate-300">
                  <p className="font-medium mb-1">Hướng dẫn:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Quay toàn bộ trận đấu</li>
                    <li>Nhấn nút <b className="text-white">Highlight</b> khi có pha bóng đẹp</li>
                    <li>Hệ thống sẽ tự động cắt video sau khi kết thúc</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={() => setShowSettings(false)} className="w-full">
              Lưu cài đặt
            </Button>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
};

// --- Sub-components ---

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const UploadStep: React.FC<{
  sessionId: string;
  onComplete: () => void;
  onProgress: (p: number) => void;
}> = ({ sessionId, onComplete, onProgress }) => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const upload = async () => {
      try {
        setError(null);
        await UploadService.uploadSession(sessionId, (p) => {
          setProgress(p);
          onProgress(p);
        });
        // Clear local data after success
        await UploadService.clearLocalSession(sessionId);
        onComplete();
      } catch (err: any) {
        console.error('Upload error:', err);
        setError(err.message || 'Lỗi upload video. Vui lòng thử lại.');
      }
    };
    upload();
  }, [sessionId, retryCount]);

  if (error) {
    return (
      <motion.div
        key="upload-error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col items-center justify-center bg-slate-900 px-6"
      >
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
            <X size={40} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Lỗi Upload</h2>
            <p className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm">
              {error}
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => setRetryCount(prev => prev + 1)}
              className="w-full"
              icon={<RefreshCw size={20} />}
            >
              Thử lại
            </Button>
            <Button
              onClick={() => window.location.href = '/home'}
              variant="outline"
              className="w-full"
            >
              Quay về trang chủ
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="uploading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center bg-slate-900 px-6"
    >
      <div className="w-24 h-24 mb-6 relative">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-800"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={251.2}
            strokeDashoffset={251.2 * (1 - progress)}
            className="text-lime-400 transition-all duration-300 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
          {Math.round(progress * 100)}%
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">Đang tải lên...</h2>
      <p className="text-slate-400 text-center mb-6">
        Video đang được gửi lên server để xử lý. Vui lòng không tắt ứng dụng.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}
    </motion.div>
  );
};

const DoneStep: React.FC<{
  onGoHome: () => void;
  highlightCount: number;
}> = ({ onGoHome, highlightCount }) => {
  useEffect(() => {
    fireworks();
  }, []);

  return (
    <motion.div
      key="done"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col items-center justify-center bg-slate-900 px-6"
    >
      <div className="w-32 h-32 bg-gradient-to-br from-lime-400 to-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl">
        <Check size={64} className="text-slate-900" strokeWidth={3} />
      </div>

      <h2 className="text-3xl font-black text-white mb-3">Hoàn thành! 🎉</h2>
      <p className="text-slate-400 mb-8 text-center max-w-sm">
        Bạn đã ghi lại {highlightCount} khoảnh khắc tuyệt vời.
        <br />
        Hệ thống sẽ gửi thông báo khi video xử lý xong.
      </p>

      <Button
        onClick={onGoHome}
        size="xl"
        className="w-full max-w-sm"
      >
        Về trang chủ
      </Button>
    </motion.div>
  );
};
