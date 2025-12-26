
import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { Language, languages, staticTranslations } from '../services/i18nService';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onAdminClick: () => void;
  userProfile: Profile | null;
  onLogout?: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  labels: Record<string, string>;
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
  const [readProgress, setReadProgress] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const t = staticTranslations[language];

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      setIsScrolled(scrolled > 50);
      
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrolled / totalHeight) * 100;
      setReadProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
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

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${
      isScrolled 
        ? 'bg-white/90 dark:bg-slate-950/80 backdrop-blur-2xl py-3 border-b border-slate-200 dark:border-white/5 shadow-2xl' 
        : 'bg-transparent py-8'
    }`}>
      {/* Read Progress Bar */}
      <div 
        className="absolute bottom-0 left-0 h-[2px] bg-blue-600 transition-all duration-300 ease-out" 
        style={{ width: `${readProgress}%` }}
      />

      <div className="container mx-auto px-6 flex justify-between items-center gap-4">
        
        {/* Brand/Logo */}
        <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={(e) => scrollToSection(e, 'hero')}>
          <div className="w-12 h-12 lg:w-14 lg:h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl lg:text-2xl text-white shadow-xl shadow-blue-600/30 group-hover:scale-105 transition-transform duration-500">CT</div>
          <div className="flex flex-col">
            <span className="text-lg lg:text-xl font-bold tracking-tighter leading-none dark:text-white text-slate-900 uppercase">Claudio Tonelli</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[7px] lg:text-[8px] uppercase tracking-[0.4em] text-slate-500 font-black">Executive Advisory</span>
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
            </div>
          </div>
        </div>
        
        {/* Navigation Links - Centered */}
        <div className="hidden xl:flex items-center space-x-10 text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
          {[
            { id: 'hero', label: labels.nav_strategy || t.nav_strategy },
            { id: 'insights', label: labels.nav_insights || t.nav_insights },
            { id: 'products', label: labels.nav_performance || t.nav_performance },
            { id: 'contact-form', label: labels.nav_connection || t.nav_connection }
          ].map(link => (
            <a 
              key={link.id}
              href={`#${link.id}`} 
              onClick={(e) => scrollToSection(e, link.id)} 
              className="hover:text-blue-600 dark:hover:text-blue-500 transition-colors duration-300 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
            </a>
          ))}
        </div>

        {/* Actions - Right Side */}
        <div className="flex items-center gap-3 lg:gap-6 shrink-0">
          {/* Enhanced Language Selector */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-white/5 rounded-2xl p-1 border border-slate-200 dark:border-white/10">
            {languages.map(lang => (
              <button 
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-[8px] font-black uppercase tracking-widest transition-all duration-500 ${
                  language === lang.code 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lang.code}
              </button>
            ))}
          </div>

          {/* Encryption Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 group cursor-help" title="Conexão Advisory Segura (AES-256)">
             <svg className="w-3 h-3 text-green-500 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
             <span className="text-[7px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-600">Secure</span>
          </div>

          <button onClick={cycleTheme} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-blue-500 transition-all active:scale-95">
             {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'}
          </button>

          <div className="relative group/user">
            <button 
              onClick={onAdminClick}
              className="bg-blue-600 text-white px-5 lg:px-7 py-3 lg:py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30 active:scale-95 flex items-center gap-2"
            >
              {userProfile ? (
                <>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="max-w-[80px] truncate">{userProfile.full_name?.split(' ')[0] || 'Partner'}</span>
                </>
              ) : labels.nav_client_area || t.nav_client_area}
            </button>

            {userProfile && (
              <div className="absolute top-full right-0 mt-4 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[1.5rem] shadow-2xl opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all duration-300 backdrop-blur-3xl transform translate-y-2 group-hover/user:translate-y-0 z-[110]">
                <button onClick={onAdminClick} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                  {userProfile.user_type === 'admin' ? t.nav_admin : t.nav_portal}
                </button>
                <button onClick={onLogout} className="w-full text-left px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500/10 transition-all border-t border-slate-200 dark:border-white/5">
                  {t.nav_logout}
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
