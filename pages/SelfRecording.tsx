
import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mic, Video, Zap, RefreshCw, Activity, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';

// Web Speech API types fallback
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const SelfRecording: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [highlightTriggered, setHighlightTriggered] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  // New Setup UI
  const [sessionType, setSessionType] = useState<'rally' | 'match'>('match');

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode },
          audio: true 
        });
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        alert("Không thể truy cập camera. Vui lòng cấp quyền.");
      }
    };
    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [facingMode]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'vi-VN';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
        // Auto restart if it stops (unless we unmount)
        setIsListening(false);
        try { recognition.start(); } catch(e){}
    };

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.trim().toLowerCase();
      console.log("Heard:", transcript);

      // Keywords detection - Optimized
      if (
        transcript.includes('lưu highlight') || 
        transcript.includes('highlight') || 
        transcript.includes('pha này') ||
        transcript.includes('hay quá')
      ) {
        setLastCommand(transcript);
        triggerHighlight();
      }
    };

    try {
        recognition.start();
    } catch(e) { console.error(e); }

    return () => {
      recognition.stop();
    };
  }, []);

  const triggerHighlight = () => {
    setHighlightTriggered(true);
    // Flash effect logic
    setTimeout(() => setHighlightTriggered(false), 500);
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(200);

    console.log("Saved highlight from mobile mode");
  };

  const switchCamera = () => {
      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
       {/* Camera Feed */}
       <video 
         ref={videoRef}
         autoPlay 
         playsInline 
         muted 
         className="w-full h-full object-cover"
       />

       {/* Overlay UI */}
       <div className="absolute inset-0 flex flex-col justify-between p-6 safe-area">
          {/* Header */}
          <div className="flex justify-between items-start">
              <Button variant="ghost" className="bg-black/40 text-white rounded-full p-2" onClick={() => navigate('/home')}>
                  <X size={24} />
              </Button>
              
              {/* Session Type Toggle (Competitor style) */}
              <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10">
                   <button 
                        onClick={() => setSessionType('rally')}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 transition-colors ${sessionType === 'rally' ? 'bg-lime-400 text-slate-900' : 'text-slate-300'}`}
                    >
                        <Activity size={12} /> Rally
                    </button>
                    <button 
                        onClick={() => setSessionType('match')}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 transition-colors ${sessionType === 'match' ? 'bg-lime-400 text-slate-900' : 'text-slate-300'}`}
                    >
                        <Users size={12} /> Match
                    </button>
              </div>

              <Button variant="ghost" className="bg-black/40 text-white rounded-full p-2" onClick={switchCamera}>
                  <RefreshCw size={20} />
              </Button>
          </div>

          {/* Flash Effect */}
          <AnimatePresence>
            {highlightTriggered && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white z-40 pointer-events-none"
                />
            )}
          </AnimatePresence>
          
          {/* Feedback Icon */}
          <AnimatePresence>
              {highlightTriggered && (
                 <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center"
                 >
                     <Zap size={64} className="text-lime-400 fill-lime-400 drop-shadow-[0_0_20px_rgba(163,230,53,0.8)]" />
                     <span className="text-white font-black text-2xl uppercase mt-2 drop-shadow-lg">Đã lưu!</span>
                 </motion.div>
              )}
          </AnimatePresence>

          {/* Bottom Controls */}
          <div className="text-center">
             {/* Voice Command Hint */}
             <div className="inline-block bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 mb-8 max-w-xs">
                 <div className="flex items-center justify-center gap-2 mb-2 text-slate-300 text-xs uppercase tracking-wide">
                     <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                     {isListening ? 'Đang lắng nghe...' : 'Mic tắt'}
                 </div>
                 
                 <p className="text-white font-bold text-lg mb-2">"Lưu Highlight"</p>
                 
                 <div className="flex gap-2 justify-center text-[10px] text-slate-400">
                     <span>Hoặc: "Pha này", "Hay quá"</span>
                 </div>

                 {lastCommand && (
                     <motion.p 
                        key={lastCommand}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lime-400 text-xs mt-2 italic font-medium"
                     >
                         Nghe thấy: "{lastCommand}"
                     </motion.p>
                 )}
             </div>

             {/* Manual Trigger */}
             <button 
                onClick={triggerHighlight}
                className="w-20 h-20 rounded-full border-4 border-white/30 p-1 mx-auto block active:scale-95 transition-transform"
             >
                 <div className="w-full h-full bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
             </button>
          </div>
       </div>
    </div>
  );
};
