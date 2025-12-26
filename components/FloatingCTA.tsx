
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingCTAProps {
  t: any;
}

const FloatingCTA: React.FC<FloatingCTAProps> = ({ t }) => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  // Hide if already on the store page
  const isStorePage = location.pathname.startsWith('/loja');

  useEffect(() => {
    // Appear after 1s or upon scroll
    const timer = setTimeout(() => {
      if (!isStorePage) setIsVisible(true);
    }, 1000);

    const handleScroll = () => {
      if (window.scrollY > 200 && !isStorePage) {
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
          initial={{ opacity: 0, x: 100, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 25,
            delay: 0.2
          }}
          className="fixed top-28 right-6 lg:top-32 lg:right-10 z-[90]"
        >
          <Link to="/loja" className="relative group flex items-center">
            {/* Main Button - Compact & Fixed Width Reveal */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 bg-gradient-to-r from-blue-700 via-indigo-800 to-brand-navy rounded-full px-5 py-3 shadow-[0_15px_35px_rgba(37,99,235,0.3)] border border-white/10 cursor-pointer transition-all duration-300 backdrop-blur-md"
            >
              <div className="flex-shrink-0 flex items-center justify-center text-white">
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>

              {/* Text fades in but button stays pill-shaped */}
              <span className="whitespace-nowrap font-bold text-[10px] lg:text-xs uppercase tracking-[0.2em] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                {t.cta_portfolio || 'Nosso Portfólio'}
              </span>
            </motion.div>

            {/* "Novo" Badge - Refined Pulsing */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5, type: 'spring' }}
              className="absolute -top-2 -right-1 flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-brand-gold to-yellow-500 rounded-full shadow-lg border border-white/20 z-10"
            >
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
              </div>
              <span className="text-[7px] font-black uppercase tracking-widest text-brand-navy">
                {t.badge_new || 'Novo'}
              </span>
            </motion.div>

            {/* Subtle glow effect */}
            <div className="absolute inset-0 rounded-full bg-blue-600/10 blur-xl -z-10 group-hover:bg-blue-600/20 transition-colors duration-500"></div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingCTA;
