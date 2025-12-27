
import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { Language, languages } from '../services/i18nService';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchSiteConfig } from '../services/supabaseService';

interface NavbarProps {
  onAdminClick: () => void;
  userProfile: Profile | null;
  onLogout?: () => void;
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
  const location = useLocation();
  const navigate = useNavigate();
  const config = fetchSiteConfig();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getLabel = (key: string) => config.menus[key][language] || config.menus[key]['pt'];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${isScrolled ? 'bg-slate-950/80 backdrop-blur-2xl py-4 border-b border-white/5 shadow-2xl' : 'bg-transparent py-10'}`}>
      <div className="container mx-auto px-10 flex justify-between items-center">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-2xl group-hover:scale-105 transition-all">CT</div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tighter leading-none dark:text-white text-slate-900 uppercase">Claudio Tonelli</span>
            <span className="text-[8px] uppercase tracking-[0.4em] text-slate-500 font-black mt-1">Executive Advisory</span>
          </div>
        </div>
        
        <div className="hidden xl:flex items-center space-x-12 text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">
          <a href="#hero" className="hover:text-blue-600 transition-colors">{getLabel('nav_strategy')}</a>
          <a href="#insights" className="hover:text-blue-600 transition-colors">{getLabel('nav_insights')}</a>
          <a href="#products" className="hover:text-blue-600 transition-colors">{getLabel('nav_performance')}</a>
          <a href="#contact-form" className="hover:text-blue-600 transition-colors">{getLabel('nav_connection')}</a>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex bg-white/5 rounded-2xl p-1 border border-white/10">
            {languages.map(lang => (
              <button key={lang.code} onClick={() => setLanguage(lang.code)} className={`w-10 h-10 rounded-xl text-[8px] font-black transition-all ${language === lang.code ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>{lang.code.toUpperCase()}</button>
            ))}
          </div>
          <button onClick={onAdminClick} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30">
            {userProfile ? userProfile.full_name?.split(' ')[0] : getLabel('nav_client_area')}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
