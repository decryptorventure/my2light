import React, { useState, useRef } from 'react';
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
  const [showSettings, setShowSettings] = useState(false);
  const [keywordDetection, setKeywordDetection] = useState(false);
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null);
  const [previewSegment, setPreviewSegment] = useState<VideoSegment | null>(null);

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
      // Get current user ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      }

      // 1. Upload segments to Supabase Storage
      const uploadPromises = selected.map(async (segment) => {
        if (!fullRecordingBlob) throw new Error('No recording blob found');

        // Upload with real user ID
        const publicUrl = await VideoSegmentService.uploadSegment(
          fullRecordingBlob,
          segment.id,
          user.id
        );

        if (!publicUrl) {
          throw new Error(`Không thể upload segment ${segment.id}. Vui lòng kiểm tra bucket 'raw_segments' đã được tạo chưa.`);
        }

        // Update segment with URL and user ID
        return {
          ...segment,
          user_id: user.id,
          video_url: publicUrl,
          status: 'uploaded' as const
        };
      });

      const uploadedSegments = await Promise.all(uploadPromises);
      showToast(`Đã upload ${uploadedSegments.length} segments`, 'success');

      // 2. Save metadata to database
      const savePromises = uploadedSegments.map(segment =>
        VideoSegmentService.saveSegmentMetadata(segment)
      );

      const savedSegments = await Promise.all(savePromises);
      const successfulSaves = savedSegments.filter(s => s !== null);

      if (successfulSaves.length === 0) {
        throw new Error('Không thể lưu metadata. Vui lòng kiểm tra bảng video_segments đã tồn tại chưa.');
      }

      // 3. Trigger merge job (with fallback)
      const segmentIds = uploadedSegments.map(s => s.id);
      const mergeResult = await VideoSegmentService.mergeVideos(segmentIds);

      if (!mergeResult.success) {
        console.warn('Edge Function merge failed, but segments are saved:', mergeResult.error);
        showToast('Video segments đã được lưu! (Merge function chưa sẵn sàng)', 'info');
        // Continue to show success even if merge fails
      } else {
        showToast('Video đang được xử lý...', 'success');
        // Store merged video URL if available
        if (mergeResult.videoUrl) {
          setMergedVideoUrl(mergeResult.videoUrl);
        }
      }

      // 4. Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      fireworks();
      setStep('done');
    } catch (error: any) {
      console.error('Error in handleSaveSelected:', error);
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
                fullRecordingBlob={fullRecordingBlob}
                previewSegment={previewSegment}
                onPreview={setPreviewSegment}
              />
            )}

            {step === 'processing' && <ProcessingStep />}

            {step === 'done' && (
              <DoneStep
                onGoHome={() => navigate('/home')}
                onViewGallery={() => navigate('/gallery')}
                videoUrl={mergedVideoUrl}
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
  fullRecordingBlob: Blob | null;
  previewSegment: VideoSegment | null;
  onPreview: (segment: VideoSegment | null) => void;
}> = ({ segments, onToggleSelection, onSave, onCancel, fullRecordingBlob, previewSegment, onPreview }) => {
  const selectedCount = segments.filter(s => s.isSelected).length;
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handleSelectAll = () => {
    segments.forEach(seg => {
      if (!seg.isSelected) {
        onToggleSelection(seg.id);
      }
    });
  };

  const handleDeselectAll = () => {
    segments.forEach(seg => {
      if (seg.isSelected) {
        onToggleSelection(seg.id);
      }
    });
  };

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

        {/* Select All / Deselect All Buttons */}
        {segments.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleSelectAll}
              className="flex-1 px-4 py-2 bg-lime-400/10 border border-lime-400/30 text-lime-400 rounded-lg text-sm font-bold hover:bg-lime-400/20 transition"
            >
              Chọn tất cả
            </button>
            <button
              onClick={handleDeselectAll}
              className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-700 transition"
            >
              Bỏ chọn tất cả
            </button>
          </div>
        )}

        {segments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            Chưa có highlight nào được đánh dấu
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {segments.map((seg, idx) => (
              <div key={seg.id} className="relative">
                <button
                  onClick={() => onToggleSelection(seg.id)}
                  className={`relative aspect-video rounded-xl overflow-hidden border-2 transition w-full ${seg.isSelected
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
                    <div className="absolute top-2 right-2 w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center z-10">
                      <Check size={16} className="text-slate-900" strokeWidth={3} />
                    </div>
                  )}
                </button>

                {/* Preview Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(seg);
                  }}
                  className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold hover:bg-black/80 transition flex items-center gap-1 z-10"
                >
                  <Play size={12} fill="currentColor" />
                  Xem
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewSegment && fullRecordingBlob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => onPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-800 rounded-2xl overflow-hidden max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Preview Highlight</h3>
                  <p className="text-sm text-slate-400">
                    {previewSegment.start_time}s - {previewSegment.end_time}s ({previewSegment.duration}s)
                  </p>
                </div>
                <button
                  onClick={() => onPreview(null)}
                  className="p-2 hover:bg-slate-700 rounded-full transition"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              {/* Video Player */}
              <div className="bg-black aspect-video">
                <video
                  ref={videoRef}
                  src={URL.createObjectURL(fullRecordingBlob)}
                  className="w-full h-full"
                  controls
                  autoPlay
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = previewSegment.start_time;
                    }
                  }}
                />
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-900/50 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => onPreview(null)}
                  className="flex-1"
                >
                  Đóng
                </Button>
                <Button
                  onClick={() => {
                    onToggleSelection(previewSegment.id);
                    onPreview(null);
                  }}
                  className="flex-1"
                  icon={<Check size={16} />}
                >
                  {segments.find(s => s.id === previewSegment.id)?.isSelected ? 'Bỏ chọn' : 'Chọn'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
  videoUrl: string | null;
}> = ({ onGoHome, onViewGallery, videoUrl }) => {
  const { showToast } = useToast();

  const handleDownload = async () => {
    if (!videoUrl) {
      showToast('Video chưa sẵn sàng để tải xuống', 'error');
      return;
    }

    try {
      // Fetch the video
      const response = await fetch(videoUrl);
      const blob = await response.blob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `highlight-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Video đã được tải xuống! 📥', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Lỗi khi tải video', 'error');
    }
  };

  return (
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
        {videoUrl && (
          <Button
            onClick={handleDownload}
            variant="outline"
            icon={<Download size={20} />}
            size="xl"
            className="w-full"
          >
            Tải xuống
          </Button>
        )}
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
};
