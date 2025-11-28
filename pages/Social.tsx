import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, Search, Users, Trophy } from 'lucide-react';

export const SocialLayout: React.FC = () => {
    const location = useLocation();

    const navItems = [
        { path: '/social/feed', icon: Home, label: 'Bảng tin' },
        { path: '/social/discover', icon: Search, label: 'Khám phá' },
        { path: '/social/connections', icon: Users, label: 'Bạn bè' },
        { path: '/social/leaderboard', icon: Trophy, label: 'Xếp hạng' },
    ];

    return (
        <div className="min-h-screen bg-slate-900 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-500">
                        Cộng đồng
                    </h1>
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                        {/* User Avatar Placeholder */}
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-lime-400 to-green-500 p-0.5">
                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white">
                                ME
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Top Navigation Tabs (Sticky below header) */}
            <div className="sticky top-[53px] z-30 bg-slate-900 border-b border-slate-800">
                <div className="flex items-center px-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`flex-1 flex items-center justify-center py-3 relative transition-colors ${isActive ? 'text-lime-400' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                <span className="text-sm font-semibold">{item.label}</span>
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400" />
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <main className="min-h-[calc(100vh-110px)]">
                <Outlet />
            </main>
        </div>
    );
};
