import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Play, User, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Trang chủ', path: '/home' },
    { icon: Play, label: 'Thư viện', path: '/my-highlights' },
    { icon: User, label: 'Cá nhân', path: '/profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Don't show nav on these paths
  if (['/', '/welcome', '/onboarding', '/login', '/qr', '/active-session'].includes(location.pathname)) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pt-2 pointer-events-none pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="bg-slate-900/80 backdrop-blur-lg rounded-full border border-white/10 shadow-2xl p-1.5 flex items-center justify-between pointer-events-auto max-w-sm mx-auto">
        {navItems.map((item) => {
          const ActiveIcon = item.icon;
          const active = isActive(item.path);

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center justify-center w-16 h-12 rounded-full transition-colors ${active ? 'text-lime-400' : 'text-slate-400'}`}
              whileTap={{ scale: 0.9 }}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-white/5 rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <ActiveIcon size={24} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};