import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Building2,
    Calendar,
    Package,
    DollarSign,
    Settings,
    ChevronLeft,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
    const navItems = [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/admin/courts', icon: Building2, label: 'Quản lý sân' },
        { to: '/admin/bookings', icon: Calendar, label: 'Booking' },
        { to: '/admin/packages', icon: Package, label: 'Gói dịch vụ' },
        { to: '/admin/revenue', icon: DollarSign, label: 'Doanh thu' },
        { to: '/admin/settings', icon: Settings, label: 'Cài đặt' },
    ];

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-lime-400 flex items-center justify-center">
                        <span className="text-slate-900 font-black text-sm">M2L</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-white">my2light</h1>
                        <p className="text-xs text-slate-400">Quản lý sân</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
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
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 z-40">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay & Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 z-50 lg:hidden flex flex-col"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
