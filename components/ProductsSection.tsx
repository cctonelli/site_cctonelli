
import React from 'react';
import { Product } from '../types';
import { motion } from 'framer-motion';
import { Language, translations } from '../services/i18nService';

interface ProductsSectionProps {
  products: Product[];
  language: Language;
  resolveTranslation: (item: any, field: string, base: string) => string;
}

const ProductsSection: React.FC<ProductsSectionProps> = ({ products, language, resolveTranslation }) => {
  const t = translations[language];

  return (
    <section id="products" className="py-40 bg-white dark:bg-slate-950 relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mb-24">
          <div className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-4">{t.products_badge}</div>
          <h2 className="text-5xl font-serif mb-8 leading-tight dark:text-white text-slate-900">{t.products_title}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-light text-lg leading-relaxed">
            {t.products_subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {(Array.isArray(products) ? products : []).map((product) => (
            <motion.div 
              key={product.id} 
              whileHover={{ y: -10 }}
              className="group relative bg-slate-50 dark:bg-[#050a18] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden transition-all hover:border-blue-500/30 shadow-2xl"
            >
              <div className="grid md:grid-cols-5 h-full">
                <div className="md:col-span-2 relative h-48 md:h-full bg-slate-200 dark:bg-slate-900 overflow-hidden">
                  {product.config?.image_url ? (
                    <img 
                      src={product.config.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700 group-hover:scale-110 transition-transform duration-1000"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                       <div className="text-8xl font-serif italic dark:text-white text-slate-950">CT</div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-50 dark:from-[#050a18] via-transparent to-transparent md:block hidden"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#050a18] via-transparent to-transparent md:hidden block"></div>
                </div>

                <div className="md:col-span-3 p-10 flex flex-col justify-between space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${product.type === 'service' ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-600/20' : 'bg-purple-600/10 text-purple-600 dark:text-purple-400 border border-purple-600/20'}`}>
                        {product.type === 'service' ? 'Executive Service' : 'Digital Asset'}
                      </span>
                      <div className="text-xl font-bold dark:text-white text-slate-900 font-serif">
                        R$ {(product.price || 0).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <h3 className="text-2xl font-serif dark:text-white text-slate-900 group-hover:text-blue-500 transition-colors">
                      {resolveTranslation(product, 'name', product.name)}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 font-light text-sm leading-relaxed line-clamp-3">
                      {resolveTranslation(product, 'description', product.description || '')}
                    </p>
                  </div>
                  
                  <div className="pt-4 flex flex-col gap-4">
                    <button 
                      onClick={() => product.config?.url && window.open(product.config.url, '_blank')}
                      className="w-full bg-blue-600 dark:bg-white text-white dark:text-slate-950 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-500 dark:hover:bg-blue-600 dark:hover:text-white transition-all shadow-xl shadow-blue-600/10 active:scale-95"
                    >
                      {resolveTranslation(product.config, 'action_label', product.config?.action_label || t.products_buy)}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {(!Array.isArray(products) || products.length === 0) && (
             <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem]">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 animate-pulse">Sincronizando Catálogo...</span>
             </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
