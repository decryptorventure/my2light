import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Check, Info, AlertTriangle, XCircle } from 'lucide-react';
import { PageTransition } from '../components/Layout/PageTransition';
import { useNotifications } from '../contexts/NotificationContext';
import { Button } from '../components/ui/Button';

export const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const { notifications, markAllAsRead, markAsRead } = useNotifications();

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <Check size={20} className="text-green-400" />;
            case 'warning': return <AlertTriangle size={20} className="text-yellow-400" />;
            case 'error': return <XCircle size={20} className="text-red-400" />;
            default: return <Info size={20} className="text-blue-400" />;
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-900 pb-safe">
                {/* Header */}
                <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
                    <div className="flex items-center justify-between p-4 pt-safe">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <h1 className="font-bold text-lg">Thông báo</h1>
                        </div>
                        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-lime-400">
                            Đọc tất cả
                        </Button>
                    </div>
                </div>

                <div className="pt-24 px-4 space-y-4">
                    {notifications.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Bell size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Chưa có thông báo nào.</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => markAsRead(notification.id)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer ${notification.read
                                    ? 'bg-slate-900 border-slate-800 opacity-60'
                                    : 'bg-slate-800 border-slate-700 shadow-lg'
                                    }`}
                            >
                                <div className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.read ? 'bg-slate-800' : 'bg-slate-700'
                                        }`}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-bold text-sm ${notification.read ? 'text-slate-400' : 'text-white'}`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-[10px] text-slate-500">
                                                {new Date(notification.timestamp).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            {notification.message}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="w-2 h-2 rounded-full bg-lime-400 mt-2" />
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </PageTransition>
    );
};
