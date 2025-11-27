import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Building2,
    Calendar,
    Package,
    DollarSign,
    Settings,
    ChevronLeft
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
    const navItems = [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/courts', icon: Building2, label: 'Quản lý sân' },
        { to: '/admin/bookings', icon: Calendar, label: 'Booking' },
        { to: '/admin/packages', icon: Package, label: 'Gói dịch vụ' },
        { to: '/admin/revenue', icon: DollarSign, label: 'Doanh thu' },
        { to: '/admin/settings', icon: Settings, label: 'Cài đặt' },
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 z-40">
                {/* Logo */}
                <div className="p-6 border-b border-slate-700">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center">
                            <span className="text-slate-900 font-black text-sm">M2L</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-white">my2light</h1>
                            <p className="text-xs text-slate-400">Quản lý sân</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-lime-400/10 text-lime-400 font-semibold'
                                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Back to Player Mode */}
                <div className="p-4 border-t border-slate-700">
                    <NavLink
                        to="/home"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span>Về trang chủ</span>
                    </NavLink>
                </div>
            </aside>

            {/* Mobile Bottom Nav - TODO */}
        </>
    );
};
