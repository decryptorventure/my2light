import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { apiClient } from '../src/api/core/client';

export const Splash: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      // Check if we have a session
      const { data: { session } } = await apiClient.supabase.auth.getSession();

      setTimeout(() => {
        if (session) {
          navigate('/home');
        } else {
          navigate('/welcome');
        }
      }, 2500);
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-24 h-24 bg-gradient-to-br from-lime-400 to-blue-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-lime-400/20"
      >
        <Zap size={48} className="text-white fill-white" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
          my<span className="text-lime-400">2</span>light
        </h1>
        <p className="text-slate-400 font-medium tracking-wide">
          SÂN CHƠI CỦA BẠN. TỎA SÁNG TỨC THÌ.
        </p>
      </motion.div>
    </div>
  );
};