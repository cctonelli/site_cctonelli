
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase, logSupabaseError } from '../../services/supabaseService';
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
  const [errorType, setErrorType] = useState<'none' | 'cache' | 'empty' | 'network'>('none');

  const load = async () => {
    setLoading(true);
    setErrorType('none');
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('featured', { ascending: false });
      
      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
          setErrorType('cache');
        } else {
          setErrorType('network');
        }
        return;
      }

      if (!data || data.length === 0) {
        setErrorType('empty');
      } else {
        setProducts(data);
      }
    } catch (err) {
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
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center space-y-8 pt-20">
      <div className="w-24 h-24 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      <span className="text-blue-500 font-black uppercase tracking-widest animate-pulse">Sincronizando Ativos...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-brand-navy pt-32 pb-40 relative">
      <div className="container mx-auto px-6 relative z-10">
        <header className="mb-32 space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-10 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]"></div>
            <div className="text-blue-500 font-black uppercase tracking-[0.5em] text-[10px]">Elite Digital Assets Portfolio</div>
          </div>
          <h1 className="text-6xl md:text-9xl font-serif dark:text-white text-slate-900 leading-[0.85] italic tracking-tighter">
            Arquitetura de <br/><span className="text-blue-600">Soluções.</span>
          </h1>
        </header>

        <AnimatePresence mode="wait">
          {errorType !== 'none' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-40 text-center space-y-10 border border-white/5 rounded-[4rem] bg-slate-900/40">
              <h3 className="text-3xl text-white font-serif italic">Ativos Indisponíveis no Momento</h3>
              <p className="text-slate-500 max-w-lg mx-auto">
                {errorType === 'cache' ? 'O cache do servidor exige sincronia manual (NOTIFY).' : 'Houve uma falha na conexão com o banco central.'}
              </p>
              <button onClick={load} className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Tentar Novamente</button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16">
              {products.map((p, idx) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="group">
                  <Link to={`/loja/${p.slug}`} className="block relative aspect-[4/5] rounded-[3.5rem] overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-2xl mb-10 group-hover:border-blue-600/30 transition-all">
                    {p.image_url ? <img src={p.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-1000" /> : <div className="absolute inset-0 flex items-center justify-center text-7xl font-serif italic text-slate-800">CT</div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-12 left-12 right-12 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <span className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest">Explorar Protocolo</span>
                    </div>
                    {p.slug.includes('v8') && <div className="absolute top-10 left-10 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full z-20">MATRIX EDITION</div>}
                  </Link>
                  <div className="px-6 space-y-4">
                    <h3 className="text-3xl font-serif italic dark:text-white text-slate-900 group-hover:text-blue-600 transition-colors">{resolveTranslation(p, 'title', '')}</h3>
                    <p className="text-slate-500 text-sm font-light italic leading-relaxed line-clamp-2">{resolveTranslation(p, 'subtitle', '')}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StoreGrid;
