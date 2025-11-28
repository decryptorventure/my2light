import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Square, Sparkles, Play, Check, Download,
  RefreshCw, X, Clock, Settings, Pause, Mic, Info
} from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/Toast';
import { celebrate, fireworks } from '../lib/confetti';
import { useCamera } from '../hooks/useCamera';
import { useMediaRecorder } from '../hooks/useMediaRecorder';
import { VideoSegment } from '../types';
import { Modal } from '../components/ui/Modal';
import { VideoSegmentService } from '../services/videoSegments';

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
  const [showSettings, setShowSettings] = useState(false);
  const [keywordDetection, setKeywordDetection] = useState(false);

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
    stopRecording,
    pauseRecording,
    resumeRecording
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

  const handleStart = async () => {
    setStep('recording');
    await startRecording();
  };

  const handleStop = () => {
    stopRecording();
  };

  const handleTogglePause = () => {
    if (recordingStatus === 'recording') {
      pauseRecording();
    } else if (recordingStatus === 'paused') {
      resumeRecording();
    }
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
      // 1. Upload segments to Supabase Storage
      const uploadPromises = selected.map(async (segment) => {
        // In a real app, we would extract the specific time range from fullRecordingBlob
        // For now, we'll simulate it by using the full blob (or a slice if possible)
        // NOTE: Slicing a webm blob by byte range doesn't give a valid video file for that time range
        // Proper implementation requires FFmpeg.wasm or server-side processing
        // We will upload the full blob as a placeholder for each segment, 
        // but in reality the server merge function would need to handle the cutting.

        if (!fullRecordingBlob) throw new Error('No recording blob found');

        // Upload
        const publicUrl = await VideoSegmentService.uploadSegment(
          fullRecordingBlob,
          segment.id,
          'temp-user-id' // TODO: Get real user ID from auth store
        );

        if (!publicUrl) throw new Error(`Failed to upload segment ${segment.id}`);

        // Update segment with URL
        return { ...segment, video_url: publicUrl, status: 'uploaded' as const };
      });

      const uploadedSegments = await Promise.all(uploadPromises);

      // 2. Save metadata to database
      const savePromises = uploadedSegments.map(segment =>
        VideoSegmentService.saveSegmentMetadata(segment)
      );

      await Promise.all(savePromises);

      // 3. Trigger merge job
      const segmentIds = uploadedSegments.map(s => s.id);
      const mergeResult = await VideoSegmentService.mergeVideos(segmentIds);

      if (!mergeResult.success) {
        throw new Error(mergeResult.error || 'Merge failed');
      }

      // 4. Poll for completion (simplified for now)
      // In a real app, we might use a subscription or just show "Processing" and let user leave
      // For this demo, we'll wait a bit then show success

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));

      fireworks();
      setStep('done');
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Lỗi khi xử lý video', 'error');
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
            <button
              onClick={switchCamera}
              className="p-2 text-white hover:bg-white/10 rounded-full transition"
            >
              <RefreshCw size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pt-0 pb-safe h-screen flex flex-col">
          <AnimatePresence mode="wait">
            {(step === 'ready' || step === 'recording') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 relative bg-black"
              >
                {/* Camera Preview */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Recording Overlay */}
                {step === 'recording' && (
                  <div className="absolute top-24 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${recordingStatus === 'paused' ? 'bg-yellow-400' : 'bg-red-500 animate-pulse'}`} />
                      <span className="text-xl font-mono font-black text-white">
                        {formatTime(recordedTime)}
                      </span>
                    </div>

                    {recordingStatus === 'paused' && (
                      <div className="bg-yellow-400/90 text-black px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Tạm dừng
                      </div>
                    )}

                    {segments.length > 0 && (
                      <motion.div
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

                {/* Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent pb-safe-bottom pt-20">
                  {step === 'recording' ? (
                    <div className="space-y-6">
                      {/* Rollback Time Selector */}
                      <div className="flex items-center justify-center gap-2">
                        <Clock size={16} className="text-slate-400" />
                        {[15, 30, 60].map(time => (
                          <button
                            key={time}
                            onClick={() => setRollbackTime(time)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition ${rollbackTime === time
                              ? 'bg-lime-400 text-slate-900'
                              : 'bg-slate-800/80 text-slate-300 backdrop-blur-sm'
                              }`}
                          >
                            {time}s
                          </button>
                        ))}
                      </div>

                      {/* Main Controls Grid */}
                      <div className="grid grid-cols-3 gap-4 items-end">
                        {/* Pause/Resume */}
                        <button
                          onClick={handleTogglePause}
                          className="flex flex-col items-center gap-2 group"
                        >
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition ${recordingStatus === 'paused'
                              ? 'bg-lime-400 text-slate-900'
                              : 'bg-slate-800/80 text-white backdrop-blur-sm'
                            }`}>
                            {recordingStatus === 'paused' ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
                          </div>
                          <span className="text-xs text-slate-300 font-medium">
                            {recordingStatus === 'paused' ? 'Tiếp tục' : 'Tạm dừng'}
                          </span>
                        </button>

                        {/* Mark Highlight (Center, Large) */}
                        <button
                          onClick={handleMarkHighlight}
                          className="flex flex-col items-center gap-2 -mt-4"
                        >
                          <div className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center shadow-lg shadow-lime-400/30 active:scale-95 transition">
                            <Sparkles size={32} className="text-slate-900" />
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
                    </div>
                  ) : (
                    /* Start Button */
                    <div className="pb-8">
                      <Button
                        onClick={handleStart}
                        size="xl"
                        className="w-full py-6 text-lg shadow-xl shadow-lime-400/20"
                        disabled={!permissionGranted}
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

        {/* Settings Modal */}
        <Modal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          title="Cài đặt & Hướng dẫn"
        >
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Info size={18} className="text-lime-400" />
                Hướng dẫn nhanh
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex gap-2">
                  <span className="text-lime-400">•</span>
                  Quay toàn bộ trận đấu của bạn
                </li>
                <li className="flex gap-2">
                  <span className="text-lime-400">•</span>
                  Khi có pha bóng hay, nhấn nút <b>Highlight</b>
                </li>
                <li className="flex gap-2">
                  <span className="text-lime-400">•</span>
                  Hệ thống sẽ tự động lưu lại <b>15s - 60s</b> trước đó
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Settings size={18} className="text-lime-400" />
                Cấu hình
              </h3>

              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-700 rounded-full">
                    <Mic size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-white">Bắt highlight bằng giọng nói</div>
                    <div className="text-xs text-slate-400">Hô "Highlight" để tự động lưu</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={keywordDetection}
                    onChange={(e) => setKeywordDetection(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-400"></div>
                </label>
              </div>
            </div>

            <Button onClick={() => setShowSettings(false)} className="w-full">
              Đã hiểu
            </Button>
          </div>
        </Modal>
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
      className="px-6 space-y-6 pb-32 pt-20"
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
