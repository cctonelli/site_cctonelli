
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
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center space-y-6 pt-20 transition-colors">
      <div className="w-20 h-20 border-t-2 border-blue-600 rounded-full animate-spin"></div>
      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase tracking-[0.5em] text-blue-600 font-black animate-pulse">Iniciando Protocolo Matrix...</span>
        <p className="text-slate-500 font-serif italic text-sm">Descriptografando ativos de elite.</p>
      </div>
    </div>
  );

  const renderBlock = (block: ProductContentBlock) => {
    const { content } = block;
    const isMatrix = content.style?.includes('matrix') || content.style?.includes('glitch') || block.product_id === '1549b854-3c86-4961-bc05-866609fe8d8e';

    switch (block.block_type) {
      case 'hero':
        return (
          <section key={block.id} className={`pt-32 pb-48 relative overflow-hidden ${isMatrix ? 'bg-black text-blue-500' : ''}`}>
            {isMatrix && (
              <>
                <div className="absolute inset-0 scanline opacity-20 pointer-events-none z-20"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.1),transparent)] z-10"></div>
              </>
            )}
            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-6xl mx-auto flex flex-col items-center text-center space-y-12">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-block px-8 py-3 bg-blue-600/10 border border-blue-600/30 rounded-full text-blue-500 text-[10px] font-black uppercase tracking-[0.6em] animate-pulse"
                >
                  {content.overlay_text || 'System Authorized'}
                </motion.div>
                
                <div className="space-y-4">
                  <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-6xl md:text-[9rem] font-serif leading-[0.8] italic tracking-tighter ${isMatrix ? 'glitch-text text-white' : 'dark:text-white text-slate-900'}`}
                    data-text={content.title || product.title}
                  >
                    {content.title || product.title}
                  </motion.h1>
                  {content.glitch_title && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.5 }}
                      className="text-blue-500 font-mono text-xl md:text-2xl font-black uppercase tracking-[0.8em] py-2"
                    >
                      {content.glitch_title}
                    </motion.div>
                  )}
                </div>

                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl md:text-3xl text-slate-400 font-light italic leading-relaxed max-w-3xl mx-auto"
                >
                  {content.subtitle || product.subtitle}
                </motion.p>
              </div>

              {content.video_url && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className={`mt-24 aspect-video max-w-6xl mx-auto rounded-[3.5rem] overflow-hidden shadow-[0_60px_120px_-30px_rgba(37,99,235,0.3)] border relative bg-black group ${isMatrix ? 'border-blue-600/30 shadow-blue-600/50' : 'border-white/10 shadow-2xl'}`}
                >
                  <iframe 
                    src={content.video_url} 
                    className="w-full h-full opacity-90 group-hover:opacity-100 transition-opacity duration-1000" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                  {isMatrix && <div className="absolute inset-0 scanline opacity-10 pointer-events-none"></div>}
                </motion.div>
              )}
            </div>
          </section>
        );

      case 'features':
        return (
          <section key={block.id} className={`py-40 ${isMatrix ? 'bg-[#010309] border-y border-white/5' : 'bg-white dark:bg-slate-950'}`}>
            <div className="container mx-auto px-6">
              <div className="text-center mb-32 space-y-6">
                <div className="text-blue-600 font-black uppercase tracking-[0.5em] text-[10px]">{content.overlay_text || 'Advanced Matrix Tech'}</div>
                <h3 className="text-5xl md:text-7xl font-serif italic dark:text-white text-slate-900 tracking-tight">{content.title || 'Recursos de Elite'}</h3>
              </div>
              <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-10 ${content.style === 'glitch_grid' ? 'matrix-grid' : ''}`}>
                {content.items?.map((item: any, i: number) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ scale: 1.05, y: -10 }}
                    className="bg-slate-900/40 p-12 rounded-[3rem] border border-white/5 hover:border-blue-600/40 transition-all group relative overflow-hidden backdrop-blur-3xl"
                  >
                    <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center text-3xl mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl">
                      {item.icon === 'brain' ? '🧠' : item.icon === 'shield' ? '🛡️' : item.icon === 'zap' ? '⚡' : item.icon === 'lock' ? '🔒' : '🤖'}
                    </div>
                    <p className="text-slate-300 text-lg font-light italic leading-relaxed group-hover:text-white transition-colors">
                      {item.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'image_gallery':
        return (
          <section key={block.id} className={`py-40 ${content.style === 'matrix_scanline' ? 'bg-black' : ''}`}>
            <div className="container mx-auto px-6 space-y-20">
              <div className="text-center space-y-4">
                <h3 className="text-4xl font-serif italic text-white">{content.title || 'Capturas de Tela'}</h3>
                <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {content.images?.map((img: any, i: number) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ scale: 1.02 }}
                    className="relative rounded-[3rem] overflow-hidden shadow-2xl aspect-[16/10] border border-white/10 group bg-slate-900"
                  >
                    <img src={typeof img === 'string' ? img : img.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-[2s]" alt="" />
                    {isMatrix && <div className="absolute inset-0 scanline opacity-20 pointer-events-none"></div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                    {img.caption && (
                      <div className="absolute bottom-10 left-10 text-xs font-black uppercase tracking-[0.4em] text-blue-500 bg-black/80 px-4 py-2 rounded-xl border border-white/10">
                        {img.caption}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'comparison':
        return (
          <section key={block.id} id="pricing" className={`py-48 relative overflow-hidden ${content.style === 'terminal_matrix' ? 'bg-black' : 'bg-slate-50 dark:bg-brand-navy'}`}>
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
            <div className="container mx-auto px-6 relative z-10">
              <header className="max-w-4xl mx-auto text-center mb-32 space-y-8">
                <div className="text-blue-500 font-black uppercase tracking-[0.6em] text-[10px] animate-pulse">Investment Protocols</div>
                <h3 className={`text-6xl md:text-8xl font-serif italic leading-tight tracking-tighter text-white ${isMatrix ? 'glitch-text' : ''}`} data-text={content.title || 'Níveis de Poder.'}>
                  {content.title || 'Níveis de Poder.'}
                </h3>
              </header>
              
              <div className="grid lg:grid-cols-3 gap-12 items-stretch max-w-7xl mx-auto">
                {variants.map(variant => (
                  <motion.div 
                    key={variant.id} 
                    whileHover={{ y: -20, scale: 1.02 }}
                    className={`relative p-12 lg:p-16 rounded-[4rem] flex flex-col justify-between transition-all duration-700 border ${variant.is_most_popular ? 'bg-blue-600 border-blue-400 text-white shadow-[0_50px_100px_-20px_rgba(37,99,235,0.6)] scale-105 z-10' : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-blue-600/30 backdrop-blur-3xl'}`}
                  >
                    {variant.is_most_popular && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-blue-600 text-[10px] font-black uppercase tracking-[0.4em] px-10 py-4 rounded-full shadow-2xl z-20">Elite Selection</div>
                    )}
                    <div className="space-y-12">
                      <div className="space-y-6">
                        <h4 className="text-3xl font-serif italic text-white">{variant.name}</h4>
                        <div className="flex flex-col">
                           <span className="text-6xl font-bold tracking-tighter">R$ {variant.price.toLocaleString('pt-BR')}</span>
                           <span className="text-[10px] uppercase font-black tracking-[0.4em] opacity-60 mt-2">
                             {variant.interval === 'month' ? 'Mensal Recorrente' : variant.interval === 'semester' ? 'Semestral Elite' : variant.interval === 'year' ? 'Anual Corporativo' : 'Acesso Vitalício'}
                           </span>
                        </div>
                      </div>
                      <div className="w-full h-px bg-white/10"></div>
                      <ul className="space-y-6">
                        {variant.features?.map((f, i) => (
                          <li key={i} className="flex items-start gap-4 text-[13px] font-light leading-relaxed">
                             <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${variant.is_most_popular ? 'bg-white/20 text-white' : 'bg-blue-600/20 text-blue-500'}`}>
                               <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" /></svg>
                             </div>
                             <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link 
                      to={`/loja/${product.slug}/checkout?variant_id=${variant.id}`}
                      className={`w-full py-7 rounded-[2rem] font-black uppercase tracking-[0.5em] text-[10px] transition-all text-center mt-20 shadow-2xl active:scale-95 ${variant.is_most_popular ? 'bg-white text-blue-600 hover:bg-slate-100' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20'}`}
                    >
                      ATIVAR PROTOCOLO
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'cta':
        return (
          <section key={block.id} className={`py-60 text-center relative overflow-hidden ${isMatrix ? 'bg-black' : 'bg-white dark:bg-slate-950'}`}>
             {isMatrix && <div className="absolute inset-0 bg-blue-600/5 animate-pulse"></div>}
             <div className="container mx-auto px-6 relative z-10 space-y-16">
                <h3 className={`text-5xl md:text-8xl font-serif italic tracking-tighter leading-tight max-w-4xl mx-auto ${isMatrix ? 'text-white' : 'dark:text-white text-slate-900'}`}>
                  {content.title || 'A Transformação Começa Aqui.'}
                </h3>
                <Link to={content.button_link || '#pricing'} className={`inline-block px-20 py-7 rounded-[2rem] font-black uppercase tracking-[0.6em] text-[10px] transition-all active:scale-95 shadow-2xl ${isMatrix ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/40' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                   {content.button_text || 'INICIAR AGORA'}
                </Link>
             </div>
          </section>
        );

      case 'text':
        return (
          <section key={block.id} className="py-32 max-w-4xl mx-auto px-6">
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
    <div className="min-h-screen bg-brand-navy pt-20 transition-colors relative">
      {/* Global CSS for Matrix Edition */}
      <style>{`
        .glitch-text {
          position: relative;
          text-shadow: 0.05em 0 0 rgba(255, 0, 0, 0.75),
                      -0.025em -0.05em 0 rgba(0, 255, 0, 0.75),
                      0.025em 0.05em 0 rgba(0, 0, 255, 0.75);
          animation: glitch 500ms infinite;
        }
        @keyframes glitch {
          0% { text-shadow: 0.05em 0 0 rgba(255, 0, 0, 0.75), -0.05em -0.025em 0 rgba(0, 255, 0, 0.75), -0.025em 0.05em 0 rgba(0, 0, 255, 0.75); }
          14% { text-shadow: 0.05em 0 0 rgba(255, 0, 0, 0.75), -0.05em -0.025em 0 rgba(0, 255, 0, 0.75), -0.025em 0.05em 0 rgba(0, 0, 255, 0.75); }
          15% { text-shadow: -0.05em -0.025em 0 rgba(255, 0, 0, 0.75), 0.025em 0.025em 0 rgba(0, 255, 0, 0.75), -0.05em -0.05em 0 rgba(0, 0, 255, 0.75); }
          49% { text-shadow: -0.05em -0.025em 0 rgba(255, 0, 0, 0.75), 0.025em 0.025em 0 rgba(0, 255, 0, 0.75), -0.05em -0.05em 0 rgba(0, 0, 255, 0.75); }
          50% { text-shadow: 0.025em 0.05em 0 rgba(255, 0, 0, 0.75), 0.05em 0 0 rgba(0, 255, 0, 0.75), 0 -0.05em 0 rgba(0, 0, 255, 0.75); }
          99% { text-shadow: 0.025em 0.05em 0 rgba(255, 0, 0, 0.75), 0.05em 0 0 rgba(0, 255, 0, 0.75), 0 -0.05em 0 rgba(0, 0, 255, 0.75); }
          100% { text-shadow: -0.025em 0 0 rgba(255, 0, 0, 0.75), -0.025em -0.025em 0 rgba(0, 255, 0, 0.75), -0.025em -0.05em 0 rgba(0, 0, 255, 0.75); }
        }
        .scanline {
          background: linear-gradient(to bottom, transparent 50%, rgba(0, 255, 255, 0.05) 50%);
          background-size: 100% 4px;
          animation: scanline-scroll 10s linear infinite;
        }
        @keyframes scanline-scroll {
          from { background-position: 0 0; }
          to { background-position: 0 100%; }
        }
        .matrix-grid {
          display: grid;
          position: relative;
        }
      `}</style>

      <div className="fixed top-32 left-8 z-40 hidden lg:block">
        <Link 
          to="/loja" 
          className="flex items-center gap-4 text-slate-500 hover:text-blue-500 transition-all font-black uppercase tracking-[0.4em] text-[9px] group"
        >
          <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-blue-600 group-hover:bg-blue-600/10 transition-all">
            <svg className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </div>
          Vitrine Elite
        </Link>
      </div>

      <main className="pb-40 relative">
        {blocks.length > 0 ? (
          blocks.map(renderBlock)
        ) : (
          <div className="max-w-6xl mx-auto text-center py-60 space-y-20 px-6">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
              <h2 className="text-7xl md:text-[10rem] font-serif italic text-white tracking-tighter leading-none">{product.title}</h2>
              <p className="text-2xl md:text-4xl text-slate-400 font-light italic max-w-4xl mx-auto leading-relaxed">
                {product.subtitle}
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <a href="#pricing" className="bg-blue-600 text-white px-20 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.6em] text-[11px] shadow-2xl shadow-blue-600/40 hover:bg-blue-500 transition-all active:scale-95">REQUISITAR ACESSO</a>
            </motion.div>
          </div>
        )}
      </main>
      
      <footer className="py-40 bg-black border-t border-white/5 relative">
        <div className="container mx-auto px-6 text-center space-y-12">
          <div className="w-20 h-20 bg-blue-600 text-white rounded-[1.8rem] mx-auto flex items-center justify-center font-bold text-4xl shadow-2xl shadow-blue-600/20">CT</div>
          <p className="text-slate-500 font-serif italic text-2xl max-w-2xl mx-auto leading-relaxed">"O rigor da elite consultiva encontra a potência da automação disruptiva."</p>
          <div className="flex justify-center gap-12">
            <Link to="/loja" className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500 hover:text-white transition-colors">Digital Hub</Link>
            <Link to="/" className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductPage;
