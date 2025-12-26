
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
    <div className="min-h-screen bg-white dark:bg-brand-navy flex flex-col items-center justify-center space-y-6 pt-20 transition-colors duration-500">
      <div className="w-20 h-20 border-t-2 border-blue-600 rounded-full animate-spin"></div>
      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase tracking-[0.5em] text-blue-600 font-black animate-pulse">Renderizando Ativo Elite</span>
        <p className="text-slate-500 font-serif italic text-sm">Arquitetando visão matricial...</p>
      </div>
    </div>
  );

  const renderBlock = (block: ProductContentBlock) => {
    const { content } = block;
    const isMatrix = content.style === 'matrix' || content.style === 'terminal_matrix' || content.style === 'glitch_grid';

    switch (block.block_type) {
      case 'hero':
        return (
          <section key={block.id} className={`pt-24 pb-40 relative overflow-hidden ${isMatrix ? 'bg-[#00050a]' : ''}`}>
            {isMatrix && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="container mx-auto px-6 relative z-10 space-y-20">
              <div className="max-w-5xl mx-auto text-center space-y-10">
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className={`inline-block px-6 py-2 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-600 text-[10px] font-black uppercase tracking-[0.5em] ${isMatrix ? 'animate-pulse' : ''}`}
                 >
                   {content.overlay_text || 'Strategic Architecture'}
                 </motion.div>
                 <motion.h1 
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 }}
                   className={`text-6xl md:text-9xl font-serif dark:text-white text-slate-900 leading-[0.85] italic tracking-tighter ${isMatrix ? 'text-blue-500' : ''}`}
                 >
                   {content.title || product.title}
                 </motion.h1>
                 {content.glitch_title && (
                    <div className="text-blue-600 font-mono text-xl tracking-[0.5em] uppercase font-bold animate-pulse">{content.glitch_title}</div>
                 )}
                 <motion.p 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ delay: 0.4 }}
                   className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-light italic leading-relaxed max-w-3xl mx-auto border-l-4 border-blue-600/40 pl-10 text-left"
                 >
                   {content.subtitle || product.subtitle}
                 </motion.p>
              </div>
              
              {content.video_url && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className={`aspect-video max-w-6xl mx-auto rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 relative bg-black group ${isMatrix ? 'border-blue-600/30 shadow-blue-600/20' : ''}`}
                >
                   <iframe 
                     src={content.video_url} 
                     className="w-full h-full opacity-90 group-hover:opacity-100 transition-opacity duration-700" 
                     frameBorder="0" 
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                     allowFullScreen
                   />
                </motion.div>
              )}
            </div>
          </section>
        );
      case 'features':
        return (
          <section key={block.id} className={`py-32 ${isMatrix ? 'bg-slate-950' : ''}`}>
             <div className="container mx-auto px-6">
                <div className="text-center mb-24 space-y-6">
                   <h3 className="text-5xl font-serif italic text-white tracking-tight">{content.title || 'Ativos de Performance'}</h3>
                   <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                   {content.items?.map((item: any, i: number) => (
                      <div key={i} className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-white/5 hover:border-blue-600/30 transition-all group">
                         <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {item.icon === 'brain' ? '🧠' : item.icon === 'shield' ? '🛡️' : item.icon === 'zap' ? '⚡' : '🔒'}
                         </div>
                         <p className="text-slate-300 font-light italic leading-relaxed">{item.text}</p>
                      </div>
                   ))}
                </div>
             </div>
          </section>
        );
      case 'comparison':
        return (
          <section key={block.id} id="pricing" className={`py-40 relative overflow-hidden my-32 rounded-[5rem] shadow-2xl border border-white/5 ${isMatrix ? 'bg-[#00050a]' : 'bg-[#010309]'}`}>
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-4xl mx-auto text-center mb-24 space-y-6">
                <div className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">Financial Architecture</div>
                <h3 className="text-5xl md:text-7xl font-serif text-white italic">{content.title || 'Planos de Adesão.'}</h3>
                <p className="text-slate-500 text-lg font-light italic max-w-2xl mx-auto">Protocolo de elite para acesso vitalício ou recorrente.</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 items-stretch">
                {variants.map(variant => (
                  <motion.div 
                    key={variant.id} 
                    whileHover={{ y: -15 }}
                    className={`relative p-12 rounded-[3.5rem] flex flex-col justify-between transition-all duration-700 border ${variant.is_most_popular ? 'bg-blue-600 border-blue-400 text-white shadow-[0_50px_100px_-20px_rgba(37,99,235,0.5)] scale-105 z-10' : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-blue-600/50'}`}
                  >
                    {variant.is_most_popular && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] px-8 py-3 rounded-full shadow-2xl">Recomendado</div>
                    )}
                    <div className="space-y-10">
                      <div className="space-y-4">
                        <h4 className="text-2xl font-serif italic text-white">{variant.name}</h4>
                        <div className="flex items-baseline gap-2">
                           <span className="text-5xl font-bold tracking-tighter">R$ {variant.price.toLocaleString('pt-BR')}</span>
                           <span className="text-[10px] uppercase font-black tracking-widest opacity-60">
                             {variant.interval === 'month' ? '/mês' : variant.interval === 'semester' ? '/sem' : variant.interval === 'year' ? '/ano' : '/ativo'}
                           </span>
                        </div>
                      </div>
                      <ul className="space-y-6">
                        {variant.features?.map((f, i) => (
                          <li key={i} className="flex items-start gap-4 text-sm font-light leading-snug">
                             <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${variant.is_most_popular ? 'bg-white/20 text-white' : 'bg-blue-600/20 text-blue-500'}`}>
                               <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                             </div>
                             <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link 
                      to={`/loja/${product.slug}/checkout?variant_id=${variant.id}`}
                      className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] transition-all text-center mt-16 shadow-2xl active:scale-95 ${variant.is_most_popular ? 'bg-white text-blue-600 hover:bg-slate-100' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20'}`}
                    >
                      ATIVAR PROTOCOLO
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'image_gallery':
        return (
          <section key={block.id} className="py-32 container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {content.images?.map((img: any, i: number) => (
              <motion.div 
                key={i} 
                whileHover={{ scale: 1.05 }}
                className="rounded-[3rem] overflow-hidden shadow-2xl aspect-[16/10] border border-white/10 bg-slate-900 group"
              >
                <img src={typeof img === 'string' ? img : img.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-1000" alt="" />
                {img.caption && (
                   <div className="absolute bottom-6 left-6 right-6 text-[10px] font-black uppercase tracking-widest text-white/60">{img.caption}</div>
                )}
              </motion.div>
            ))}
          </section>
        );
      case 'cta':
        return (
          <section key={block.id} className={`py-40 text-center ${isMatrix ? 'bg-blue-600/5' : ''}`}>
             <div className="container mx-auto px-6 space-y-12">
                <h3 className="text-5xl font-serif italic dark:text-white text-slate-900">{content.title || 'Pronto para Transformar?'}</h3>
                <Link to={content.button_link || '#pricing'} className="inline-block px-16 py-6 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.5em] text-[10px] shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-95">
                   {content.button_text || 'INICIAR AGORA'}
                </Link>
             </div>
          </section>
        );
      case 'text':
        return (
          <section key={block.id} className="py-24 max-w-4xl mx-auto px-6">
             <div 
               className="prose prose-2xl prose-blue dark:prose-invert font-light italic leading-loose text-slate-700 dark:text-slate-300 drop-shadow-sm"
               dangerouslySetInnerHTML={{ __html: content.html }}
             />
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-brand-navy pt-20 transition-colors duration-500 relative">
      <div className="fixed top-32 left-8 z-40 hidden lg:block">
        <Link 
          to="/loja" 
          className="flex items-center gap-4 text-slate-400 hover:text-blue-600 transition-all font-black uppercase tracking-[0.4em] text-[9px] group"
        >
          <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:border-blue-600/50 group-hover:bg-blue-600/5 transition-all">
            <svg className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </div>
          Vitrine Digital
        </Link>
      </div>

      <main className="pb-40">
        {blocks.length > 0 ? (
          blocks.map(renderBlock)
        ) : (
          <div className="max-w-5xl mx-auto text-center py-40 space-y-16 px-6">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <h2 className="text-7xl md:text-9xl font-serif italic dark:text-white text-slate-900 tracking-tighter leading-none">{product.title}</h2>
              <p className="text-2xl text-slate-500 dark:text-slate-400 font-light italic border-l-4 border-blue-600/40 pl-10 max-w-3xl mx-auto text-left leading-relaxed">
                {product.subtitle}
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="pt-16"
            >
              <a href="#pricing" className="bg-blue-600 text-white px-16 py-6 rounded-[2rem] font-black uppercase tracking-[0.5em] text-[11px] shadow-[0_30px_60px_-15px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all active:scale-95">ESTRUTURA DE INVESTIMENTO</a>
            </motion.div>
          </div>
        )}
      </main>
      
      <footer className="py-32 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-white/5 transition-colors">
        <div className="container mx-auto px-6 text-center space-y-12">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl mx-auto flex items-center justify-center font-bold text-3xl shadow-2xl shadow-blue-600/20">CT</div>
          <p className="text-slate-500 font-serif italic text-xl max-w-xl mx-auto">"Arquitetando o futuro através de rigor metodológico e inovação digital."</p>
          <div className="flex justify-center gap-10">
            <Link to="/loja" className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-white transition-colors">Portfólio</Link>
            <Link to="/wip" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Insights</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductPage;
