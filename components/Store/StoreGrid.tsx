import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchProducts, supabase } from '../../services/supabaseService';
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
      const data = await fetchProducts(true);
      if (!data || data.length === 0) {
        const { error } = await supabase.from('products').select('id').limit(1);
        if (error) {
           console.error("Store Fetch Error:", error);
           if (error.code === 'PGRST205' || error.message.includes('cache') || error.message.includes('relation')) {
             setErrorType('cache');
           } else {
             setErrorType('network');
           }
        } else {
           setErrorType('empty');
        }
      } else {
        setProducts(data);
        setErrorType('none');
      }
    } catch (err) {
      console.error("Critical Store Error:", err);
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
    <div className="min-h-screen bg-white dark:bg-brand-navy flex flex-col items-center justify-center space-y-4 pt-20">
      <div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin"></div>
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Arquitetando Portfólio de Soluções...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-brand-navy pt-32 pb-24 transition-colors relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <header className="max-w-3xl mb-24 space-y-6">
          <div className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">Solutions Architecture Hub</div>
          <h1 className="text-5xl md:text-8xl font-serif dark:text-white text-slate-900 leading-tight italic">
            Hub de <br/>Excelência.
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-xl leading-relaxed italic border-l-2 border-blue-600/30 pl-8 transition-all">
            Ferramentas proprietárias arquitetadas para CEOs que buscam o rigor metodológico da Claudio Tonelli Consultoria.
          </p>
        </header>

        {errorType !== 'none' && errorType !== 'empty' ? (
          <div className="py-24 text-center border-2 border-dashed border-red-500/20 rounded-[3rem] bg-red-500/5 space-y-8 max-w-4xl mx-auto backdrop-blur-3xl">
             <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse border border-red-500/20">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
             <div className="space-y-2 px-8">
               <h3 className="text-2xl font-serif text-slate-900 dark:text-white italic">Protocolo de Dados Interrompido</h3>
               <p className="text-slate-500 text-sm max-w-md mx-auto">
                 {errorType === 'cache' 
                   ? 'O cache do servidor PostgREST está desatualizado (PGRST205). O administrador precisa executar "reload schema" no painel Supabase.'
                   : 'Não foi possível estabelecer conexão segura com o Advisory Core neste momento.'}
               </p>
             </div>
             <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
               <button onClick={load} className="px-10 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                 Nova Sincronização
               </button>
               <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">Voltar para Dashboard</Link>
             </div>
          </div>
        ) : products.length === 0 ? (
          <div className="py-32 text-center text-slate-500 italic text-xl font-serif border-t border-slate-100 dark:border-white/5">
            Aguardando a liberação de novos ativos estratégicos para o seu perfil.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            {products.map((product) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="group bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-2xl transition-all hover:border-blue-600/30"
              >
                <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-950 overflow-hidden relative">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80 group-hover:opacity-100" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <span className="text-6xl font-serif italic text-slate-900 dark:text-white">CT</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-900/80 via-transparent to-transparent"></div>
                  {product.featured && (
                    <div className="absolute top-6 right-6 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xl">
                      Featured Strategy
                    </div>
                  )}
                </div>

                <div className="p-10 space-y-6">
                  <div>
                    <h3 className="text-2xl font-serif dark:text-white text-slate-900 group-hover:text-blue-600 transition-colors leading-tight mb-2 italic">
                      {resolveTranslation(product, 'title', '')}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-light leading-relaxed line-clamp-2 italic">
                      {resolveTranslation(product, 'subtitle', '')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Modelo Delivery</span>
                      <span className="text-[10px] font-bold dark:text-white text-slate-900 uppercase">
                        {product.pricing_type === 'subscription' ? 'Executive Service' : 
                        product.pricing_type === 'one_time' ? 'Strategic Asset' :
                        product.pricing_type === 'free' ? 'Open Resource' : 'Under Demand'}
                      </span>
                    </div>
                    <Link 
                      to={`/loja/${product.slug}`}
                      className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/10 active:scale-95"
                    >
                      Acessar
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