import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ApiService } from '../services/api';
import { Package, Court } from '../types';
import { QRScanner } from '../components/QRScanner';
import { useToast } from '../components/ui/Toast';

export const QRScan: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState<'scan' | 'package' | 'payment'>('scan');
  const [scannedCourt, setScannedCourt] = useState<Court | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load initial data
  useEffect(() => {
    ApiService.getPackages().then(res => {
      if (res.success) setPackages(res.data);
    });
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    const cleanId = decodedText.trim();
    console.log('Scanned (clean):', cleanId);

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleanId)) {
      showToast('Mã QR không hợp lệ. Vui lòng quét mã QR chứa ID sân (dạng Text).', 'error');
      return;
    }

    // 1. Try to find court by ID
    const courtRes = await ApiService.getCourtById(cleanId);

    if (courtRes.success && courtRes.data) {
      setScannedCourt(courtRes.data);

      // 2. Check for active booking
      const activeBooking = await ApiService.getActiveBooking();
      if (activeBooking.success && activeBooking.data && activeBooking.data.courtId === cleanId) {
        // Auto check-in
        await ApiService.checkInBooking(activeBooking.data.id);
        showToast('Check-in thành công! Chúc bạn chơi vui vẻ.', 'success');
        navigate('/active-session');
      } else {
        // Proceed to booking
        showToast('Đã tìm thấy sân: ' + courtRes.data.name, 'success');
        setStep('package');
      }
    } else {
      console.error('Scan failed:', courtRes.error);
      showToast(`Không tìm thấy sân: ${courtRes.error || 'Mã không hợp lệ'}`, 'error');
    }
  };

  const handlePayment = async () => {
    if (!selectedPackage || !scannedCourt) return;

    setIsProcessing(true);
    try {
      const res = await ApiService.createBooking(selectedPackage, scannedCourt.id);
      if (res.success) {
        showToast('Đặt sân thành công!', 'success');
        navigate('/active-session');
      } else {
        showToast('Thanh toán thất bại: ' + (res.error || 'Lỗi không xác định'), 'error');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      showToast('Lỗi đặt sân: ' + (error.message || 'Vui lòng thử lại'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

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
          <QRScanner
            onScanSuccess={handleScanSuccess}
            onClose={() => navigate('/home')}
          />
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
