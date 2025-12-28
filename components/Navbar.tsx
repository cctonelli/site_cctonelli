
import React, { useState, useEffect, useRef } from 'react';
import { Profile } from '../types';
import { Language, languages } from '../services/i18nService';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { fetchSiteConfig } from '../services/supabaseService';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  onAdminClick: () => void;
  userProfile: Profile | null;
  onLogout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onAdminClick, 
  userProfile, 
  onLogout, 
  language, 
  setLanguage,
  theme,
  setTheme
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const config = fetchSiteConfig();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLabel = (key: string) => config.menus[key][language] || config.menus[key]['pt'];

  const handleLogoutAction = () => {
    setIsDropdownOpen(false);
    onLogout();
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${isScrolled ? 'bg-slate-950/90 backdrop-blur-2xl py-4 border-b border-white/5 shadow-2xl' : 'bg-transparent py-10'}`}>
      <div className="container mx-auto px-6 lg:px-10 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-2xl group-hover:scale-105 transition-all">CT</div>
          <div className="flex flex-col">
            <span className="text-lg lg:text-xl font-bold tracking-tighter leading-none dark:text-white text-slate-900 uppercase">Claudio Tonelli</span>
            <span className="text-[7px] lg:text-[8px] uppercase tracking-[0.4em] text-slate-500 font-black mt-1">Executive Advisory</span>
          </div>
        </div>
        
        {/* Navigation Desktop */}
        <div className="hidden xl:flex items-center space-x-12 text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">
          <a href="#hero" className="hover:text-blue-600 transition-colors">{getLabel('nav_strategy')}</a>
          <a href="#insights" className="hover:text-blue-600 transition-colors">{getLabel('nav_insights')}</a>
          <a href="#products" className="hover:text-blue-600 transition-colors">{getLabel('nav_performance')}</a>
          <a href="#contact-form" className="hover:text-blue-600 transition-colors">{getLabel('nav_connection')}</a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="hidden md:flex bg-white/5 rounded-2xl p-1 border border-white/10">
            {languages.map(lang => (
              <button key={lang.code} onClick={() => setLanguage(lang.code)} className={`w-10 h-10 rounded-xl text-[8px] font-black transition-all ${language === lang.code ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>{lang.code.toUpperCase()}</button>
            ))}
          </div>

          <div className="relative" ref={dropdownRef}>
            {userProfile ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="bg-blue-600 text-white px-6 lg:px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl flex items-center gap-3"
                >
                  <span className="max-w-[120px] truncate">{userProfile.full_name?.split(' ')[0] || 'Partner'}</span>
                  <svg className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-slate-900 border border-white/10 rounded-3xl shadow-3xl backdrop-blur-2xl overflow-hidden z-[110]"
                    >
                      <div className="p-6 border-b border-white/5 bg-white/5">
                        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Session Protocol</p>
                        <p className="text-xs font-bold text-white truncate">{userProfile.email}</p>
                      </div>
                      
                      <div className="p-2">
                        <button 
                          onClick={() => { setIsDropdownOpen(false); onAdminClick(); }}
                          className="w-full flex items-center gap-4 px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-blue-600 hover:text-white transition-all rounded-2xl group"
                        >
                          <svg className="w-5 h-5 opacity-50 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {userProfile.user_type === 'admin' ? 'Command Center' : 'Área do Cliente'}
                        </button>

                        <Link to="/loja" onClick={() => setIsDropdownOpen(false)} className="w-full flex items-center gap-4 px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/5 hover:text-white transition-all rounded-2xl group">
                          <svg className="w-5 h-5 opacity-50 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          Marketplace
                        </Link>

                        <div className="h-px bg-white/5 my-2"></div>

                        <button 
                          onClick={handleLogoutAction}
                          className="w-full flex items-center gap-4 px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all rounded-2xl group"
                        >
                          <svg className="w-5 h-5 opacity-50 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Encerrar Sessão
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button 
                onClick={onAdminClick} 
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30"
              >
                {getLabel('nav_client_area')}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
