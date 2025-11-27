import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageTransition } from '../components/Layout/PageTransition';
import {
  ArrowRight, ArrowLeft, Mail, Lock, Loader2,
  Chrome, Facebook, Eye, EyeOff, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';
import { celebrate } from '../lib/confetti';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    setIsLoading(true);

    try {
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      // Validation
      if (!cleanEmail || !cleanPassword) {
        showToast('Vui lòng điền đầy đủ thông tin', 'error');
        return;
      }

      if (cleanPassword.length < 6) {
        showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
        return;
      }

      if (mode === 'signup') {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (error) throw error;

        if (data.user) {
          // Create profile
          const name = cleanEmail.split('@')[0];
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
            credits: 200000,
            membership_tier: 'free',
            total_highlights: 0
          });

          if (profileError) {
            console.error("Profile creation error:", profileError);
          }

          celebrate({ particleCount: 100 });
          showToast('Đăng ký thành công! 🎉', 'success');
          setTimeout(() => navigate('/onboarding'), 500);
        } else {
          showToast('Vui lòng kiểm tra email để xác thực!', 'info');
        }
      } else {
        // Sign in
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword
        });

        if (error) throw error;

        if (authData.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('has_onboarded')
            .eq('id', authData.user.id)
            .single();

          // Force refresh session to ensure latest claims/metadata
          await supabase.auth.refreshSession();

          celebrate({ particleCount: 50 });
          showToast('Đăng nhập thành công! 👋', 'success');

          setTimeout(() => {
            if (profile && !profile.has_onboarded) {
              navigate('/onboarding');
            } else {
              navigate('/home');
            }
          }, 500);
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      const msg = error.message === "Invalid login credentials"
        ? "Sai email hoặc mật khẩu"
        : error.message || "Có lỗi xảy ra, vui lòng thử lại.";
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/#/home`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      showToast(`Đăng nhập ${provider} đang được phát triển!`, 'info');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-lime-400/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-blue-400/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col p-6 pt-safe pb-safe">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-slate-800/50 backdrop-blur-md flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-lime-400" />
              <span className="text-sm font-bold text-slate-400">
                {mode === 'signin' ? 'Đăng nhập' : 'Đăng ký'}
              </span>
            </div>
          </div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-black text-white mb-2">
              my<span className="text-lime-400">2</span>light
            </h1>
            <p className="text-slate-400">
              {mode === 'signin'
                ? 'Chào mừng trở lại! 👋'
                : 'Tạo tài khoản miễn phí 🎉'}
            </p>
          </motion.div>

          {/* Form */}
          <div className="flex-1 max-w-md mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === 'signin' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'signin' ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* Email Input */}
                <Input
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  leftIcon={<Mail size={20} />}
                  variant="filled"
                  autoComplete="email"
                  onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                />

                {/* Password Input */}
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    label="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    leftIcon={<Lock size={20} />}
                    variant="filled"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {mode === 'signin' && (
                  <div className="flex justify-end">
                    <button className="text-sm text-lime-400 font-medium hover:underline">
                      Quên mật khẩu?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleAuth}
                  disabled={isLoading || !email || !password}
                  isLoading={isLoading}
                  size="xl"
                  className="w-full mt-6"
                  icon={!isLoading && <ArrowRight size={20} />}
                >
                  {isLoading
                    ? 'Đang xử lý...'
                    : mode === 'signin' ? 'Đăng nhập' : 'Tạo tài khoản'}
                </Button>

                {/* Divider */}
                <div className="relative py-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-slate-900 px-3 text-slate-500 font-medium">
                      Hoặc tiếp tục với
                    </span>
                  </div>
                </div>

                {/* Social Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSocialLogin('google')}
                    className="flex items-center justify-center gap-2 bg-white text-slate-900 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all hover:scale-105 active:scale-95"
                  >
                    <Chrome size={20} className="text-red-500" />
                    Google
                  </button>
                  <button
                    onClick={() => handleSocialLogin('facebook')}
                    className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#166fe5] transition-all hover:scale-105 active:scale-95"
                  >
                    <Facebook size={20} className="fill-white" />
                    Facebook
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Toggle Mode */}
          <div className="mt-8 text-center">
            <p className="text-slate-400">
              {mode === 'signin' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setEmail('');
                  setPassword('');
                }}
                className="text-lime-400 font-bold ml-2 hover:underline"
              >
                {mode === 'signin' ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-600 mt-6">
            v2.5.1 • Powered by Supabase
          </p>
        </div>
      </div>
    </PageTransition>
  );
};
