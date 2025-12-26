import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchProductBySlug, fetchProductVariants, fetchProductContentBlocks } from '../../services/supabaseService';
import { Product, ProductVariant, ProductContentBlock } from '../../types';
import { Language } from '../../services/i18nService';

interface ProductPageProps {
  language: Language;
  t: any;
  resolveTranslation: (item: any, field: string, fallbackKey: string) => string;
}

const ProductPage: React.FC<ProductPageProps> = ({ language, t, resolveTranslation }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [blocks, setBlocks] = useState<ProductContentBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      fetchProductBySlug(slug).then(async (data) => {
        if (!data) { navigate('/loja'); return; }
        setProduct(data);
        const [v, b] = await Promise.all([
          fetchProductVariants(data.id),
          fetchProductContentBlocks(data.id)
        ]);
        setVariants(v);
        setBlocks(b);
        setLoading(false);
      }).catch(err => {
        console.error("Error fetching product data:", err);
        setLoading(false);
      });
      window.scrollTo(0, 0);
    }
  }, [slug, navigate]);

  if (loading || !product) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin"></div>
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Desenhando Solução...</span>
    </div>
  );

  const renderBlock = (block: ProductContentBlock) => {
    const { content } = block;
    switch (block.block_type) {
      case 'hero':
        return (
          <section key={block.id} className="py-24 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="max-w-4xl mx-auto text-center space-y-8 px-6">
               <h2 className="text-5xl md:text-7xl font-serif dark:text-white text-slate-900 leading-tight italic">
                 {content.title || product.title}
               </h2>
               <p className="text-xl text-slate-500 dark:text-slate-400 font-light italic leading-relaxed max-w-2xl mx-auto border-l-2 border-blue-600/30 pl-8 text-left">
                 {content.subtitle || product.subtitle}
               </p>
            </div>
            {content.video_url && (
              <div className="aspect-video max-w-5xl mx-auto rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 relative bg-black">
                 <iframe 
                   src={content.video_url} 
                   className="w-full h-full" 
                   frameBorder="0" 
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                   allowFullScreen
                 />
              </div>
            )}
          </section>
        );
      case 'text':
        return (
          <section key={block.id} className="py-16 max-w-4xl mx-auto px-6">
             <div 
               className="prose prose-2xl prose-blue dark:prose-invert font-light italic leading-relaxed text-slate-700 dark:text-slate-300"
               dangerouslySetInnerHTML={{ __html: content.html }}
             />
          </section>
        );
      case 'video':
        return (
          <section key={block.id} className="py-24 container mx-auto px-6">
             <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
               <h3 className="text-3xl font-serif italic dark:text-white text-slate-900">{content.label || 'Demonstração Executiva'}</h3>
               <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
             </div>
             <div className="aspect-video max-w-5xl mx-auto rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 bg-black">
                <iframe src={content.url || content.video_url} className="w-full h-full" allowFullScreen />
             </div>
          </section>
        );
      case 'image_gallery':
        return (
          <section key={block.id} className="py-24 container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.images?.map((img: string, i: number) => (
              <div key={i} className="rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[4/3] border border-white/5 bg-slate-900 group">
                <img src={img} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700 group-hover:scale-105 transition-transform" />
              </div>
            ))}
          </section>
        );
      case 'faq':
        return (
          <section key={block.id} className="py-24 max-w-4xl mx-auto px-6 space-y-12">
            <h3 className="text-4xl font-serif italic dark:text-white text-slate-900 text-center">Dúvidas Estratégicas</h3>
            <div className="grid gap-6">
              {content.items?.map((item: any, i: number) => (
                <details key={i} className="group bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden transition-all">
                  <summary className="p-8 cursor-pointer list-none flex justify-between items-center font-serif text-xl italic dark:text-white text-slate-900">
                    {item.question}
                    <span className="text-blue-500 group-open:rotate-180 transition-transform">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </summary>
                  <div className="p-8 pt-0 text-slate-500 dark:text-slate-400 font-light leading-relaxed border-t border-slate-200 dark:border-white/5 italic">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>
        );
      case 'comparison':
        return (
          <section key={block.id} id="pricing" className="py-32 bg-slate-50 dark:bg-slate-900/20 rounded-[4rem] transition-colors duration-500 my-24 border-y border-slate-200 dark:border-white/5">
            <div className="container mx-auto px-6">
              <div className="text-center mb-20 space-y-4">
                <div className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">Investment Structure</div>
                <h3 className="text-4xl md:text-5xl font-serif dark:text-white text-slate-900 italic">Estruturas de Adesão.</h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {variants.map(variant => (
                  <div key={variant.id} className={`relative p-10 rounded-[2.5rem] flex flex-col justify-between transition-all duration-500 border ${variant.is_most_popular ? 'bg-blue-600 border-blue-500 text-white shadow-[0_40px_100px_-20px_rgba(37,99,235,0.4)] scale-105 z-10' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-white/5 hover:border-blue-500/50'}`}>
                    {variant.is_most_popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-blue-600 text-[9px] font-black uppercase tracking-widest px-5 py-2 rounded-full shadow-2xl">Mais Vendido</div>
                    )}
                    <div className="space-y-8">
                      <div>
                        <h4 className={`text-xl font-serif italic mb-2 ${variant.is_most_popular ? 'text-white' : 'dark:text-white text-slate-900'}`}>{variant.name}</h4>
                        <div className="flex items-baseline gap-2">
                           <span className="text-4xl font-bold">R$ {variant.price.toLocaleString('pt-BR')}</span>
                           <span className={`text-[10px] uppercase font-bold tracking-widest opacity-60`}>
                             {variant.interval === 'month' ? '/mês' : variant.interval === 'semester' ? '/semestre' : variant.interval === 'year' ? '/ano' : '/unidade'}
                           </span>
                        </div>
                      </div>
                      <ul className="space-y-4">
                        {variant.features?.map((f, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm font-light">
                             <svg className={`h-5 w-5 shrink-0 ${variant.is_most_popular ? 'text-white' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                             <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link 
                      to={`/loja/${product.slug}/checkout?variant_id=${variant.id}`}
                      className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all text-center mt-12 shadow-xl active:scale-95 ${variant.is_most_popular ? 'bg-white text-blue-600 hover:bg-slate-50' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/10'}`}
                    >
                      Aderir Agora
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-brand-navy pt-20 transition-colors duration-500">
      <div className="fixed top-24 left-6 z-40 hidden lg:block animate-in fade-in slide-in-from-left-8 duration-1000">
        <Link to="/loja" className="flex items-center gap-3 text-slate-500 hover:text-blue-600 transition-colors font-black uppercase tracking-widest text-[9px]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Retornar à Loja
        </Link>
      </div>

      <main className="pb-32">
        {blocks.length > 0 ? (
          blocks.map(renderBlock)
        ) : (
          <div className="max-w-4xl mx-auto text-center py-32 space-y-12">
            <h2 className="text-6xl font-serif italic dark:text-white text-slate-900">{product.title}</h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-light italic">{product.subtitle}</p>
            <div className="pt-12">
              <a href="#pricing" className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl">Visualizar Planos</a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductPage;