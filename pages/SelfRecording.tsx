import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Square, Sparkles, Play, Check, Download,
  RefreshCw, X, Clock, Trash2
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
import { VideoSegment } from '../types';
import { supabase } from '../lib/supabase';

type RecordingStep = 'ready' | 'recording' | 'review' | 'processing' | 'done';

export const SelfRecording: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  // State
  const [step, setStep] = useState<RecordingStep>('ready');
  const [rollbackTime, setRollbackTime] = useState(15); // seconds
  const [segments, setSegments] = useState<VideoSegment[]>([]);
  const [recordingSessionId] = useState(() => crypto.randomUUID());
  const [fullRecordingBlob, setFullRecordingBlob] = useState<Blob | null>(null);

  // Camera
  const { stream, permissionGranted, switchCamera } = useCamera({
    videoRef,
    autoStart: step === 'ready' || step === 'recording'
  });

  // Recording
  const {
    status: recordingStatus,
    duration: recordedTime,
    startRecording,
    stopRecording
  } = useMediaRecorder({
    stream,
    onStop: (blob) => {
      setFullRecordingBlob(blob);
      setStep('review');
    }
  });

  // Mark highlight - save last X seconds
  const handleMarkHighlight = async () => {
    if (recordedTime < rollbackTime) {
      showToast('Chưa đủ thời gian để đánh dấu', 'error');
      return;
    }

    const newSegment: VideoSegment = {
      id: crypto.randomUUID(),
      recording_session_id: recordingSessionId,
      user_id: '', // Will be set when uploading
      start_time: Math.max(0, recordedTime - rollbackTime),
      end_time: recordedTime,
      duration: rollbackTime,
      status: 'pending',
      created_at: new Date().toISOString(),
      isSelected: false
    };

    setSegments(prev => [...prev, newSegment]);
    showToast(`Đã đánh dấu ${rollbackTime}s! 🏆`, 'success');
    celebrate({ particleCount: 50, spread: 60 });
  };

  stopRecording();
};

const toggleSegmentSelection = (id: string) => {
  setSegments(prev => prev.map(seg =>
    seg.id === id ? { ...seg, isSelected: !seg.isSelected } : seg
  ));
};

const handleSaveSelected = async () => {
  const selected = segments.filter(s => s.isSelected);
  if (selected.length === 0) {
    showToast('vui lòng chọn ít nhất 1 segment', 'error');
    return;
  }

  setStep('processing');

  try {
    // TODO: Call Edge Function to merge segments
    // For now, just simulate success
    await new Promise(resolve => setTimeout(resolve, 2000));

    fireworks();
    setStep('done');
  } catch (error) {
    console.error(error);
    showToast('Lỗi khi xử lý video', 'error');
    setStep('review');
  }
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

return (
  <PageTransition>
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 pt-safe">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="font-bold text-white">Tự Quay</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 pb-safe">
        <AnimatePresence mode="wait">
          {(step === 'ready' || step === 'recording') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black flex flex-col pt-16"
            >
              {/* Camera Preview */}
              <div className="flex-1 relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Recording Overlay */}
                {step === 'recording' && (
                  <div className="absolute top-4 left-0 right-0 flex flex-col items-center gap-2">
                    <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xl font-mono font-black text-white">
                        {formatTime(recordedTime)}
                      </span>
                    </div>

                    {segments.length > 0 && (
                      < motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-lime-400/90 rounded-full px-3 py-1 flex items-center gap-2"
                      >
                        <Sparkles size={14} className="text-slate-900" />
                        <span className="text-sm font-bold text-slate-900">
                          {segments.length} Highlights
                        </span>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Camera Switch */}
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={switchCamera}
                    className="p-3 bg-black/50 backdrop-blur rounded-full text-white"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>
              </div>

              {/* Controls */}
              <div className="p-6 bg-gradient-to-t from-black via-black/90 to-transparent pb-safe space-y-4">
                {step === 'recording' && (
                  <>
                    {/* Rollback Time Selector */}
                    <div className="flex items-center justify-center gap-2">
                      <Clock size={16} className="text-slate-400" />
                      {[15, 30, 60].map(time => (
                        <button
                          key={time}
                          onClick={() => setRollbackTime(time)}
                          className={`px-4 py-2 rounded-full text-sm font-bold transition ${rollbackTime === time
                            ? 'bg-lime-400 text-slate-900'
                            : 'bg-slate-800 text-slate-400'
                            }`}
                        >
                          {time}s
                        </button>
                      ))}
                    </div>

                    {/* Mark Highlight Button */}
                    <Button
                      onClick={handleMarkHighlight}
                      className="w-full bg-lime-400 hover:bg-lime-500 text-slate-900 font-bold py-6 shadow-xl"
                      icon={<Sparkles size={24} />}
                    >
                      Đánh dấu Highlight ({rollbackTime}s)
                    </Button>

                    {/* Stop Button */}
                    <Button
                      variant="danger"
                      onClick={handleStop}
                      className="w-full py-6"
                      icon={<Square size={24} />}
                    >
                      Dừng quay
                    </Button>
                  </>
                )}

                {step === 'ready' && (
                  <Button
                    onClick={handleStart}
                    size="xl"
                    className="w-full"
                    disabled={!permissionGranted}
                    icon={<Play size={24} />}
                  >
                    Bắt đầu quay
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {step === 'review' && (
            <ReviewStep
              segments={segments}
              onToggleSelection={toggleSegmentSelection}
              onSave={handleSaveSelected}
              onCancel={() => navigate(-1)}
            />
          )}

          {step === 'processing' && <ProcessingStep />}

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

// Review Step - Multi-select segments
const ReviewStep: React.FC<{
  segments: VideoSegment[];
  onToggleSelection: (id: string) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ segments, onToggleSelection, onSave, onCancel }) => {
  const selectedCount = segments.filter(s => s.isSelected).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 space-y-6 pb-32"
    >
      <Card className="p-6">
        <h2 className="text-xl font-bold text-white mb-2">
          Chọn highlights để lưu
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Đã đánh dấu {segments.length} khoảnh khắc. Chọn những clip bạn muốn giữ lại.
        </p>

        {segments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Chưa có highlight nào được đánh dấu
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {segments.map((seg, idx) => (
              <button
                key={seg.id}
                onClick={() => onToggleSelection(seg.id)}
                className={`relative aspect-video rounded-xl overflow-hidden border-2 transition ${seg.isSelected
                  ? 'border-lime-400 shadow-lg shadow-lime-400/20'
                  : 'border-slate-700'
                  }`}
              >
                {/* Placeholder thumbnail */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 flex flex-col items-center justify-center">
                  <Sparkles size={24} className="text-slate-600 mb-2" />
                  <span className="text-xs text-slate-500">Highlight #{idx + 1}</span>
                  <span className="text-xs text-slate-600 font-mono">
                    {seg.duration}s
                  </span>
                </div>

                {/* Selection Indicator */}
                {seg.isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center">
                    <Check size={16} className="text-slate-900" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pb-safe space-y-3">
        {selectedCount > 0 && (
          <div className="text-center text-sm text-slate-400 mb-2">
            Đã chọn {selectedCount} / {segments.length} highlights
          </div>
        )}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            icon={<X size={20} />}
          >
            Hủy
          </Button>
          <Button
            onClick={onSave}
            className="flex-1"
            disabled={selectedCount === 0}
            icon={<Download size={20} />}
          >
            Lưu ({selectedCount})
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Processing Step
const ProcessingStep: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center px-6"
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      className="w-24 h-24 mb-6 border-4 border-lime-400 border-t-transparent rounded-full"
    />
    <h2 className="text-2xl font-black text-white mb-2">Đang xử lý video...</h2>
    <p className="text-slate-400 text-center">
      Server đang ghép các highlights lại với nhau
    </p>
  </motion.div>
);

// Done Step
const DoneStep: React.FC<{
  onGoHome: () => void;
  onViewGallery: () => void;
}> = ({ onGoHome, onViewGallery }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center px-6"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.2 }}
      className="w-32 h-32 bg-gradient-to-br from-lime-400 to-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl"
    >
      <Check size={64} className="text-slate-900" strokeWidth={3} />
    </motion.div>

    <h2 className="text-3xl font-black text-white mb-3">Hoàn thành! 🎉</h2>
    <p className="text-slate-400 mb-8 text-center max-w-sm">
      Video đã được xử lý và sẵn sàng để xem
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
