import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Shield } from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { Button } from '../components/ui/Button';
import { PaymentService } from '../services/payment';
import { handlePaymentWebhook, validateWebhookPayload } from '../services/webhook';
import { celebrate } from '../lib/confetti';

export const PaymentCallback: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
    const [message, setMessage] = useState('Đang xử lý thanh toán...');
    const [securityVerified, setSecurityVerified] = useState(false);

    useEffect(() => {
        const processPayment = async () => {
            const transactionId = searchParams.get('transactionId');
            const bookingId = searchParams.get('bookingId');
            const amount = searchParams.get('amount');
            const method = searchParams.get('method');
            const paymentStatus = searchParams.get('status');
            const signature = searchParams.get('signature'); // Webhook signature

            // Basic validation
            if (!transactionId || !amount || !method || !paymentStatus) {
                setStatus('failed');
                setMessage('Thiếu thông tin giao dịch');
                return;
            }

            // If signature provided, verify webhook security
            if (signature) {
                console.log('[Payment] Webhook signature detected, verifying...');

                const payload = {
                    bookingId: bookingId || '',
                    status: paymentStatus,
                    amount: parseInt(amount),
                    transactionId
                };

                // Validate payload structure
                if (!validateWebhookPayload(payload)) {
                    setStatus('failed');
                    setMessage('Dữ liệu giao dịch không hợp lệ');
                    return;
                }

                // Handle webhook with signature verification
                const webhookResult = await handlePaymentWebhook(payload, signature);

                if (!webhookResult.success) {
                    console.error('[Payment] Webhook verification failed:', webhookResult.error);
                    setStatus('failed');
                    setMessage('Xác thực giao dịch thất bại - Signature không hợp lệ');
                    return;
                }

                console.log('[Payment] Webhook verified successfully');
                setSecurityVerified(true);
            }

            // Process payment (standard flow or after webhook verification)
            const result = await PaymentService.processPaymentCallback(
                transactionId,
                parseInt(amount),
                method,
                paymentStatus
            );

            if (result.success) {
                setStatus('success');
                setMessage(`Nạp ${parseInt(amount).toLocaleString()}đ thành công!`);
                celebrate({ particleCount: 100 });
            } else {
                setStatus('failed');
                setMessage(result.error || 'Giao dịch thất bại');
            }
        };

        processPayment();
    }, [searchParams]);


    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
                        {/* Icon */}
                        {status === 'processing' && (
                            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <Loader className="text-blue-500 animate-spin" size={40} />
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="text-green-500" size={40} />
                            </div>
                        )}

                        {status === 'failed' && (
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <XCircle className="text-red-500" size={40} />
                            </div>
                        )}

                        {/* Security Badge */}
                        {securityVerified && status === 'success' && (
                            <div className="flex items-center justify-center gap-2 mb-4 text-green-400 text-sm">
                                <Shield size={16} />
                                <span>Đã xác thực bảo mật</span>
                            </div>
                        )}

                        {/* Message */}
                        <h1 className="text-2xl font-bold text-white mb-2">
                            {status === 'processing' && 'Đang xử lý'}
                            {status === 'success' && 'Thành công!'}
                            {status === 'failed' && 'Thất bại'}
                        </h1>

                        <p className="text-slate-400 mb-8">{message}</p>

                        {/* Actions */}
                        {status !== 'processing' && (
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => navigate('/home')}
                                    className="flex-1"
                                >
                                    Trang chủ
                                </Button>
                                <Button onClick={() => navigate('/wallet')} className="flex-1">
                                    {status === 'success' ? 'Xem ví' : 'Thử lại'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};
