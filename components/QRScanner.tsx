import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { X, Camera } from 'lucide-react';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string>('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const qrCodeRegionId = "qr-reader";

    useEffect(() => {
        startScanner();
        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        try {
            setIsScanning(true);
            setError('');

            const html5QrCode = new Html5Qrcode(qrCodeRegionId);
            scannerRef.current = html5QrCode;

            const qrCodeSuccessCallback = (decodedText: string) => {
                console.log(`QR Code detected: ${decodedText}`);
                onScanSuccess(decodedText);
                stopScanner();
            };

            const config = { fps: 10, qrbox: { width: 250, height: 250 } };

            await html5QrCode.start(
                { facingMode: "environment" }, // Use back camera
                config,
                qrCodeSuccessCallback,
                (errorMessage) => {
                    // Ignore scanning errors (happens when no QR in frame)
                }
            );
        } catch (err: any) {
            console.error('Failed to start scanner:', err);
            setError('Không thể truy cập camera. Vui lòng cho phép quyền truy cập camera.');
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
                scannerRef.current = null;
            } catch (err) {
                console.error('Error stopping scanner:', err);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-slate-800 border-b border-slate-700">
                <h2 className="text-lg font-bold text-white">Quét mã QR sân</h2>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                >
                    <X size={24} className="text-white" />
                </button>
            </div>

            {/* Scanner Container */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                {error ? (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Camera size={32} className="text-red-500" />
                        </div>
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={startScanner}
                            className="px-6 py-2 bg-lime-400 text-slate-900 rounded-lg font-bold"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : (
                    <div className="w-full max-w-md">
                        {/* QR Scanner View */}
                        <div id={qrCodeRegionId} className="rounded-2xl overflow-hidden shadow-2xl" />

                        {/* Instruction */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 text-center"
                        >
                            <p className="text-slate-300 text-sm">
                                Đưa mã QR vào khung hình để quét
                            </p>
                            <p className="text-slate-500 text-xs mt-2">
                                Camera sẽ tự động quét khi phát hiện mã QR
                            </p>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};
