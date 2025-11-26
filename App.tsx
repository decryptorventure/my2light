import React, { useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

// Critical pages - load immediately
import { Splash } from './pages/Splash';
import { Welcome } from './pages/Welcome';
import { Login } from './pages/Login';
import { Home } from './pages/Home';

// Lazy load non-critical pages for better initial load
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const CourtDetail = lazy(() => import('./pages/CourtDetail').then(m => ({ default: m.CourtDetail })));
const QRScan = lazy(() => import('./pages/QRScan').then(m => ({ default: m.QRScan })));
const ActiveSession = lazy(() => import('./pages/ActiveSession').then(m => ({ default: m.ActiveSession })));
const Gallery = lazy(() => import('./pages/Gallery').then(m => ({ default: m.Gallery })));
const MyHighlights = lazy(() => import('./pages/MyHighlights').then(m => ({ default: m.MyHighlights })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const SelfRecording = lazy(() => import('./pages/SelfRecording').then(m => ({ default: m.SelfRecording })));

// Components
import { BottomNav } from './components/Layout/BottomNav';
import { IOSInstallPrompt } from './components/Layout/IOSInstallPrompt';
import { ToastProvider } from './components/ui/Toast';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Suspense fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Splash />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/home" element={<Home />} />
          <Route path="/court/:id" element={<CourtDetail />} />
          <Route path="/qr" element={<QRScan />} />
          <Route path="/active-session" element={<ActiveSession />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/my-highlights" element={<MyHighlights />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/self-recording" element={<SelfRecording />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Auth Session:", session ? "Logged In" : "Guest");
    });

    // Prefetch critical routes after initial load
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        // Preload Gallery and Profile (commonly accessed)
        import('./pages/Gallery');
        import('./pages/Profile');
      });
    }
  }, []);

  return (
    <HashRouter>
      <ToastProvider>
        <div className="bg-slate-900 min-h-screen text-slate-100 font-sans selection:bg-lime-400/30 pt-safe-top pb-safe-bottom">
          <AnimatedRoutes />
          <BottomNav />
          <IOSInstallPrompt />
        </div>
      </ToastProvider>
    </HashRouter>
  );
};

export default App;
