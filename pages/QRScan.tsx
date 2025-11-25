import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ApiService } from '../services/mockDb';
import { Package, Court } from '../types';

export const QRScan: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'scan' | 'package' | 'payment'>('scan');
  const [scannedCourt, setScannedCourt] = useState<Court | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Load initial data if needed
  useEffect(() => {
    // Preload packages
    ApiService.getPackages().then(res => {
        if(res.success) setPackages(res.data);
    });
  }, []);

  // Simulate scanning success
  useEffect(() => {
    if (step === 'scan') {
      const timer = setTimeout(async () => {
        // Mock finding court c1
        const res = await ApiService.getCourtById('c1');
        if(res.success && res.data) {
            setScannedCourt(res.data);
            setStep('package');
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handlePayment = async () => {
    if(!selectedPackage || !scannedCourt) return;
    
    setIsProcessing(true);
    try {
        const res = await ApiService.createBooking(selectedPackage, scannedCourt.id);
        if(res.success) {
            navigate('/active-session');
        } else {
            alert('Thanh toán thất bại');
        }
    } catch (error) {
        console.error(error);
        alert('Lỗi hệ thống');
    } finally {
        setIsProcessing(false);
    }
  };

  const ScanOverlay = () => (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-6 left-6 z-20">
        <Button variant="ghost" onClick={() => navigate('/home')} className="rounded-full w-10 h-10 p-0 bg-black/40 text-white">
          <X size={24} />
        </Button>
      </div>
      
      {/* Camera Simulation */}
      <div className="flex-1 relative overflow-hidden bg-slate-900">
        {/* Mock Camera Feed Background */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-60 grayscale" />
        
        <div className="absolute inset-0 flex items-center justify-center p-12">
           <div className="relative w-full aspect-square max-w-[300px]">
               {/* Corner Markers */}
               <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-lime-400 rounded-tl-xl" />
               <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-lime-400 rounded-tr-xl" />
               <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-lime-400 rounded-bl-xl" />
               <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-lime-400 rounded-br-xl" />
               
               {/* Scanning Laser */}
               <div className="absolute top-0 left-0 w-full h-1 bg-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.8)] animate-scan-line" />
           </div>
        </div>

        <div className="absolute bottom-20 left-0 right-0 text-center">
            <p className="text-white/80 font-medium bg-black/30 backdrop-blur-md inline-block px-4 py-2 rounded-full border border-white/10">
                Di chuyển camera vào mã QR trên sân
            </p>
        </div>
      </div>
    </div>
  );

  const PackageSelection = () => (
    <div className="min-h-screen bg-slate-900 p-6 pt-12 flex flex-col">
       <div className="mb-8">
            <span className="text-lime-400 text-sm font-bold tracking-wider uppercase mb-2 block">Đã kết nối sân</span>
            <h2 className="text-3xl font-black text-white">{scannedCourt?.name}</h2>
            <div className="flex items-center gap-2 mt-2 text-slate-400">
                <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
                <span>Camera Online • Sẵn sàng ghi hình</span>
            </div>
       </div>

       <div className="flex-1 space-y-4">
           {packages.map((pkg) => (
               <Card 
                key={pkg.id} 
                onClick={() => setSelectedPackage(pkg.id)}
                className={`p-5 relative cursor-pointer border-2 transition-all ${selectedPackage === pkg.id ? 'border-lime-400 bg-slate-800' : 'border-transparent bg-slate-800/50'}`}
               >
                   {pkg.isBestValue && (
                       <div className="absolute -top-3 right-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide shadow-lg">
                           Phổ biến nhất
                       </div>
                   )}
                   <div className="flex justify-between items-center mb-1">
                       <h3 className="font-bold text-lg">{pkg.name}</h3>
                       <div className="text-xl font-bold text-lime-400">{pkg.price.toLocaleString()}đ</div>
                   </div>
                   <p className="text-slate-400 text-sm mb-2">{pkg.durationMinutes} phút thi đấu</p>
                   <p className="text-slate-500 text-xs italic">{pkg.description}</p>
               </Card>
           ))}
       </div>

       <div className="mt-8 pb-8">
           <Button 
                variant="primary" 
                size="xl" 
                disabled={!selectedPackage}
                onClick={() => setStep('payment')}
                className="w-full flex justify-between"
            >
                <span>Tiếp tục thanh toán</span>
                <ChevronRight />
            </Button>
       </div>
    </div>
  );

  const PaymentScreen = () => {
      const pkg = packages.find(p => p.id === selectedPackage);
      
      return (
      <div className="min-h-screen bg-slate-900 p-6 pt-12 flex flex-col items-center justify-center">
          <Card className="w-full max-w-sm p-6 text-center space-y-6">
              <div>
                  <h3 className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-2">Tổng tiền thanh toán</h3>
                  <div className="text-4xl font-black text-white">
                      {pkg?.price.toLocaleString()}đ
                  </div>
              </div>
              
              <div className="py-6 border-t border-b border-slate-700/50 space-y-3">
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Sân</span>
                      <span className="font-medium text-right w-1/2 truncate">{scannedCourt?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Gói dịch vụ</span>
                      <span className="font-medium">{pkg?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Thời gian</span>
                      <span className="font-medium">Ngay bây giờ</span>
                  </div>
              </div>

              {/* Swipe/Click to Pay */}
              <div className="relative h-16 bg-slate-900 rounded-full overflow-hidden border border-slate-700 select-none">
                  {isProcessing ? (
                      <div className="absolute inset-0 flex items-center justify-center text-lime-400 font-bold gap-2 bg-slate-800">
                          <LoadingSpinner size="sm" />
                          <span>Đang xử lý giao dịch...</span>
                      </div>
                  ) : (
                      <button 
                        onClick={handlePayment}
                        className="w-full h-full flex items-center justify-center font-bold text-lime-400 active:bg-lime-400/10 transition-colors"
                      >
                          Chạm để thanh toán
                      </button>
                  )}
              </div>
              <p className="text-[10px] text-slate-500">
                  Bằng việc thanh toán, bạn đồng ý với điều khoản sử dụng của my2light.
              </p>
          </Card>
      </div>
      );
  };

  return (
    <AnimatePresence mode="wait">
      {step === 'scan' && (
        <motion.div key="scan" exit={{ opacity: 0 }}>
          <ScanOverlay />
        </motion.div>
      )}
      {step === 'package' && (
        <motion.div key="package" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
          <PackageSelection />
        </motion.div>
      )}
      {step === 'payment' && (
        <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <PaymentScreen />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
