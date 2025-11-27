import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useRole } from '../../../hooks/useRole';

export const AdminHeader: React.FC = () => {
    const navigate = useNavigate();
    const { activeRole } = useRole();

    return (
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
            <div className="flex items-center justify-between p-4">
                {/* Mobile Menu Button */}
                <button className="lg:hidden w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                    <Menu size={20} />
                </button>

                {/* Page Title - Hidden on mobile, shown on desktop */}
                <div className="hidden lg:block">
                    <h2 className="text-lg font-bold text-white">Quản lý sân</h2>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 ml-auto">
                    {/* Notifications */}
                    <button className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center hover:bg-slate-700 transition-colors relative">
                        <Bell size={20} className="text-slate-400" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                            3
                        </div>
                    </button>

                    {/* User Profile */}
                    <div
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                        onClick={() => navigate('/profile')}
                    >
                        <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center">
                            <span className="text-slate-900 font-bold text-sm">A</span>
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xs text-slate-400">Chủ sân</p>
                            <p className="text-sm font-semibold text-white">Admin</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
