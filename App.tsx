
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

// Pages
import { Splash } from './pages/Splash';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { QRScan } from './pages/QRScan';
import { ActiveSession } from './pages/ActiveSession';
import { Gallery } from './pages/Gallery';
import { Profile } from './pages/Profile';

// Components
import { BottomNav } from './components/Layout/BottomNav';
import { IOSInstallPrompt } from './components/Layout/IOSInstallPrompt';

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/qr" element={<QRScan />} />
        <Route path="/active-session" element={<ActiveSession />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Auth Session:", session ? "Logged In" : "Guest");
    });
  }, []);

  return (
    <HashRouter>
      <div className="bg-slate-900 min-h-screen text-slate-100 font-sans selection:bg-lime-400/30 pt-safe-top pb-safe-bottom">
        <AnimatedRoutes />
        <BottomNav />
        <IOSInstallPrompt />
      </div>
    </HashRouter>
  );
};

export default App;
