
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const WorkInProgress: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 space-y-8 max-w-2xl"
      >
        <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto text-blue-500 border border-blue-500/20 mb-4 animate-pulse">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        
        <h1 className="text-4xl lg:text-6xl font-serif text-white italic leading-tight">
          Estamos trabalhando à todo vapor no desenvolvimento desta página!
        </h1>
        
        <p className="text-slate-400 text-lg font-light italic max-w-md mx-auto">
          Nossa equipe de estratégia está arquitetando um conteúdo exclusivo para este setor. Volte em breve.
        </p>

        <div className="pt-8">
          <Link 
            to="/" 
            className="inline-block bg-blue-600 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30 active:scale-95"
          >
            Retornar à Página Principal
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default WorkInProgress;
