
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingCTAProps {
  t: any;
}

const FloatingCTA: React.FC<FloatingCTAProps> = ({ t }) => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  // Ocultar se já estiver na página da loja
  const isStorePage = location.pathname.startsWith('/loja');

  useEffect(() => {
    // Aparece após 1.5s ou após scroll
    const timer = setTimeout(() => {
      if (!isStorePage) setIsVisible(true);
    }, 1500);

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
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            delay: 0.2
          }}
          className="fixed bottom-24 right-6 lg:bottom-10 lg:right-10 z-[90]"
        >
          <Link to="/loja" className="relative group flex items-center">
            {/* Main Button */}
            <motion.div 
              whileHover={{ width: 'auto', paddingRight: '2rem' }}
              className="flex items-center gap-4 h-16 lg:h-20 bg-gradient-to-r from-blue-700 via-indigo-800 to-brand-navy rounded-full px-5 lg:px-6 shadow-[0_20px_50px_rgba(37,99,235,0.4)] border border-white/10 overflow-hidden cursor-pointer group-hover:pr-10 transition-all duration-500"
            >
              <div className="flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md">
                <svg className="w-5 h-5 lg:w-6 lg:h-6 group-hover:rotate-12 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>

              <span className="whitespace-nowrap font-bold text-[10px] lg:text-xs uppercase tracking-[0.3em] text-white opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                {t.cta_portfolio || 'Nosso Portfólio'}
              </span>
            </motion.div>

            {/* "Novo" Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 2, type: 'spring' }}
              className="absolute -top-2 -right-2 flex items-center gap-1.5 px-3 py-1 bg-brand-gold rounded-full shadow-lg border border-white/20 z-10"
            >
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              <span className="text-[8px] font-black uppercase tracking-widest text-brand-navy">
                {t.badge_new || 'Novo'}
              </span>
            </motion.div>

            {/* Glowing effect around */}
            <div className="absolute inset-0 rounded-full bg-blue-600/20 blur-2xl -z-10 group-hover:bg-blue-600/40 transition-colors duration-500"></div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingCTA;
