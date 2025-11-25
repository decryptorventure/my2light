import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { PageTransition } from '../components/Layout/PageTransition';
import { ArrowRight, Smartphone } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Simulate auth delay
    setTimeout(() => navigate('/home'), 800);
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col p-6 relative overflow-hidden bg-slate-900">
        {/* Background blobs */}
        <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-lime-400/10 rounded-full blur-[80px]" />

        <div className="flex-1 flex flex-col justify-end pb-12 z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl font-black text-white leading-[0.9] mb-4">
              BẮT TRỌN<br/>
              TỪNG KHOẢNH KHẮC<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-blue-500">
                ĐỈNH CAO
              </span>
            </h1>
            <p className="text-slate-400 text-lg mb-10 max-w-[90%]">
              Kết nối sân thông minh, ghi lại highlight và chia sẻ đam mê với thế giới.
            </p>
          </motion.div>

          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-1 border border-white/5 flex items-center">
              <div className="pl-4 pr-3 text-slate-400 border-r border-slate-700">
                +84
              </div>
              <input 
                type="tel" 
                placeholder="Nhập số điện thoại" 
                className="bg-transparent w-full p-3 text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <Button 
              variant="primary" 
              size="xl" 
              onClick={handleLogin}
              className="w-full flex justify-between items-center group"
            >
              <span>Bắt đầu ngay</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900 text-slate-500">Hoặc tiếp tục với</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="secondary" className="w-full">Google</Button>
              <Button variant="secondary" className="w-full">Facebook</Button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};