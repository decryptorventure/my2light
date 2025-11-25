
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, PlusSquare, X } from 'lucide-react';

export const IOSInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect if device is iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Detect if already in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    // Check if user has dismissed it recently (in the last 24h)
    const lastDismissed = localStorage.getItem('iosPromptDismissed');
    const isRecentlyDismissed = lastDismissed && (Date.now() - parseInt(lastDismissed) < 86400000);

    if (isIOS && !isStandalone && !isRecentlyDismissed) {
      // Show prompt after a small delay to let the app load first
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('iosPromptDismissed', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-safe-bottom"
        >
          <div className="bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative max-w-md mx-auto">
            <button 
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-2 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10">
                <img 
                    src="https://cdn-icons-png.flaticon.com/512/3307/3307873.png" 
                    alt="App Icon" 
                    className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg leading-tight mb-1">Cài đặt my2light</h3>
                <p className="text-slate-300 text-sm mb-3">Thêm vào màn hình chính để có trải nghiệm tốt nhất.</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <span className="flex items-center justify-center w-6 h-6 bg-slate-700 rounded text-blue-400">
                        <Share size={14} />
                    </span>
                    <span>Bấm vào nút <b>Chia sẻ</b> bên dưới</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <span className="flex items-center justify-center w-6 h-6 bg-slate-700 rounded text-slate-200">
                        <PlusSquare size={14} />
                    </span>
                    <span>Chọn <b>Thêm vào MH chính</b></span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Arrow pointing down to Safari toolbar */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-slate-800/95"></div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
