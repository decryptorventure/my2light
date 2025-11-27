import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Camera, Mic, MicOff, Play, Pause, Square,
  Check, X, Volume2, VolumeX, Zap, RotateCcw,
  Scissors, Type, Download, Share2, Sparkles, RefreshCw
} from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { useToast } from '../components/ui/Toast';
import { celebrate, fireworks } from '../lib/confetti';
import { useCamera } from '../hooks/useCamera';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { useVoiceCommands } from '../hooks/useVoiceCommands';
import { ApiService } from '../services/api';

type RecordingStep = 'setup' | 'recording' | 'processing' | 'editing' | 'done';

export const SelfRecording: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState<RecordingStep>('setup');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [courtSelected, setCourtSelected] = useState('Sân Landmark 81');
  const [cameraPosition, setCameraPosition] = useState<'optimal' | 'good' | 'adjusted'>('optimal');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [highlightTimestamps, setHighlightTimestamps] = useState<number[]>([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Custom Hooks
  const {
    stream,
    error: cameraError,
    isLoading: isCameraLoading,
    permissionGranted,
    startCamera,
    switchCamera,
    facingMode
  } = useCamera({
    videoRef,
    autoStart: step === 'recording' || step === 'setup'
  });

  const {
    status: recordingStatus,
    duration: recordedTime,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording
  } = useMediaRecorder({
    stream,
    onStop: (blob) => {
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setStep('editing');
    }
  });

  const { lastCommand } = useVoiceCommands({
    isListening: voiceEnabled && (step === 'setup' || step === 'recording'),
    onCommand: (cmd) => {
      if (step === 'setup' && cmd === 'start') {
        handleStartRecording();
        showToast('Đã nhận lệnh: Bắt đầu quay', 'success');
      } else if (step === 'recording') {
        if (cmd === 'stop') {
          handleStopRecording();
          showToast('Đã nhận lệnh: Dừng quay', 'success');
        } else if (cmd === 'highlight') {
          handleMarkHighlight();
        }
      }
    }
  });

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleStartRecording = () => {
    if (!permissionGranted) {
      showToast('Vui lòng cấp quyền camera để quay', 'error');
      return;
    }
    setHighlightTimestamps([]); // Reset highlights
    setStep('recording');
    startRecording();
    celebrate({ particleCount: 30 });
  };

  const handleStopRecording = () => {
    setStep('processing');
    stopRecording();
  };

  const handleSaveVideo = async () => {
    if (!recordedBlob) return;

    setIsUploading(true);
    try {
      // 1. Upload video
      const uploadRes = await ApiService.uploadVideo(recordedBlob);
      if (!uploadRes.success) throw new Error(uploadRes.error);

      // 2. Create highlight record
      // TODO: Get actual court ID from selection or location
      // For now, we'll fetch the first court to use as default if not selected
      const courtsRes = await ApiService.getCourts();
      const defaultCourtId = courtsRes.data?.[0]?.id || 'court_id_placeholder';

      const createRes = await ApiService.createHighlight(
        defaultCourtId,
        uploadRes.data,
        recordedTime,
        videoTitle || `Highlight ${new Date().toLocaleDateString()}`,
        videoDescription
      );

      if (!createRes.success) throw new Error(createRes.error);

      fireworks();
      setStep('done');
    } catch (err: any) {
      console.error(err);
      showToast('Lỗi khi lưu video: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (!recordedBlob) return;

    // Try Web Share API first for better mobile UX
    if (navigator.share && recordedBlob) {
      try {
        const file = new File([recordedBlob], `highlight-${Date.now()}.webm`, { type: recordedBlob.type });
        await navigator.share({
          files: [file],
          title: 'My Highlight',
          text: 'Check out my highlight from My2Light!',
        });
        showToast('Đã chia sẻ video!', 'success');
        return;
      } catch (err) {
        console.log('Share failed, falling back to download', err);
      }
    }

    // Fallback to classic download
    if (previewUrl) {
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = `highlight-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Đang tải video xuống...', 'success');
    }
  };

  const handleMarkHighlight = () => {
    const timestamp = recordedTime;
    setHighlightTimestamps(prev => [...prev, timestamp]);
    showToast('Đã đánh dấu Highlight! 🏆', 'success');
    celebrate({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  };

  // ... (existing handleStopRecording, handleSaveVideo, handleDownload)

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-900">
        {/* ... (existing header) */}

        {/* Content */}
        <div className="pt-20 pb-safe">
          <AnimatePresence mode="wait">
            {step === 'setup' && (
              <SetupStep
                // ... (existing props)
                courtSelected={courtSelected}
                onCourtChange={setCourtSelected}
                cameraPosition={cameraPosition}
                onCameraPositionChange={setCameraPosition}
                voiceEnabled={voiceEnabled}
                onVoiceToggle={() => setVoiceEnabled(!voiceEnabled)}
                onStart={handleStartRecording}
                videoRef={videoRef}
                stream={stream}
                cameraError={cameraError}
                permissionGranted={permissionGranted}
                onSwitchCamera={switchCamera}
              />
            )}

            {step === 'recording' && (
              <RecordingStep
                videoRef={videoRef}
                stream={stream}
                isRecording={recordingStatus === 'recording'}
                isPaused={recordingStatus === 'paused'}
                recordedTime={recordedTime}
                voiceEnabled={voiceEnabled}
                onPause={recordingStatus === 'paused' ? resumeRecording : pauseRecording}
                onStop={handleStopRecording}
                onVoiceToggle={() => setVoiceEnabled(!voiceEnabled)}
                lastCommand={lastCommand}
                highlightCount={highlightTimestamps.length}
                onMarkHighlight={handleMarkHighlight}
              />
            )}

            {step === 'processing' && <ProcessingStep />}

            {step === 'editing' && (
              <EditingStep
                title={videoTitle}
                description={videoDescription}
                onTitleChange={setVideoTitle}
                onDescriptionChange={setVideoDescription}
                onSave={handleSaveVideo}
                onDownload={handleDownload}
                recordedTime={recordedTime}
                previewUrl={previewUrl}
                isUploading={isUploading}
                highlightTimestamps={highlightTimestamps}
              />
            )}

            {step === 'done' && (
              <DoneStep
                onGoHome={() => navigate('/home')}
                onViewGallery={() => navigate('/gallery')}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
};

// Setup Step Component
const SetupStep: React.FC<{
  courtSelected: string;
  onCourtChange: (court: string) => void;
  cameraPosition: string;
  onCameraPositionChange: (position: any) => void;
  voiceEnabled: boolean;
  onVoiceToggle: () => void;
  onStart: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  cameraError: string | null;
  permissionGranted: boolean;
  onSwitchCamera: () => void;
}> = ({
  courtSelected, cameraPosition, voiceEnabled, onVoiceToggle, onStart,
  videoRef, stream, cameraError, permissionGranted, onSwitchCamera
}) => {
    // Ensure stream is attached when component mounts/updates
    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream, videoRef]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="px-6 space-y-6"
      >
        {/* Camera Preview Card */}
        <Card className="p-0 overflow-hidden relative bg-black aspect-video rounded-2xl">
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <Camera size={48} className="text-red-500 mb-2" />
              <p className="text-white font-bold">Lỗi Camera</p>
              <p className="text-slate-400 text-sm">{cameraError}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute bottom-4 right-4">
                <button
                  onClick={onSwitchCamera}
                  className="p-2 bg-black/50 backdrop-blur rounded-full text-white hover:bg-black/70"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Camera size={20} className="text-lime-400" />
            Hướng dẫn đặt camera
          </h3>

          <div className="space-y-2 text-sm text-slate-300 mb-4">
            <div className="flex items-start gap-2">
              <Check size={16} className="text-lime-400 flex-shrink-0 mt-0.5" />
              <span>Đặt điện thoại ở góc sân, cao khoảng 1.5m</span>
            </div>
            <div className="flex items-start gap-2">
              <Check size={16} className="text-lime-400 flex-shrink-0 mt-0.5" />
              <span>Đảm bảo toàn bộ sân trong khung hình</span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border-2 ${cameraPosition === 'optimal'
            ? 'border-lime-400 bg-lime-400/10'
            : 'border-yellow-500 bg-yellow-500/10'
            }`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${cameraPosition === 'optimal' ? 'bg-lime-400' : 'bg-yellow-500'
                } animate-pulse`} />
              <span className="font-bold text-white">
                {cameraPosition === 'optimal' ? 'Vị trí tối ưu' : 'Vị trí tốt'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Camera đã được kích hoạt. Hãy điều chỉnh góc máy.
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Mic size={20} className="text-blue-400" />
            Điều khiển bằng giọng nói
          </h3>

          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl mb-4">
            <div>
              <p className="font-medium text-white mb-1">Kích hoạt giọng nói</p>
              <p className="text-xs text-slate-400">Nói "Start" để bắt đầu</p>
            </div>
            <button
              onClick={onVoiceToggle}
              className={`w-14 h-8 rounded-full transition-colors ${voiceEnabled ? 'bg-lime-400' : 'bg-slate-700'
                }`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform ${voiceEnabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
            </button>
          </div>
        </Card>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pb-safe">
          <Button
            onClick={onStart}
            icon={<Zap size={20} />}
            size="xl"
            className="w-full"
            disabled={!permissionGranted}
          >
            Bắt đầu quay
          </Button>
        </div>
      </motion.div>
    );
  };

// Recording Step Component
const RecordingStep: React.FC<{
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  isRecording: boolean;
  isPaused: boolean;
  recordedTime: number;
  voiceEnabled: boolean;
  onPause: () => void;
  onStop: () => void;
  onVoiceToggle: () => void;
  lastCommand: string | null;
  highlightCount: number;
  onMarkHighlight: () => void;
}> = ({
  videoRef, stream, isRecording, isPaused, recordedTime, voiceEnabled,
  onPause, onStop, onVoiceToggle, lastCommand, highlightCount, onMarkHighlight
}) => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Ensure stream is attached when component mounts/updates
    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream, videoRef]);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black flex flex-col pt-16"
      >
        {/* Camera preview */}
        <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />

          {/* Status Overlay */}
          <div className="absolute top-4 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3">
              {!isPaused && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
              <span className="text-xl font-mono font-black text-white tracking-widest">
                {formatTime(recordedTime)}
              </span>
            </div>

            {/* Highlight Counter */}
            <AnimatePresence>
              {highlightCount > 0 && (
                <motion.div
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0 }}
                  key={highlightCount} // Re-animate on change
                  className="bg-lime-400/90 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2 shadow-lg shadow-lime-400/20"
                >
                  <Sparkles size={14} className="text-slate-900" />
                  <span className="text-sm font-bold text-slate-900">
                    {highlightCount} Highlights
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Voice indicator */}
          {voiceEnabled && !isPaused && (
            <div className="absolute top-24 left-4 bg-lime-400/20 backdrop-blur-md border border-lime-400/30 rounded-full px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
              <span className="text-sm text-lime-400 font-bold">
                {lastCommand ? `Lệnh: "${lastCommand}"` : 'Đang nghe...'}
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-8 bg-gradient-to-t from-black via-black/90 to-transparent pb-safe space-y-6">
          {/* Highlight Button */}
          <div className="flex justify-center">
            <Button
              onClick={onMarkHighlight}
              className="bg-lime-400 hover:bg-lime-500 text-slate-900 font-bold px-8 py-6 rounded-2xl shadow-[0_0_20px_rgba(163,230,53,0.3)] active:scale-95 transition-all"
              icon={<Sparkles size={24} />}
            >
              Đánh dấu Highlight
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8">
            <Button
              variant="ghost"
              size="icon"
              className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10"
              onClick={onVoiceToggle}
            >
              {voiceEnabled ? <Mic size={24} /> : <MicOff size={24} />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="w-20 h-20 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border-2 border-white/20"
              onClick={onPause}
            >
              {isPaused ? <Play size={32} className="ml-1" /> : <Pause size={32} />}
            </Button>

            <Button
              variant="danger"
              size="icon"
              className="w-14 h-14 rounded-full shadow-lg shadow-red-500/20"
              onClick={onStop}
            >
              <Square size={24} fill="currentColor" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

// Processing Step Component
const ProcessingStep: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center px-6"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      className="w-24 h-24 mb-6 border-4 border-lime-400 border-t-transparent rounded-full"
    />
    <h2 className="text-2xl font-black text-white mb-2">Đang xử lý video...</h2>
    <p className="text-slate-400 text-center">Đang chuẩn bị bản xem trước cho bạn</p>
  </motion.div>
);

// Editing Step Component
const EditingStep: React.FC<{
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (desc: string) => void;
  onSave: () => void;
  onDownload: () => void;
  recordedTime: number;
  previewUrl: string | null;
  isUploading: boolean;
  highlightTimestamps: number[];
}> = ({
  title, description, onTitleChange, onDescriptionChange, onSave, onDownload,
  recordedTime, previewUrl, isUploading, highlightTimestamps
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    const jumpToHighlight = (timestamp: number) => {
      if (videoRef.current) {
        // Jump to 5 seconds before the highlight
        const targetTime = Math.max(0, timestamp - 5);
        videoRef.current.currentTime = targetTime;
        videoRef.current.play();
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="px-6 space-y-6 pb-32"
      >
        {/* Video preview */}
        <Card className="p-0 overflow-hidden bg-black aspect-video rounded-2xl border border-slate-800 relative group">
          {previewUrl ? (
            <>
              <video
                ref={videoRef}
                src={previewUrl}
                controls
                className="w-full h-full object-contain"
              />
              {/* Timeline Markers Overlay (Optional - simplified version) */}
              {highlightTimestamps.length > 0 && (
                <div className="absolute bottom-12 left-4 right-4 h-1 bg-white/20 rounded-full pointer-events-none hidden group-hover:block">
                  {highlightTimestamps.map((ts, i) => (
                    <div
                      key={i}
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-lime-400 rounded-full shadow-[0_0_5px_rgba(163,230,53,0.8)]"
                      style={{ left: `${(ts / recordedTime) * 100}%` }}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              Không có bản xem trước
            </div>
          )}
        </Card>

        {/* Highlight Markers */}
        {highlightTimestamps.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Highlights đã đánh dấu
            </h3>
            <div className="flex flex-wrap gap-2">
              {highlightTimestamps.map((ts, i) => (
                <button
                  key={i}
                  onClick={() => jumpToHighlight(ts)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors group"
                >
                  <div className="w-6 h-6 rounded-full bg-lime-400/10 flex items-center justify-center group-hover:bg-lime-400/20">
                    <Sparkles size={12} className="text-lime-400" />
                  </div>
                  <span className="text-sm font-medium text-white">
                    Pha bóng #{i + 1}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {Math.floor(ts / 60)}:{String(ts % 60).padStart(2, '0')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Edit form */}
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Type size={20} className="text-lime-400" />
            Thông tin video
          </h3>

          <Input
            label="Tiêu đề"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Ví dụ: Pha bóng đẹp hôm nay"
            variant="filled"
          />

          <Textarea
            label="Mô tả"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Thêm mô tả cho video..."
            rows={3}
            variant="filled"
          />
        </Card>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pb-safe flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            icon={<Download size={20} />}
            onClick={onDownload}
            disabled={isUploading}
          >
            Tải về
          </Button>
          <Button
            onClick={onSave}
            className="flex-1"
            icon={isUploading ? <RefreshCw className="animate-spin" size={20} /> : <Check size={20} />}
            disabled={isUploading}
          >
            {isUploading ? 'Đang lưu...' : 'Lưu video'}
          </Button>
        </div>
      </motion.div>
    );
  };

// Done Step Component
const DoneStep: React.FC<{
  onGoHome: () => void;
  onViewGallery: () => void;
}> = ({ onGoHome, onViewGallery }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center px-6 text-center"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.2 }}
      className="w-32 h-32 bg-gradient-to-br from-lime-400 to-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(163,230,53,0.5)]"
    >
      <Check size={64} className="text-slate-900" strokeWidth={3} />
    </motion.div>

    <h2 className="text-3xl font-black text-white mb-3">Hoàn thành! 🎉</h2>
    <p className="text-slate-400 mb-8 max-w-sm">
      Video đã được lưu thành công và sẵn sàng để chia sẻ
    </p>

    <div className="space-y-3 w-full max-w-sm">
      <Button
        onClick={onViewGallery}
        icon={<Sparkles size={20} />}
        size="xl"
        className="w-full"
      >
        Xem trong Gallery
      </Button>
      <Button
        onClick={onGoHome}
        variant="outline"
        size="xl"
        className="w-full"
      >
        Về trang chủ
      </Button>
    </div>
  </motion.div>
);
