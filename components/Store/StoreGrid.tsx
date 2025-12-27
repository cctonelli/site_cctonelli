
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../../services/supabaseService';
import { Product } from '../../types';
import { Language } from '../../services/i18nService';

interface StoreGridProps {
  language: Language;
  t: any;
  resolveTranslation: (item: any, field: string, fallbackKey: string) => string;
}

const StoreGrid: React.FC<StoreGridProps> = ({ language, t, resolveTranslation }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    // Fix: fetchProducts does not accept arguments in its current definition
    const data = await fetchProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center space-y-8">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-blue-600/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <span className="text-blue-500 font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">Sincronizando Core Advisory...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-brand-navy pt-40 pb-40 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-blue-600/5 blur-[180px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <header className="mb-32 space-y-10 max-w-5xl">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]"></div>
            <div className="text-blue-500 font-black uppercase tracking-[0.5em] text-[10px]">Strategic Solutions Portfolio</div>
          </motion.div>
          
          <div className="space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-6xl md:text-[9.5rem] font-serif dark:text-white text-slate-900 leading-[0.85] italic tracking-tighter"
            >
              Arquitetura de <br/><span className="text-blue-600">Performance.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-light max-w-3xl leading-relaxed italic border-l-2 border-blue-600/20 pl-10"
            >
              Explore o ecossistema V8 MATRIX e outras metodologias proprietárias desenhadas para o rigor da Claudio Tonelli Consultoria.
            </motion.p>
          </div>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16">
          {products.map((p, idx) => {
            const isMatrix = p.slug.toLowerCase().includes('v8') || p.slug.toLowerCase().includes('matrix');
            
            return (
              <motion.div 
                key={p.id} 
                initial={{ opacity: 0, y: 40 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: idx * 0.1 }}
                className="group"
              >
                <Link 
                  to={`/loja/${p.slug}`} 
                  className={`block relative aspect-[4/5] rounded-[4rem] overflow-hidden bg-slate-100 dark:bg-slate-900 border transition-all duration-700 hover:shadow-2xl hover:shadow-blue-600/20 mb-10 ${isMatrix ? 'border-blue-600/40 shadow-blue-600/10' : 'border-slate-200 dark:border-white/5 shadow-xl'}`}
                >
                  {isMatrix && <div className="scanline opacity-20"></div>}
                  
                  {p.image_url ? (
                    <img 
                      src={p.image_url} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" 
                      alt={p.title}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-950">
                      <span className={`text-9xl font-serif italic ${isMatrix ? 'text-blue-600/20 glitch-text' : 'text-slate-200 dark:text-slate-800'}`}>CT</span>
                    </div>
                  )}
                  
                  <div className="absolute bottom-12 left-12 right-12 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                    <span className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl">
                      Desbloquear Protocolo
                    </span>
                  </div>

                  {isMatrix && (
                    <div className="absolute top-10 left-10 bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.4em] px-8 py-3 rounded-full z-30 shadow-2xl backdrop-blur-md animate-pulse">
                      MATRIX EDITION
                    </div>
                  )}
                </Link>
                
                <div className="px-6 space-y-4">
                  <div className={`text-[9px] font-black uppercase tracking-[0.4em] ${isMatrix ? 'text-blue-500' : 'text-slate-400'}`}>
                    {p.pricing_type === 'subscription' ? 'Executive Subscription' : 'Digital Asset License'}
                  </div>
                  <h3 className="text-4xl font-serif italic dark:text-white text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                    {resolveTranslation(p, 'title', '')}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-base font-light italic leading-relaxed line-clamp-2">
                    {resolveTranslation(p, 'subtitle', '')}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StoreGrid;
