import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { X, Camera, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
    const [isScanning, setIsScanning] = useState(true);
    const [error, setError] = useState<string>('');
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const qrCodeRegionId = "qr-reader";
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            startScanner();
        }, 500);

        return () => {
            isMounted.current = false;
            clearTimeout(timer);
            cleanupScanner();
        };
    }, []);

    const cleanupScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (err) {
                console.error('Error stopping scanner:', err);
            }
            scannerRef.current = null;
        }
    };

    const startScanner = async () => {
        try {
            setError('');

            // Clean up existing instance if any
            await cleanupScanner();

            if (!isMounted.current) return;

            const html5QrCode = new Html5Qrcode(qrCodeRegionId);
            scannerRef.current = html5QrCode;

            const qrCodeSuccessCallback = (decodedText: string) => {
                if (!isMounted.current) return;
                console.log(`QR Code detected: ${decodedText}`);
                // Play a beep sound if possible (optional)
                onScanSuccess(decodedText);
                cleanupScanner();
            };

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
            };

            await html5QrCode.start(
                { facingMode: "environment" }, // Prefer back camera
                config,
                qrCodeSuccessCallback,
                (errorMessage) => {
                    // Ignore scanning errors (happens when no QR in frame)
                }
            );

            if (isMounted.current) {
                setHasPermission(true);
                setIsScanning(true);
            }
        } catch (err: any) {
            console.error('Failed to start scanner:', err);
            if (isMounted.current) {
                setHasPermission(false);
                setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
                setIsScanning(false);
            }
        }
    };

    const handleRetry = () => {
        setError('');
        setHasPermission(null);
        startScanner();
    };

    return (
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-slate-800 border-b border-slate-700 z-10">
                <h2 className="text-lg font-bold text-white">Quét mã QR sân</h2>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-700 rounded-full transition-colors"
                >
                    <X size={24} className="text-white" />
                </button>
            </div>

            {/* Scanner Container */}
            <div className="flex-1 flex flex-col items-center justify-center bg-black relative overflow-hidden">
                {/* Loading State */}
                {hasPermission === null && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
                        <LoadingSpinner />
                        <p className="text-slate-400 mt-4">Đang khởi động camera...</p>
                    </div>
                )}

                {/* Error State */}
                {error ? (
                    <div className="text-center p-6 z-10 bg-slate-900 rounded-xl m-4 border border-slate-800">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Camera size={32} className="text-red-500" />
                        </div>
                        <p className="text-white font-bold mb-2">Lỗi Camera</p>
                        <p className="text-slate-400 mb-6 text-sm">{error}</p>
                        <button
                            onClick={handleRetry}
                            className="flex items-center gap-2 px-6 py-3 bg-lime-400 text-slate-900 rounded-xl font-bold mx-auto hover:bg-lime-500 transition-colors"
                        >
                            <RefreshCw size={18} />
                            Thử lại
                        </button>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center relative">
                        {/* QR Scanner View */}
                        <div id={qrCodeRegionId} className="w-full max-w-md overflow-hidden" />

                        {/* Overlay Guide */}
                        {hasPermission && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="w-64 h-64 border-2 border-lime-400/50 rounded-3xl relative">
                                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-lime-400 rounded-tl-xl" />
                                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-lime-400 rounded-tr-xl" />
                                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-lime-400 rounded-bl-xl" />
                                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-lime-400 rounded-br-xl" />

                                    {/* Scanning Line Animation */}
                                    <motion.div
                                        className="absolute left-2 right-2 h-0.5 bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.8)]"
                                        animate={{ top: ['5%', '95%', '5%'] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Instruction */}
                        {hasPermission && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute bottom-12 left-0 right-0 text-center px-6"
                            >
                                <div className="bg-black/60 backdrop-blur-md py-3 px-6 rounded-full inline-block">
                                    <p className="text-white text-sm font-medium">
                                        Di chuyển camera đến mã QR
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
