import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Calendar, Clock, MapPin, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageTransition } from '../components/Layout/PageTransition';

export const BookingSuccess: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as {
        courtName: string;
        date: string;
        time: string;
        totalPrice: number;
        packageName?: string;
    };

    // If no state (direct access), redirect home
    if (!state) {
        React.useEffect(() => {
            navigate('/home');
        }, [navigate]);
        return null;
    }

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-lime-500/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 w-full max-w-md text-center space-y-8">
                    {/* Success Icon */}
                    <div className="relative inline-block">
                        <div className="w-24 h-24 bg-lime-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(163,230,53,0.5)] animate-bounce-slow">
                            <Check size={48} className="text-slate-900 stroke-[3]" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-slate-800 rounded-full p-2 border border-slate-700">
                            <span className="text-2xl">🎉</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-white">Đặt sân thành công!</h1>
                        <p className="text-slate-400">Cảm ơn bạn đã sử dụng dịch vụ của My2Light.</p>
                    </div>

                    <Card className="p-6 bg-slate-800/80 backdrop-blur-md border-slate-700 text-left space-y-4">
                        <div className="flex items-start gap-3 pb-4 border-b border-slate-700/50">
                            <div className="bg-slate-700/50 p-2 rounded-lg">
                                <MapPin size={20} className="text-lime-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold">Sân thi đấu</p>
                                <p className="font-bold text-lg text-white">{state.courtName}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-700/50">
                            <div className="flex items-start gap-3">
                                <div className="bg-slate-700/50 p-2 rounded-lg">
                                    <Calendar size={20} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">Ngày</p>
                                    <p className="font-bold text-white">{state.date}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-slate-700/50 p-2 rounded-lg">
                                    <Clock size={20} className="text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold">Giờ</p>
                                    <p className="font-bold text-white">{state.time}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <span className="text-slate-400">Tổng thanh toán</span>
                            <span className="text-xl font-black text-lime-400">
                                {state.totalPrice.toLocaleString()}đ
                            </span>
                        </div>

                        {state.packageName && (
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-slate-400 text-sm">Gói quay</span>
                                <span className="text-sm font-medium text-white">
                                    {state.packageName}
                                </span>
                            </div>
                        )}
                    </Card>

                    <div className="space-y-3">
                        <Button
                            onClick={() => navigate('/my-bookings')}
                            variant="primary"
                            size="lg"
                            className="w-full"
                        >
                            Xem lịch đặt sân
                        </Button>
                        <Button
                            onClick={() => navigate('/home')}
                            variant="ghost"
                            size="lg"
                            className="w-full text-slate-400 hover:text-white"
                            icon={<Home size={18} />}
                        >
                            Về trang chủ
                        </Button>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};
