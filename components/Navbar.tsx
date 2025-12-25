
import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { Language, translations } from '../services/i18nService';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onAdminClick: () => void;
  userProfile: Profile | null;
  onLogout?: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  labels: {
    strategy: string;
    insights: string;
    performance: string;
    connection: string;
    client_area: string;
  };
}

const Navbar: React.FC<NavbarProps> = ({ 
  onAdminClick, 
  userProfile, 
  onLogout, 
  language, 
  setLanguage,
  theme,
  setTheme,
  labels
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const t = translations[language];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    // Se não estivermos na home, primeiro navegamos para ela
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'pt', label: 'PT' },
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' }
  ];

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const ThemeIcon = () => {
    if (theme === 'dark') return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
    if (theme === 'light') return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" /></svg>;
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${isScrolled ? 'bg-white/95 dark:bg-slate-950/90 backdrop-blur-2xl py-3 border-b border-slate-200 dark:border-white/5 shadow-2xl' : 'bg-transparent py-8'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center gap-4">
        {/* Brand/Logo */}
        <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={(e) => scrollToSection(e, 'hero')}>
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl lg:text-2xl text-white shadow-xl shadow-blue-600/30 group-hover:scale-105 transition-transform duration-500">CT</div>
          <div className="flex flex-col">
            <span className="text-lg lg:text-xl font-bold tracking-tighter leading-none dark:text-white text-slate-900 uppercase">Claudio Tonelli</span>
            <span className="text-[7px] lg:text-[9px] uppercase tracking-[0.4em] text-slate-500 font-black mt-1">Executive Advisory</span>
          </div>
        </div>
        
        {/* Navigation Links - Centered */}
        <div className="hidden xl:flex items-center space-x-8 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          <a href="#hero" onClick={(e) => scrollToSection(e, 'hero')} className="hover:text-blue-500 transition-colors duration-300">{labels.strategy}</a>
          <a href="#insights" onClick={(e) => scrollToSection(e, 'insights')} className="hover:text-blue-500 transition-colors duration-300">{labels.insights}</a>
          <a href="#products" onClick={(e) => scrollToSection(e, 'products')} className="hover:text-blue-500 transition-colors duration-300">{labels.performance}</a>
          <a href="#contact-form" onClick={(e) => scrollToSection(e, 'contact-form')} className="hover:text-blue-500 transition-colors duration-300">{labels.connection}</a>
        </div>

        {/* Actions - Right Side */}
        <div className="flex items-center gap-3 lg:gap-6 shrink-0">
          {/* Active Language Switcher - More Compact */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-white/5 rounded-full p-1 border border-slate-200 dark:border-white/10 shadow-inner">
            {languages.map(lang => (
              <button 
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-full text-[8px] font-black uppercase tracking-widest transition-all duration-300 ${
                  language === lang.code 
                    ? 'bg-blue-600 text-white shadow-lg scale-105' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <button onClick={cycleTheme} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-blue-500 transition-all active:scale-95">
            <ThemeIcon />
          </button>

          <div className="relative group/user">
            <button 
              onClick={onAdminClick}
              className="bg-blue-600 text-white px-5 lg:px-7 py-3 lg:py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30 active:scale-95 flex items-center gap-2"
            >
              {userProfile ? (
                <>
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="max-w-[80px] truncate">{userProfile.full_name?.split(' ')[0] || 'Executivo'}</span>
                </>
              ) : labels.client_area}
            </button>

            {userProfile && (
              <div className="absolute top-full right-0 mt-4 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[1.5rem] shadow-2xl opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all duration-300 backdrop-blur-3xl transform translate-y-2 group-hover/user:translate-y-0 z-[110]">
                <button onClick={onAdminClick} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  {userProfile.user_type === 'admin' ? translations[language].nav_admin : translations[language].nav_portal}
                </button>
                <button onClick={onLogout} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500/10 transition-all border-t border-slate-200 dark:border-white/5">
                  {translations[language].nav_logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
