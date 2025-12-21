
import React from 'react';
import { Product } from '../types';
import { motion } from 'framer-motion';

interface ProductsSectionProps {
  products: Product[];
}

const ProductsSection: React.FC<ProductsSectionProps> = ({ products }) => {
  return (
    <section id="products" className="py-40 bg-slate-950 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mb-24 reveal">
          <div className="text-blue-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-4">Portfólio de Soluções</div>
          <h2 className="text-5xl font-serif mb-8 leading-tight">Engenharia de <br/><span className="italic text-slate-500">Valor Exponencial.</span></h2>
          <p className="text-slate-400 font-light text-lg leading-relaxed">
            Acelere sua jornada estratégica com produtos digitais e mentorias exclusivas, desenhadas para o topo da pirâmide corporativa.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {products.map((product) => (
            <motion.div 
              key={product.id} 
              whileHover={{ y: -10 }}
              className="group relative bg-[#050a18] border border-white/5 rounded-[2.5rem] overflow-hidden reveal transition-all hover:border-blue-500/30 shadow-2xl"
            >
              <div className="grid md:grid-cols-5 h-full">
                {/* Visual Side */}
                <div className="md:col-span-2 relative h-48 md:h-full bg-slate-900 overflow-hidden">
                  {product.config.image_url ? (
                    <img 
                      src={product.config.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700 group-hover:scale-110 transition-transform duration-1000"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                       <div className="text-8xl font-serif italic text-white">CT</div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#050a18] via-transparent to-transparent md:block hidden"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050a18] via-transparent to-transparent md:hidden block"></div>
                </div>

                {/* Content Side */}
                <div className="md:col-span-3 p-10 flex flex-col justify-between space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${product.type === 'service' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'bg-purple-600/10 text-purple-400 border border-purple-600/20'}`}>
                        {product.type === 'service' ? 'Mentoria / Workshop' : 'Produto Digital'}
                      </span>
                      <div className="text-xl font-bold text-white font-serif">
                        R$ {product.price.toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <h3 className="text-2xl font-serif text-white group-hover:text-blue-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-slate-400 font-light text-sm leading-relaxed line-clamp-3">
                      {product.description}
                    </p>
                  </div>
                  
                  <div className="pt-4 flex flex-col gap-4">
                    <button 
                      onClick={() => product.config.url && window.open(product.config.url, '_blank')}
                      className="w-full bg-white text-slate-950 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-white/5 btn-premium active:scale-95"
                    >
                      {product.config.action_label || 'Aderir Agora'}
                    </button>
                    {product.config.url && (
                      <div className="text-[9px] text-center uppercase tracking-widest text-slate-600 font-bold">
                        Acesso Imediato via Portal Seguro
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
