
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { PageTransition } from '../components/Layout/PageTransition';
import { ArrowRight, Mail, Lock, Loader2, AlertCircle, Facebook, Chrome } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui/Toast';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      if (mode === 'signup') {
        // 1. Đăng ký tài khoản Auth
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
        });

        if (error) throw error;

        if (data.user) {
          // 2. Tạo Profile (Dùng upsert để tránh lỗi nếu user đã tồn tại)
          const name = cleanEmail.split('@')[0];
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
            credits: 200000, // Tiền thưởng tân thủ
            membership_tier: 'free',
            total_highlights: 0
          });

          if (profileError) {
            console.error("Lỗi tạo profile:", profileError);
            // Không throw error ở đây để user vẫn vào được app (API sẽ handle fallback)
          }

          // Tự động đăng nhập ngay sau khi đăng ký (nếu Supabase không yêu cầu verify email)
          navigate('/onboarding');
        } else {
          // Trường hợp cần verify email
          alert('Vui lòng kiểm tra email để xác thực tài khoản!');
        }
      } else {
        // Đăng nhập
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword
        });
        if (error) throw error;
        navigate('/home');
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      const msg = error.message === "Invalid login credentials"
        ? "Sai email hoặc mật khẩu"
        : error.message || "Có lỗi xảy ra, vui lòng thử lại.";
      // setErrorMsg(msg); // Old way
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Simulation only for MVP
    alert(`Đăng nhập bằng ${provider} đang được phát triển!`);
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col p-6 relative overflow-hidden bg-slate-900 justify-center">
        {/* Background blobs */}
        <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-lime-400/10 rounded-full blur-[80px]" />

        <div className="z-10 w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 text-center"
          >
            <h1 className="text-4xl font-black text-white mb-2">
              my<span className="text-lime-400">2</span>light
            </h1>
            <p className="text-slate-400">
              {mode === 'signin' ? 'Đăng nhập để ra sân ngay' : 'Tạo tài khoản miễn phí'}
            </p>
          </motion.div>

          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl">
            <div className="space-y-4">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-lime-400 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-lime-400 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  />
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleAuth}
                disabled={isLoading || !email || !password}
                className="w-full mt-6 flex justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Đăng Nhập' : 'Đăng Ký'}</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </Button>

              {/* Social Login Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-800 px-2 text-slate-400">Hoặc tiếp tục với</span>
                </div>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSocialLogin('Google')}
                  className="flex items-center justify-center gap-2 bg-white text-slate-900 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
                >
                  <Chrome size={18} className="text-red-500" />
                  Google
                </button>
                <button
                  onClick={() => handleSocialLogin('Facebook')}
                  className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#166fe5] transition-colors"
                >
                  <Facebook size={18} className="text-white fill-white" />
                  Facebook
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                {mode === 'signin' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                <button
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setErrorMsg('');
                  }}
                  className="text-lime-400 font-bold ml-1 hover:underline"
                >
                  {mode === 'signin' ? 'Đăng ký ngay' : 'Đăng nhập'}
                </button>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-8">
            v1.0.4 MVP • Powered by Supabase
          </p>
        </div>
      </div>
    </PageTransition>
  );
};
