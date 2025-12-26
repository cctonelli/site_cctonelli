
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchProducts, supabase, logSupabaseError } from '../../services/supabaseService';
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
  const [errorType, setErrorType] = useState<'none' | 'cache' | 'empty' | 'network' | 'rls'>('none');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErrorType('none');
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('featured', { ascending: false });
      
      const errorInfo = logSupabaseError('StoreGrid Load', error);
      
      if (errorInfo.isError) {
        setErrorMessage(errorInfo.message);
        if (errorInfo.isMissingTable) {
          setErrorType('cache');
        } else if (errorInfo.isRlsError) {
          setErrorType('rls');
        } else {
          setErrorType('network');
        }
      } else if (!data || data.length === 0) {
        setErrorType('empty');
      } else {
        setProducts(data);
        setErrorType('none');
      }
    } catch (err: any) {
      setErrorMessage(err.message || String(err));
      setErrorType('network');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, []);

  const copyFixCommand = () => {
    const cmd = "NOTIFY pgrst, 'reload schema';";
    navigator.clipboard.writeText(cmd);
    alert("Comando de sincronia copiado! Execute no SQL Editor do Supabase para reativar o catálogo.");
  };

  if (loading) return (
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center space-y-8 pt-20">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-blue-600/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase tracking-[0.5em] text-blue-500 font-black animate-pulse">Sincronizando Advisory Hub</span>
        <p className="text-slate-500 font-serif italic text-sm">Validando ativos de alta performance.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-brand-navy pt-32 pb-40 transition-colors duration-500">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <header className="max-w-5xl mb-32 space-y-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
            <div className="text-blue-500 font-black uppercase tracking-[0.5em] text-[10px]">Elite Digital Assets Portfolio</div>
          </motion.div>
          
          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-6xl md:text-9xl font-serif dark:text-white text-slate-900 leading-[0.85] italic tracking-tighter"
            >
              Arquitetura de <br/><span className="text-blue-600">Soluções.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.2 }} 
              className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-light max-w-3xl leading-relaxed italic border-l border-blue-600/20 pl-10"
            >
              Metodologias exclusivas e ativos de automação desenhados para CEOs que exigem o rigor da Claudio Tonelli Consultoria.
            </motion.p>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {errorType !== 'none' ? (
            <motion.div 
              key="error-state"
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.98 }}
              className="py-24 px-12 text-center border border-slate-200 dark:border-white/5 rounded-[4rem] bg-slate-50 dark:bg-slate-900/40 backdrop-blur-3xl space-y-12 max-w-4xl mx-auto shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>
              
              <div className="relative space-y-8">
                <div className="w-24 h-24 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mx-auto text-blue-600 border border-blue-600/20 shadow-xl">
                   <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-4xl font-serif dark:text-white text-slate-900 italic">Sincronização Necessária</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-lg font-light italic max-w-lg mx-auto leading-relaxed">
                    {errorType === 'cache' 
                      ? 'O catálogo de ativos está em processo de atualização no servidor central.'
                      : `Houve uma interrupção na conexão com o Core Advisory: ${errorMessage || 'Unknown Error'}`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-4">
                  <button 
                    onClick={load} 
                    className="px-14 py-6 bg-blue-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/20 active:scale-95"
                  >
                    Tentar Sincronia
                  </button>
                  {errorType === 'cache' && (
                    <button 
                      onClick={copyFixCommand}
                      className="px-10 py-6 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-white dark:hover:bg-white/5 hover:text-blue-600 transition-all"
                    >
                      Copiar Comando SQL
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-40 text-center border-t border-slate-100 dark:border-white/5"
            >
              <div className="text-slate-400 italic text-2xl font-serif opacity-40">Aguardando a liberação de novos ativos estratégicos...</div>
            </motion.div>
          ) : (
            <motion.div 
              key="grid-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-16"
            >
              {products.map((product, idx) => (
                <motion.div 
                  key={product.id} 
                  initial={{ opacity: 0, y: 40 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  viewport={{ once: true }} 
                  transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} 
                  className="group relative flex flex-col"
                >
                  <Link to={`/loja/${product.slug}`} className="block relative aspect-[4/5] rounded-[3.5rem] overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-2xl transition-all duration-700 hover:shadow-blue-600/20 mb-10">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.title} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000" 
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                        <span className="text-9xl font-serif italic text-slate-200 dark:text-slate-800">CT</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    
                    <div className="absolute bottom-12 left-12 right-12 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                      <span className="inline-block bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-2xl">
                        Explorar Ativo
                      </span>
                    </div>

                    {product.featured && (
                      <div className="absolute top-10 left-10 bg-blue-600 text-white text-[8px] font-black uppercase tracking-[0.4em] px-6 py-2.5 rounded-full shadow-2xl backdrop-blur-md">
                        Strategic Asset
                      </div>
                    )}
                  </Link>

                  <div className="px-6 space-y-6">
                    <div className="space-y-2">
                      <div className="text-blue-500 font-black uppercase tracking-[0.3em] text-[8px]">
                        {product.pricing_type === 'subscription' ? 'Executive Service' : 'Digital License'}
                      </div>
                      <h3 className="text-3xl font-serif dark:text-white text-slate-900 italic leading-tight group-hover:text-blue-600 transition-colors">
                        {resolveTranslation(product, 'title', '')}
                      </h3>
                    </div>
                    
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-light leading-relaxed line-clamp-2 italic">
                      {resolveTranslation(product, 'subtitle', '')}
                    </p>

                    <div className="pt-4 flex items-center justify-between">
                       <Link to={`/loja/${product.slug}`} className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white group-hover:text-blue-600 transition-all border-b-2 border-slate-200 dark:border-white/5 group-hover:border-blue-600 pb-1">
                          Ver Detalhes
                       </Link>
                       <div className="w-10 h-[1px] bg-slate-200 dark:bg-white/10"></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StoreGrid;
