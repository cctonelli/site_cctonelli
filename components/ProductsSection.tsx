
import React from 'react';
import { Product } from '../types';

interface ProductsSectionProps {
  products: Product[];
}

const ProductsSection: React.FC<ProductsSectionProps> = ({ products }) => {
  return (
    <section id="products" className="py-32 bg-slate-950">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-serif mb-4">Soluções e Serviços</h2>
          <p className="text-slate-400 font-light max-w-2xl mx-auto">
            Acelere sua transformação com nossos produtos digitais e workshops exclusivos desenvolvidos para a elite executiva.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="bg-slate-900/40 border border-white/5 p-8 rounded-3xl hover:border-blue-500/50 transition-all group reveal"
            >
              <div className="flex justify-between items-start mb-8">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${product.type === 'service' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                  {product.type === 'service' ? 'Mentoria / Workshop' : 'Produto Digital'}
                </div>
                <div className="text-2xl font-bold text-white">
                  R$ {product.price.toLocaleString('pt-BR')}
                </div>
              </div>
              
              <h3 className="text-2xl font-serif mb-4 group-hover:text-blue-400 transition-colors">
                {product.name}
              </h3>
              <p className="text-slate-400 font-light mb-8 leading-relaxed">
                {product.description}
              </p>
              
              <div className="space-y-4">
                <button className="w-full bg-white text-slate-950 py-4 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all btn-premium">
                  Adquirir Agora
                </button>
                <button className="w-full bg-transparent border border-white/10 text-white py-4 rounded-xl font-bold hover:bg-white/5 transition-all">
                  Saiba Mais
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
