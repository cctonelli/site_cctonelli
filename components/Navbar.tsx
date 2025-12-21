
import React, { useState, useEffect } from 'react';
import { Profile } from '../types';

interface NavbarProps {
  onAdminClick: () => void;
  userProfile: Profile | null;
}

const Navbar: React.FC<NavbarProps> = ({ onAdminClick, userProfile }) => {
  const [isScrolled, setIsScrolled] = useState(false);

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
        <div className="flex items-center gap-3 group cursor-pointer">
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

        <button 
          onClick={onAdminClick}
          className="bg-white text-slate-950 px-8 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95 flex items-center gap-3"
        >
          {userProfile ? (
            <>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {userProfile.user_type === 'admin' ? 'Painel Admin' : 'Meu Portal'}
            </>
          ) : 'Área do Cliente'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
