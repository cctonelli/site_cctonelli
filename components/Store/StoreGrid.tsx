
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
      // Direct check for connectivity/schema first to provide better diagnostic if empty
      const { data, error } = await supabase.from('products').select('*').eq('is_active', true).order('featured', { ascending: false });
      
      const errorInfo = logSupabaseError('StoreGrid Load', error);
      
      if (errorInfo.isError) {
        console.error("Store Fetch Error Detail:", errorInfo.message, errorInfo.code);
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
      console.error("Critical Store Error:", err.message || err);
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

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-brand-navy flex flex-col items-center justify-center space-y-4 pt-20 transition-colors duration-500">
      <div className="relative">
        <div className="w-16 h-16 border-t-2 border-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-[8px] text-blue-600 uppercase tracking-tighter">CT</div>
      </div>
      <span className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-black animate-pulse">Arquitetando Portfólio de Soluções...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-brand-navy pt-32 pb-24 transition-colors relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <header className="max-w-4xl mb-24 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">Strategic Solutions Architecture</div>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-9xl font-serif dark:text-white text-slate-900 leading-[0.9] italic tracking-tighter"
          >
            Hub de <br/><span className="text-blue-600">Excelência.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-light max-w-2xl leading-relaxed italic border-l border-blue-600/20 pl-8"
          >
            Ativos digitais e metodologias exclusivas desenhadas para CEOs que exigem o rigor e a precisão da Claudio Tonelli Consultoria.
          </motion.p>
        </header>

        {errorType !== 'none' && errorType !== 'empty' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-24 text-center border border-white/10 rounded-[4rem] bg-slate-900/40 backdrop-blur-3xl space-y-8 max-w-4xl mx-auto shadow-2xl"
          >
             <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-500/20 shadow-inner">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
             <div className="space-y-3 px-8">
               <h3 className="text-3xl font-serif text-white italic">Protocolo de Dados Interrompido</h3>
               <p className="text-slate-500 text-sm max-w-md mx-auto font-light leading-relaxed">
                 {errorType === 'cache' 
                   ? 'O cache do servidor PostgREST exige sincronização manual (PGRST205). O administrador foi notificado para o Schema Reload.'
                   : errorType === 'rls' 
                   ? 'Bloqueio de Segurança: Acesso negado às políticas RLS da tabela de produtos.'
                   : `Não foi possível estabelecer conexão segura com o Advisory Core: ${errorMessage || 'Erro de Rede'}`}
               </p>
             </div>
             <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
               <button onClick={load} className="px-12 py-5 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                 Nova Sincronização
               </button>
               <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors border-b border-white/5 hover:border-white/20 pb-1">Retornar ao Dashboard</Link>
             </div>
          </motion.div>
        ) : products.length === 0 ? (
          <div className="py-40 text-center text-slate-500 italic text-xl font-serif border-t border-slate-100 dark:border-white/5 animate-pulse">
            Aguardando a liberação de novos ativos estratégicos...
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {products.map((product, idx) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -15 }}
                className="group bg-slate-50 dark:bg-[#050a18] border border-slate-200 dark:border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl transition-all duration-700 hover:border-blue-600/40"
              >
                <div className="aspect-[16/11] bg-slate-200 dark:bg-slate-950 overflow-hidden relative">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.title} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000 ease-out" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <span className="text-8xl font-serif italic text-slate-900 dark:text-white">CT</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#050a18] via-transparent to-transparent"></div>
                  
                  {product.featured && (
                    <div className="absolute top-8 right-8 bg-blue-600 text-white text-[8px] font-black uppercase tracking-[0.3em] px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md">
                      Strategic Asset
                    </div>
                  )}
                </div>

                <div className="p-12 space-y-8">
                  <div className="space-y-3">
                    <h3 className="text-3xl font-serif dark:text-white text-slate-900 group-hover:text-blue-600 transition-colors leading-[1.1] italic">
                      {resolveTranslation(product, 'title', '')}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-light leading-relaxed line-clamp-3 italic">
                      {resolveTranslation(product, 'subtitle', '')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-8 border-t border-slate-200 dark:border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">Modelo Advisory</span>
                      <span className="text-[10px] font-bold dark:text-white text-slate-900 uppercase tracking-widest">
                        {product.pricing_type === 'subscription' ? 'Executive Access' : 
                        product.pricing_type === 'one_time' ? 'Digital Ownership' :
                        product.pricing_type === 'free' ? 'Open Resource' : 'Tailor Made'}
                      </span>
                    </div>
                    <Link 
                      to={`/loja/${product.slug}`}
                      className="bg-blue-600 text-white px-10 py-4.5 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/20 active:scale-95 flex items-center gap-3 group/btn"
                    >
                      SAIBA MAIS
                      <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreGrid;
