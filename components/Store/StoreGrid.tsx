
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../../services/supabaseService';
import { Product } from '../../types';
import { Language } from '../../services/i18nService';
import MatrixRain from '../MatrixRain';

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
    try {
      const data = await fetchProducts();
      setProducts(data || []);
    } catch (e) {
      console.error("Store Load Error:", e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#010309] flex flex-col items-center justify-center space-y-8">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-blue-600/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <p className="text-blue-500 font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">Sincronizando Vitrine Elite...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#010309] pt-40 pb-40 relative overflow-hidden transition-colors duration-500">
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
              Explore ativos digitais e metodologias proprietárias desenhadas para o rigor da Claudio Tonelli Consultoria.
            </motion.p>
          </div>
        </header>

        {products.length === 0 ? (
          <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] text-slate-600 font-black uppercase tracking-[0.5em] text-[10px] space-y-6">
            <p>Protocolo de Dados Interrompido.</p>
            <button onClick={load} className="text-blue-500 underline decoration-blue-500/30 hover:text-white transition-colors">REINICIAR SINCRONIA</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16">
            {products.map((p, idx) => {
              const isMatrix = p.slug.includes('v8') || p.slug.includes('matrix');
              const accentColor = isMatrix ? '#00ff41' : '#2563eb';

              return (
                <motion.div 
                  key={p.id} 
                  initial={{ opacity: 0, y: 40 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: idx * 0.1, duration: 0.8 }}
                  className="group relative"
                >
                  <Link 
                    to={`/loja/${p.slug}`} 
                    className={`block relative aspect-[4/5] rounded-[4rem] overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 transition-all duration-700 hover:shadow-2xl hover:border-current group-hover:shadow-[0_20px_100px_-20px_rgba(0,0,0,0.5)] mb-10`}
                    style={{ borderColor: 'transparent' }}
                  >
                    {isMatrix && (
                       <div className="absolute inset-0 z-0">
                          <MatrixRain color="#00ff41" opacity={0.1} fontSize={10} speed={0.5} />
                       </div>
                    )}
                    
                    {p.image_url ? (
                      <img src={p.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" alt={p.title} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-950">
                        <span className="text-9xl font-serif italic text-slate-200 dark:text-slate-800">CT</span>
                      </div>
                    )}
                    
                    {p.featured && (
                      <div className="absolute top-10 left-10 z-20">
                         <span className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[8px] font-black uppercase tracking-[0.4em]">ATIVO_DE_ELITE</span>
                      </div>
                    )}

                    <div className="absolute bottom-12 left-12 right-12 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 z-30">
                      <button 
                        className="w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all"
                        style={{ backgroundColor: accentColor, color: isMatrix ? '#000' : '#fff' }}
                      >
                        SAIBA MAIS
                      </button>
                    </div>
                  </Link>
                  <div className="px-6 space-y-4">
                    <div className="flex justify-between items-center">
                       <div className="text-[9px] font-black uppercase tracking-[0.4em]" style={{ color: accentColor }}>{p.pricing_type}</div>
                       {isMatrix && <div className="text-[9px] font-black uppercase tracking-widest text-green-500 animate-pulse">PROTOCOL_MATRIX</div>}
                    </div>
                    <h3 className="text-4xl font-serif italic dark:text-white text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{resolveTranslation(p, 'title', '')}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-base font-light italic leading-relaxed line-clamp-2">{resolveTranslation(p, 'subtitle', '')}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreGrid;
