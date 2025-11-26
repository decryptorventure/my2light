import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Camera, Mic, MicOff, Play, Pause, Square,
  Check, X, Volume2, VolumeX, Zap, RotateCcw,
  Scissors, Type, Download, Share2, Sparkles
} from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { celebrate, fireworks } from '../lib/confetti';

type RecordingStep = 'setup' | 'recording' | 'processing' | 'editing' | 'done';

export const SelfRecording: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<RecordingStep>('setup');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [courtSelected, setCourtSelected] = useState('Sân Landmark 81');
  const [cameraPosition, setCameraPosition] = useState<'optimal' | 'good' | 'adjusted'>('optimal');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = () => {
    setIsRecording(true);
    setStep('recording');
    celebrate({ particleCount: 30 });
  };

  const pauseRecording = () => {
    setIsPaused(!isPaused);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setStep('processing');
    // Simulate processing
    setTimeout(() => {
      setStep('editing');
    }, 2000);
  };

  const saveVideo = () => {
    fireworks();
    setTimeout(() => {
      setStep('done');
    }, 500);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-900">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 pt-safe">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-lg font-black">Tự Quay</h1>
            <div className="w-10" />
          </div>
        </div>

        {/* Content */}
        <div className="pt-20 pb-safe">
          <AnimatePresence mode="wait">
            {step === 'setup' && (
              <SetupStep
                courtSelected={courtSelected}
                onCourtChange={setCourtSelected}
                cameraPosition={cameraPosition}
                onCameraPositionChange={setCameraPosition}
                voiceEnabled={voiceEnabled}
                onVoiceToggle={() => setVoiceEnabled(!voiceEnabled)}
                onStart={startRecording}
              />
            )}

            {step === 'recording' && (
              <RecordingStep
                isRecording={isRecording}
                isPaused={isPaused}
                recordedTime={recordedTime}
                voiceEnabled={voiceEnabled}
                onPause={pauseRecording}
                onStop={stopRecording}
                onVoiceToggle={() => setVoiceEnabled(!voiceEnabled)}
              />
            )}

            {step === 'processing' && <ProcessingStep />}

            {step === 'editing' && (
              <EditingStep
                title={videoTitle}
                description={videoDescription}
                onTitleChange={setVideoTitle}
                onDescriptionChange={setVideoDescription}
                onSave={saveVideo}
                recordedTime={recordedTime}
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
}> = ({ courtSelected, cameraPosition, voiceEnabled, onVoiceToggle, onStart }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="px-6 space-y-6"
  >
    <Card className="p-6">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <Camera size={20} className="text-lime-400" />
        Hướng dẫn đặt camera
      </h3>

      {/* Camera position guide */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
        <div className="relative h-48 bg-slate-700/50 rounded-lg mb-3 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-lime-400/20 rounded-full flex items-center justify-center">
              <Camera size={32} className="text-lime-400" />
            </div>
            <p className="text-sm text-slate-400">Đặt điện thoại ở góc sân</p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <Check size={16} className="text-lime-400 flex-shrink-0 mt-0.5" />
            <span>Đặt điện thoại ở góc sân, cao khoảng 1.5m</span>
          </div>
          <div className="flex items-start gap-2">
            <Check size={16} className="text-lime-400 flex-shrink-0 mt-0.5" />
            <span>Đảm bảo toàn bộ sân trong khung hình</span>
          </div>
          <div className="flex items-start gap-2">
            <Check size={16} className="text-lime-400 flex-shrink-0 mt-0.5" />
            <span>Tránh ánh sáng chiếu trực tiếp vào camera</span>
          </div>
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
          {cameraPosition === 'optimal'
            ? 'Camera đã được đặt ở vị trí hoàn hảo'
            : 'Điều chỉnh góc camera để có kết quả tốt hơn'}
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
          <p className="text-xs text-slate-400">Nói "Ghi" để tạo highlight</p>
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

      {voiceEnabled && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <div className="w-8 h-8 bg-lime-400/20 rounded-lg flex items-center justify-center">
              <span className="text-lime-400 font-bold">1</span>
            </div>
            <span>"Ghi" - Tạo highlight</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <div className="w-8 h-8 bg-lime-400/20 rounded-lg flex items-center justify-center">
              <span className="text-lime-400 font-bold">2</span>
            </div>
            <span>"Dừng" - Kết thúc quay</span>
          </div>
        </div>
      )}
    </Card>

    <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pb-safe">
      <Button
        onClick={onStart}
        icon={<Zap size={20} />}
        size="xl"
        className="w-full"
      >
        Bắt đầu quay
      </Button>
    </div>
  </motion.div>
);

// Recording Step Component
const RecordingStep: React.FC<{
  isRecording: boolean;
  isPaused: boolean;
  recordedTime: number;
  voiceEnabled: boolean;
  onPause: () => void;
  onStop: () => void;
  onVoiceToggle: () => void;
}> = ({ isPaused, recordedTime, voiceEnabled, onPause, onStop, onVoiceToggle }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black flex flex-col pt-16"
    >
      {/* Camera preview */}
      <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-32 h-32 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center relative">
            {!isPaused && (
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
            )}
            <Camera size={64} className="text-red-500" />
          </div>
          <p className="text-sm text-slate-400">Camera đang {isPaused ? 'tạm dừng' : 'quay'}</p>
        </div>

        {/* Voice indicator */}
        {voiceEnabled && !isPaused && (
          <div className="absolute top-4 left-4 bg-lime-400/20 backdrop-blur-md border border-lime-400/30 rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse" />
            <span className="text-sm text-lime-400 font-bold">Đang nghe...</span>
          </div>
        )}

        {/* Timer */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md rounded-full px-4 py-2">
          <div className="flex items-center gap-2">
            {!isPaused && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            <span className="text-lg font-mono font-black text-white">
              {formatTime(recordedTime)}
            </span>
          </div>
        </div>

        {/* Waveform visualization */}
        {voiceEnabled && !isPaused && (
          <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-1 px-6">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-lime-400 rounded-full"
                animate={{
                  height: [8, Math.random() * 40 + 10, 8]
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-8 bg-gradient-to-t from-black via-black/95 to-transparent pb-safe">
        <div className="flex items-center justify-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="w-16 h-16"
            onClick={onVoiceToggle}
          >
            {voiceEnabled ? <Mic size={28} /> : <MicOff size={28} />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="w-20 h-20border-4 border-white/20"
            onClick={onPause}
          >
            {isPaused ? <Play size={32} /> : <Pause size={32} />}
          </Button>

          <Button
            variant="danger"
            size="icon"
            className="w-16 h-16"
            onClick={onStop}
          >
            <Square size={28} />
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
    <h2 className="text-2xl font-black text-white mb-2">Đang xử lý...</h2>
    <p className="text-slate-400 text-center">AI đang phân tích và tạo highlight tự động</p>
  </motion.div>
);

// Editing Step Component
const EditingStep: React.FC<{
  title: string;
  description: string;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (desc: string) => void;
  onSave: () => void;
  recordedTime: number;
}> = ({ title, description, onTitleChange, onDescriptionChange, onSave, recordedTime }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="px-6 space-y-6 pb-32"
  >
    {/* Video preview */}
    <Card className="p-0 overflow-hidden">
      <div className="aspect-video bg-slate-800 flex items-center justify-center relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
            <Play size={32} className="text-white ml-1" />
          </div>
        </div>
        <span className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white font-mono">
          {Math.floor(recordedTime / 60)}:{(recordedTime % 60).toString().padStart(2, '0')}
        </span>
      </div>
    </Card>

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
      <Button variant="outline" className="flex-1" icon={<Download size={20} />}>
        Tải về
      </Button>
      <Button
        onClick={onSave}
        className="flex-1"
        icon={<Check size={20} />}
      >
        Lưu video
      </Button>
    </div>
  </motion.div>
);

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
