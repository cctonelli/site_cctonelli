
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingCTAProps {
  t: any;
}

const FloatingCTA: React.FC<FloatingCTAProps> = ({ t }) => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  const isStorePage = location.pathname.startsWith('/loja');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isStorePage) setIsVisible(true);
    }, 1200);

    const handleScroll = () => {
      if (window.scrollY > 300 && !isStorePage) {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isStorePage]);

  if (isStorePage) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 50, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-10 right-10 z-[90]"
        >
          <Link to="/loja" className="relative group flex items-center">
            <motion.div 
              whileHover={{ scale: 1.05, x: -10 }}
              className="flex items-center gap-4 bg-slate-900 dark:bg-blue-600 rounded-[2rem] px-8 py-5 shadow-[0_30px_60px_-15px_rgba(37,99,235,0.4)] border border-white/10 cursor-pointer transition-all duration-500 backdrop-blur-3xl"
            >
              <div className="flex-shrink-0 flex items-center justify-center text-white">
                <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>

              <div className="flex flex-col items-start pr-2">
                <span className="text-white/50 text-[7px] font-black uppercase tracking-[0.4em] leading-none mb-1">Elite Hub</span>
                <span className="whitespace-nowrap font-bold text-[11px] uppercase tracking-[0.25em] text-white">
                  Vitrine de Ativos
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 1.8, type: 'spring' }}
              className="absolute -top-3 -right-2 flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-brand-gold to-yellow-600 rounded-full shadow-2xl border border-white/20 z-10"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-navy">
                {t.badge_new || 'V10'}
              </span>
            </motion.div>

            <div className="absolute inset-0 rounded-[2rem] bg-blue-600/20 blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingCTA;
