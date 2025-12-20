
import React, { useState, useEffect } from 'react';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-950/80 backdrop-blur-md py-4 border-b border-white/10' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">CT</div>
          <span className="text-xl font-bold tracking-tight hidden sm:inline">
            <span className="text-blue-500">Claudio</span> Tonelli <span className="text-slate-500 font-light">Consultoria</span>
          </span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium uppercase tracking-widest text-slate-300">
          <a href="#hero" className="hover:text-blue-400 transition-colors">Home</a>
          <a href="#insights" className="hover:text-blue-400 transition-colors">Insights</a>
          <a href="#metrics" className="hover:text-blue-400 transition-colors">Resultados</a>
          <a href="#contact" className="hover:text-blue-400 transition-colors">Contato</a>
        </div>

        <button className="bg-white text-slate-950 px-6 py-2 rounded-full font-bold text-sm hover:bg-blue-500 hover:text-white transition-all shadow-xl shadow-white/5">
          Área do Cliente
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
