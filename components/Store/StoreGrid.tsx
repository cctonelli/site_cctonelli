
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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

  useEffect(() => {
    fetchProducts(true).then(data => {
      setProducts(data);
      setLoading(false);
    });
    window.scrollTo(0, 0);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 pt-20">
      <div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin"></div>
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Iniciando Hub de Soluções...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-brand-navy pt-32 pb-24 transition-colors">
      <div className="container mx-auto px-6">
        <header className="max-w-3xl mb-24 space-y-6">
          <div className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">Corporate Solutions Hub</div>
          <h1 className="text-5xl md:text-7xl font-serif dark:text-white text-slate-900 leading-tight italic">
            Loja de Excelência <br/>Digital.
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-xl leading-relaxed italic border-l-2 border-blue-600/30 pl-8">
            Ferramentas proprietárias e serviços estratégicos arquitetados para escalabilidade e rigor metodológico.
          </p>
        </header>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          {products.map((product) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -10 }}
              className="group bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-2xl transition-all hover:border-blue-600/30"
            >
              <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-950 overflow-hidden relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80 group-hover:opacity-100" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <span className="text-6xl font-serif italic text-white">CT</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-900/80 via-transparent to-transparent"></div>
                {product.featured && (
                  <div className="absolute top-6 right-6 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xl">
                    Featured Asset
                  </div>
                )}
              </div>

              <div className="p-10 space-y-6">
                <div>
                  <h3 className="text-2xl font-serif dark:text-white text-slate-900 group-hover:text-blue-600 transition-colors leading-tight mb-2">
                    {resolveTranslation(product, 'title', '')}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-light leading-relaxed line-clamp-2 italic">
                    {resolveTranslation(product, 'subtitle', '')}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Modelo</span>
                    <span className="text-[10px] font-bold dark:text-white text-slate-900 uppercase">
                      {product.pricing_type === 'subscription' ? 'Assinatura' : 
                       product.pricing_type === 'one_time' ? 'Compra Única' :
                       product.pricing_type === 'free' ? 'Gratuito' : 'Sob Demanda'}
                    </span>
                  </div>
                  <Link 
                    to={`/loja/${product.slug}`}
                    className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/10 active:scale-95"
                  >
                    Saiba Mais
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoreGrid;
