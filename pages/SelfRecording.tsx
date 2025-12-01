import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Square, Sparkles, Play, Check, Download,
  RefreshCw, X, Clock, Settings, Pause, Mic, Info, UploadCloud, AlertCircle
} from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { celebrate, fireworks } from '../lib/confetti';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { UploadService } from '../services/uploadService';
import { Modal } from '../components/ui/Modal';
import { VideoStorage } from '../lib/storage';

type RecordingStep = 'ready' | 'recording' | 'preview' | 'uploading' | 'done';

export const SelfRecording: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  // State
  const [step, setStep] = useState<RecordingStep>('ready');
  const [sessionId] = useState(() => crypto.randomUUID());
  const [showSettings, setShowSettings] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [voiceCommandEnabled, setVoiceCommandEnabled] = useState(false);
  const [highlightDuration, setHighlightDuration] = useState(15);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  // Recording Hook
  const {
    startRecording,
    stopRecording,
    addHighlight,
    switchCamera,
    isRecording,
    isPaused,
    duration,
    stream,
    highlightCount,
    error,
    facingMode,
    isMemoryMode
  } = useMediaRecorder({
    onError: (err) => showToast(`Lỗi quay video: ${err.message}`, 'error'),
    onStorageWarning: (msg) => setStorageWarning(msg)
  });

  // Effect to attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleStart = async () => {
    try {
      console.log('[SelfRecording] Starting recording...', sessionId);
      await startRecording(sessionId);
      console.log('[SelfRecording] Recording started, isRecording:', isRecording);
      setStep('recording');
    } catch (err) {
      console.error('[SelfRecording] Start failed:', err);
      // Error handled by hook
    }
  };

  const handleStop = async () => {
    await stopRecording();
    setStep('preview'); // Go to preview first
  };

  const handleMarkHighlight = () => {
    addHighlight();
    showToast('Đã đánh dấu Highlight! 🏆', 'success');
    celebrate({ particleCount: 30, spread: 50 });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-900">
        {/* Header Removed as per user request */}

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
                {/* Back Button (Overlay) */}
                <button
                  onClick={() => navigate(-1)}
                  className="absolute top-12 left-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition"
                >
                  <ChevronLeft size={24} />
                </button>

                {/* Storage Warning Banner */}
                {(storageWarning || isMemoryMode) && (
                  <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute top-0 left-0 right-0 z-50 bg-yellow-500/95 backdrop-blur-md p-4"
                  >
                    <div className="flex items-start gap-3 max-w-md mx-auto">
                      <AlertCircle size={24} className="flex-shrink-0 text-yellow-900" />
                      <div className="flex-1">
                        <h3 className="font-bold text-yellow-900 mb-1">Cảnh báo lưu trữ</h3>
                        <p className="text-sm text-yellow-900">
                          {storageWarning || 'Đang dùng bộ nhớ tạm. Video sẽ mất nếu đóng ứng dụng. Vui lòng upload ngay sau khi quay!'}
                        </p>
                      </div>
                      <button
                        onClick={() => setStorageWarning(null)}
                        className="text-yellow-900 hover:text-yellow-950"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Camera Preview */}
                {stream ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover scale-x-[-1]"
                    autoPlay
                    playsInline
                    muted
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 px-6">
                    {step === 'ready' && (
                      <>
                        <h2 className="text-xl font-bold text-white mb-6">Cài đặt quay</h2>

                        {/* Voice Command Toggle */}
                        <div className="w-full max-w-md mb-6">
                          <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Mic size={18} className="text-lime-400" />
                                <span className="font-bold text-white">Nhận diện giọng nói</span>
                              </div>
                              <p className="text-xs text-slate-400">
                                Nói "Highlight" để đánh dấu tự động
                              </p>
                            </div>
                            <button
                              onClick={() => setVoiceCommandEnabled(!voiceCommandEnabled)}
                              className={`w-12 h-6 rounded-full transition-colors relative ${voiceCommandEnabled ? 'bg-lime-400' : 'bg-slate-700'
                                }`}
                            >
                              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${voiceCommandEnabled ? 'left-7' : 'left-1'
                                }`} />
                            </button>
                          </div>
                        </div>

                        {/* Highlight Duration Slider */}
                        <div className="w-full max-w-md mb-8">
                          <div className="p-4 bg-slate-800 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Clock size={18} className="text-lime-400" />
                                <span className="font-bold text-white">Thời gian rollback</span>
                              </div>
                              <span className="text-lime-400 font-bold">{highlightDuration}s</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="60"
                              step="5"
                              value={highlightDuration}
                              onChange={(e) => setHighlightDuration(Number(e.target.value))}
                              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                              style={{
                                background: `linear-gradient(to right, #a3e635 0%, #a3e635 ${((highlightDuration - 5) / 55) * 100}%, #334155 ${((highlightDuration - 5) / 55) * 100}%, #334155 100%)`
                              }}
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-2">
                              <span>5s</span>
                              <span>30s</span>
                              <span>60s</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-center text-slate-400 text-sm">
                          Điều chỉnh cài đặt trước khi bắt đầu quay
                        </p>
                      </>
                    )}
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
                      {/* Debug info */}
                      <span className="text-xs text-yellow-400 ml-2">({duration}s)</span>
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

                  {/* Camera Switch Button - Top Right (Always show when stream is active and not finished) */}
                  {stream && step !== 'uploading' && step !== 'done' && !isRecording && (
                    <motion.button
                      key="camera-switch"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={async (e) => {
                        e.stopPropagation(); // Prevent bubbling
                        try {
                          console.log('[Camera] Switching camera...');
                          await switchCamera();
                          showToast(`Đã chuyển sang camera ${facingMode === 'user' ? 'sau' : 'trước'}`, 'success');
                        } catch (err) {
                          console.error('[Camera] Switch failed:', err);
                        }
                      }}
                      className="absolute top-6 right-4 w-12 h-12 bg-slate-900/50 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-slate-800 active:scale-95 transition-all shadow-xl z-[100]"
                    >
                      <RefreshCw size={20} />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}

            {/* PREVIEW STATE */}
            {step === 'preview' && (
              <PreviewStep
                sessionId={sessionId}
                highlightCount={highlightCount}
                onConfirm={() => setStep('uploading')}
                onRetake={() => setStep('ready')}
              />
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
          title="Hướng dẫn"
        >
          <div className="space-y-4">
            <p className="text-slate-300">
              Quay toàn bộ trận đấu. Khi có pha bóng hay, nhấn nút <b>Highlight</b>.
              Hệ thống sẽ tự động cắt video sau khi bạn kết thúc.
            </p>
            <Button onClick={() => setShowSettings(false)} className="w-full">
              Đã hiểu
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

const PreviewStep: React.FC<{
  sessionId: string;
  highlightCount: number;
  onConfirm: () => void;
  onRetake: () => void;
}> = ({ sessionId, highlightCount, onConfirm, onRetake }) => {
  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col bg-slate-900"
    >
      {/* Preview Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-lime-400/20 rounded-full flex items-center justify-center">
            <Sparkles size={64} className="text-lime-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Quay xong!
          </h2>
          <p className="text-slate-400 mb-2">
            Đã ghi {highlightCount} highlights
          </p>
          <p className="text-sm text-slate-500">
            Session ID: {sessionId.slice(0, 8)}...
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 pb-safe-bottom space-y-3">
        <Button
          onClick={onConfirm}
          size="xl"
          className="w-full"
          icon={<UploadCloud size={24} />}
        >
          Lưu và Upload
        </Button>
        <Button
          onClick={onRetake}
          variant="outline"
          size="xl"
          className="w-full"
          icon={<RefreshCw size={20} />}
        >
          Quay lại
        </Button>
      </div>
    </motion.div>
  );
};

const UploadStep: React.FC<{
  sessionId: string;
  onComplete: () => void;
  onProgress: (p: number) => void;
}> = ({ sessionId, onComplete, onProgress }) => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const upload = async () => {
      try {
        await UploadService.uploadSession(sessionId, (p) => {
          setProgress(p);
          onProgress(p);
        });
        // Clear local data after success
        await UploadService.clearLocalSession(sessionId);
        onComplete();
      } catch (err: any) {
        setError(err.message || 'Upload failed');
      }
    };
    upload();
  }, [sessionId, onComplete, onProgress]);

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
