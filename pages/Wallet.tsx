import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wallet as WalletIcon, Plus, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { TopUpModal } from '../components/modals/TopUpModal';
import { useToast } from '../components/ui/Toast';
import { ApiService } from '../services/api';
import { PaymentService } from '../services/payment';
import { User } from '../types';

interface Transaction {
    id: string;
    type: 'topup' | 'booking' | 'refund';
    amount: number;
    description: string;
    timestamp: number;
    status: 'completed' | 'pending' | 'failed';
}

export const Wallet: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [showTopUpModal, setShowTopUpModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const userRes = await ApiService.getCurrentUser();
            if (userRes.success) {
                setUser(userRes.data);
            }

            // Mock transactions
            const mockTransactions: Transaction[] = [
                {
                    id: '1',
                    type: 'topup',
                    amount: 500000,
                    description: 'Nạp tiền qua VNPay',
                    timestamp: Date.now() - 86400000,
                    status: 'completed',
                },
                {
                    id: '2',
                    type: 'booking',
                    amount: -150000,
                    description: 'Đặt sân BadmintonVN - Sân 1',
                    timestamp: Date.now() - 172800000,
                    status: 'completed',
                },
            ];
            setTransactions(mockTransactions);
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleTopUp = async (amount: number, method: 'vnpay' | 'momo') => {
        if (!user) return;

        try {
            const response = await PaymentService.initiatePayment({
                amount,
                method,
                userId: user.id,
                returnUrl: `${window.location.origin}/#/payment-callback`,
            });

            if (response.success && response.paymentUrl) {
                showToast('Đang chuyển đến cổng thanh toán...', 'info');
                setTimeout(() => {
                    window.location.href = response.paymentUrl!;
                }, 1000);
            } else {
                showToast(response.error || 'Không thể khởi tạo thanh toán', 'error');
            }
        } catch (error) {
            showToast('Đã xảy ra lỗi khi xử lý thanh toán', 'error');
        }
    };

    const balance = user?.credits || 0;

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-900 pb-24">
                <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 pt-safe">
                    <div className="flex items-center justify-between px-4 py-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h1 className="text-lg font-bold">Ví My2Light</h1>
                        <div className="w-10" />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        <Card className="bg-gradient-to-br from-lime-400 to-lime-500 p-6 border-0">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <WalletIcon className="text-slate-900" size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-900 text-sm font-medium">Số dư khả dụng</p>
                                    <h2 className="text-3xl font-black text-slate-900">
                                        {balance.toLocaleString()}đ
                                    </h2>
                                </div>
                            </div>
                            <Button
                                onClick={() => setShowTopUpModal(true)}
                                icon={<Plus size={20} />}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                            >
                                Nạp tiền
                            </Button>
                        </Card>

                        <div className="grid grid-cols-2 gap-3">
                            <Card className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="text-green-500" size={16} />
                                    <span className="text-xs text-slate-400">Tổng nạp</span>
                                </div>
                                <p className="text-xl font-bold text-white">
                                    {transactions
                                        .filter((t) => t.type === 'topup')
                                        .reduce((sum, t) => sum + t.amount, 0)
                                        .toLocaleString()}đ
                                </p>
                            </Card>

                            <Card className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingDown className="text-red-500" size={16} />
                                    <span className="text-xs text-slate-400">Tổng chi</span>
                                </div>
                                <p className="text-xl font-bold text-white">
                                    {Math.abs(
                                        transactions
                                            .filter((t) => t.type === 'booking')
                                            .reduce((sum, t) => sum + t.amount, 0)
                                    ).toLocaleString()}đ
                                </p>
                            </Card>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white">Lịch sử giao dịch</h3>
                                <span className="text-xs text-slate-400">{transactions.length} giao dịch</span>
                            </div>

                            {transactions.length === 0 ? (
                                <EmptyState
                                    icon={WalletIcon}
                                    title="Chưa có giao dịch"
                                    description="Lịch sử giao dịch sẽ hiển thị ở đây"
                                />
                            ) : (
                                <div className="space-y-2">
                                    {transactions.map((transaction) => (
                                        <TransactionItem key={transaction.id} transaction={transaction} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <TopUpModal
                isOpen={showTopUpModal}
                onClose={() => setShowTopUpModal(false)}
                onConfirm={handleTopUp}
            />
        </PageTransition>
    );
};

interface TransactionItemProps {
    transaction: Transaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
    const isPositive = transaction.amount > 0;
    const date = new Date(transaction.timestamp);

    const getIcon = () => {
        switch (transaction.type) {
            case 'topup':
                return <TrendingUp className="text-green-500" size={20} />;
            case 'booking':
                return <TrendingDown className="text-red-500" size={20} />;
            case 'refund':
                return <TrendingUp className="text-blue-500" size={20} />;
            default:
                return <WalletIcon className="text-slate-500" size={20} />;
        }
    };

    return (
        <Card className="p-4 flex items-center gap-3" hoverEffect>
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0">
                {getIcon()}
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate text-sm">{transaction.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Calendar size={10} />
                    <span>
                        {date.toLocaleDateString('vi-VN')} • {date.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                </div>
            </div>

            <div className="text-right flex-shrink-0">
                <p className={`font-bold text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}
                    {transaction.amount.toLocaleString()}đ
                </p>
                <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${transaction.status === 'completed'
                        ? 'bg-green-500/20 text-green-500'
                        : transaction.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}
                >
                    {transaction.status === 'completed'
                        ? 'Thành công'
                        : transaction.status === 'pending'
                            ? 'Chờ xử lý'
                            : 'Thất bại'}
                </span>
            </div>
        </Card>
    );
};
