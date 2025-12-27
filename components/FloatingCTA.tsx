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
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: "spring", stiffness: 150, damping: 25 }}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[90] flex items-center"
        >
          <Link to="/loja" className="relative group flex items-center">
            <motion.div 
              whileHover={{ x: -15 }}
              className="flex items-center gap-5 bg-slate-900 dark:bg-blue-600 rounded-l-[2.5rem] pl-10 pr-6 py-6 shadow-[-20px_0_50px_-10px_rgba(37,99,235,0.3)] border-y border-l border-white/10 cursor-pointer transition-all duration-500 backdrop-blur-3xl"
            >
              <div className="flex-shrink-0 flex items-center justify-center text-white">
                <svg className="w-7 h-7 group-hover:rotate-12 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>

              <div className="flex flex-col items-start">
                <span className="text-white/50 text-[8px] font-black uppercase tracking-[0.5em] leading-none mb-1.5">Sovereign Store</span>
                <span className="whitespace-nowrap font-black text-[12px] uppercase tracking-[0.3em] text-white">
                  Vitrine de Ativos
                </span>
              </div>
            </motion.div>

            {/* Badge Flutuante Vertical */}
            <motion.div
              initial={{ scale: 0, x: 20 }}
              animate={{ scale: 1, x: 0 }}
              transition={{ delay: 1.8, type: 'spring' }}
              className="absolute -left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-brand-gold to-yellow-600 rounded-full shadow-2xl border border-white/20 z-10"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </div>
              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-brand-navy">
                LIVE
              </span>
            </motion.div>

            <div className="absolute inset-0 rounded-l-[2.5rem] bg-blue-600/30 blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingCTA;