import React from 'react';
import { useNavigate, useLocation, matchPath } from 'react-router-dom';
import { Home, Play, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const navItems = [
    { icon: Home, label: 'Trang chủ', path: '/home' },
    { icon: Play, label: 'Thư viện', path: '/my-highlights' },
    { icon: User, label: 'Cá nhân', path: '/profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Don't show nav on these paths
  const hiddenPaths = ['/', '/welcome', '/onboarding', '/login', '/qr', '/active-session', '/self-recording', '/gallery', '/notifications'];

  // Robust check for hiding
  const isHidden = hiddenPaths.includes(location.pathname) ||
    !!matchPath('/court/:id', location.pathname) ||
    !!matchPath('/booking/:id', location.pathname) ||
    location.pathname.startsWith('/booking') ||
    location.pathname.includes('/booking') ||
    location.pathname.startsWith('/admin');

  if (isHidden) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-800 pb-safe">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const ActiveIcon = item.icon;
          const active = isActive(item.path);

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center flex-1 py-2 gap-1 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <ActiveIcon
                size={24}
                strokeWidth={2}
                className={active ? 'text-lime-400' : 'text-slate-400'}
              />
              <span className={`text-[10px] font-medium ${active ? 'text-lime-400' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};