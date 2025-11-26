
import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mic, Video, Zap, RefreshCw } from 'lucide-react';
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

  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode },
          audio: true // Need audio for speech recog context often, or just separate
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

      // Keywords detection
      if (
        transcript.includes('lưu highlight') || 
        transcript.includes('highlight') || 
        transcript.includes('lưu pha này') ||
        transcript.includes('hay quá') ||
        transcript.includes('tuyệt vời')
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
    
    // Mock save
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
              <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="text-xs font-mono text-white">AI VOICE ACTIVE</span>
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
          
          {/* Feedback */}
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

          {/* Bottom Instruction */}
          <div className="text-center">
             <div className="inline-block bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 mb-8">
                 <p className="text-slate-300 text-sm mb-2">Hô to khẩu lệnh để lưu lại:</p>
                 <div className="flex gap-2 justify-center">
                     <span className="bg-white/10 px-2 py-1 rounded text-lime-400 font-bold text-xs uppercase">"Lưu Highlight"</span>
                     <span className="bg-white/10 px-2 py-1 rounded text-lime-400 font-bold text-xs uppercase">"Lưu pha này"</span>
                     <span className="bg-white/10 px-2 py-1 rounded text-lime-400 font-bold text-xs uppercase">"Hay quá"</span>
                 </div>
                 {lastCommand && (
                     <motion.p 
                        key={lastCommand}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white text-xs mt-3 italic"
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
                 <div className="w-full h-full bg-red-500 rounded-full" />
             </button>
          </div>
       </div>
    </div>
  );
};
