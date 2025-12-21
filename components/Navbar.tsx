
import React, { useState, useEffect } from 'react';
import { Profile } from '../types';

interface NavbarProps {
  onAdminClick: () => void;
  userProfile: Profile | null;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAdminClick, userProfile, onLogout }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-slate-950/80 backdrop-blur-xl py-4 border-b border-white/5 shadow-2xl shadow-blue-500/5' : 'bg-transparent py-8'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0})}>
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl shadow-xl shadow-blue-600/30 group-hover:scale-105 transition-transform">CT</div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tighter leading-none text-white">
              Claudio Tonelli
            </span>
            <span className="text-[9px] uppercase tracking-[0.4em] text-slate-500 font-bold mt-1">Consultoria Executive</span>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center space-x-12 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
          <a href="#hero" className="hover:text-white transition-colors">Estratégia</a>
          <a href="#insights" className="hover:text-white transition-colors">Insights</a>
          <a href="#metrics" className="hover:text-white transition-colors">Performance</a>
          <a href="#contact" className="hover:text-white transition-colors">Conexão</a>
        </div>

        <div className="relative">
          <button 
            onClick={onAdminClick}
            className="bg-white text-slate-950 px-8 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95 flex items-center gap-3 group"
          >
            {userProfile ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="max-w-[100px] truncate">{userProfile.full_name?.split(' ')[0] || 'Membro'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            ) : 'Área do Cliente'}
          </button>

          {userProfile && (
            <div className="absolute top-full right-0 mt-4 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden opacity-0 invisible hover:opacity-100 hover:visible group-hover:opacity-100 group-hover:visible transition-all">
              <button 
                onClick={onAdminClick}
                className="w-full text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white transition-all"
              >
                {userProfile.user_type === 'admin' ? 'Dashboard Admin' : 'Meu Portal'}
              </button>
              <button 
                onClick={onLogout}
                className="w-full text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all border-t border-white/5"
              >
                Encerrar Sessão
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
