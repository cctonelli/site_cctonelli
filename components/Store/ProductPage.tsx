
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
        if (!data) { 
          console.warn(`[ProductPage] Produto não encontrado: ${slug}`);
          navigate('/loja'); 
          return; 
        }
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
    <div className="min-h-screen bg-brand-navy flex flex-col items-center justify-center space-y-8 pt-20">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 border-2 border-blue-600/10 rounded-full"></div>
        <div className="absolute inset-0 border-t-2 border-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-blue-600 text-xs tracking-widest animate-pulse">CT</div>
      </div>
      <div className="text-center space-y-2">
        <span className="text-[10px] uppercase tracking-[0.5em] text-blue-500 font-black">Decrypting Asset Protocol...</span>
      </div>
    </div>
  );

  const isV8Matrix = slug?.toLowerCase().includes('v8') || slug?.toLowerCase().includes('matrix');

  const renderBlock = (block: ProductContentBlock) => {
    const { content, block_type } = block;
    const style = content.style || '';
    // If block style has "matrix" or "glitch", OR the product is the V8 itself
    const isMatrixBlock = style.includes('matrix') || style.includes('glitch') || isV8Matrix;

    switch (block_type) {
      case 'hero':
        return (
          <section key={block.id} className={`pt-48 pb-64 relative overflow-hidden ${isMatrixBlock ? 'bg-black text-white' : 'bg-white dark:bg-brand-navy text-slate-900 dark:text-white'}`}>
            {isMatrixBlock && (
              <>
                <div className="scanline"></div>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(37, 99, 235, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.1),transparent)] z-10"></div>
              </>
            )}
            
            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-6xl mx-auto flex flex-col items-center text-center space-y-16">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`inline-block px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.6em] ${isMatrixBlock ? 'bg-blue-600/10 border border-blue-600/30 text-blue-500 animate-pulse' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}
                >
                  {content.overlay_text || 'System Authorized'}
                </motion.div>
                
                <div className="space-y-6">
                  <motion.h1 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-6xl md:text-[9rem] font-serif leading-[0.8] italic tracking-tighter ${isMatrixBlock ? 'glitch-text' : ''}`}
                    data-text={content.title || product.title}
                  >
                    {content.title || product.title}
                  </motion.h1>
                  {content.glitch_title && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      transition={{ delay: 0.5 }}
                      className="text-blue-500 font-mono text-xl md:text-2xl font-black uppercase tracking-[0.8em] py-4"
                    >
                      {content.glitch_title}
                    </motion.div>
                  )}
                </div>

                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl md:text-3xl text-slate-500 dark:text-slate-400 font-light italic leading-relaxed max-w-4xl mx-auto"
                >
                  {content.subtitle || product.subtitle}
                </motion.p>
              </div>

              {content.video_url && (
                <motion.div 
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className={`mt-32 aspect-video max-w-6xl mx-auto rounded-[3.5rem] overflow-hidden shadow-[0_80px_160px_-40px_rgba(37,99,235,0.4)] border relative bg-black group ${isMatrixBlock ? 'border-blue-600/30' : 'border-white/10'}`}
                >
                  <iframe 
                    src={content.video_url} 
                    className="w-full h-full opacity-90 group-hover:opacity-100 transition-opacity duration-1000" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                  {isMatrixBlock && <div className="absolute inset-0 scanline opacity-10 pointer-events-none"></div>}
                </motion.div>
              )}
            </div>
          </section>
        );

      case 'features':
        return (
          <section key={block.id} className={`py-48 ${isMatrixBlock ? 'bg-[#010309] border-y border-white/5' : 'bg-slate-50 dark:bg-slate-950'}`}>
            <div className="container mx-auto px-6">
              <div className="text-center mb-32 space-y-6">
                <div className="text-blue-600 font-black uppercase tracking-[0.5em] text-[10px]">{content.overlay_text || 'Core Capabilities'}</div>
                <h3 className={`text-6xl md:text-8xl font-serif italic tracking-tighter leading-none ${isMatrixBlock ? 'text-white' : 'dark:text-white text-slate-900'}`}>
                  {content.title || 'Recursos de Elite.'}
                </h3>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
                {content.items?.map((item: any, i: number) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05, y: -10 }}
                    className={`p-12 rounded-[3.5rem] border transition-all group relative overflow-hidden shadow-xl ${isMatrixBlock ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-100 dark:border-white/5'}`}
                  >
                    <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div className="w-16 h-16 rounded-[1.2rem] bg-blue-600/10 flex items-center justify-center text-3xl mb-10 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      {item.icon === 'brain' ? '🧠' : item.icon === 'shield' ? '🛡️' : item.icon === 'zap' ? '⚡' : item.icon === 'lock' ? '🔒' : '🤖'}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-lg font-light italic leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
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
          <section key={block.id} className={`py-48 ${isMatrixBlock ? 'bg-black' : 'bg-white dark:bg-slate-950'}`}>
            <div className="container mx-auto px-6 space-y-24">
              <div className="text-center space-y-4">
                <h3 className="text-4xl font-serif italic text-white">{content.title || 'Interface em Ação'}</h3>
                <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                {content.images?.map((img: any, i: number) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="relative rounded-[3rem] overflow-hidden shadow-2xl aspect-video border border-white/5 group"
                  >
                    <img src={img.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-[2s]" alt={img.caption} />
                    {isMatrixBlock && <div className="scanline opacity-20"></div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                    <div className="absolute bottom-10 left-10 text-[9px] font-black uppercase tracking-[0.4em] text-blue-500 bg-black/80 px-6 py-3 rounded-2xl border border-white/10">
                      {img.caption}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'comparison':
        return (
          <section key={block.id} id="pricing" className={`py-64 relative overflow-hidden ${isMatrixBlock ? 'bg-black' : 'bg-slate-50 dark:bg-brand-navy'}`}>
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(37, 99, 235, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            <div className="container mx-auto px-6 relative z-10">
              <header className="max-w-4xl mx-auto text-center mb-32 space-y-10">
                <div className="text-blue-500 font-black uppercase tracking-[0.6em] text-[10px] animate-pulse">Activation Protocols</div>
                <h3 className={`text-6xl md:text-[8rem] font-serif italic leading-[0.85] tracking-tighter ${isMatrixBlock ? 'text-white glitch-text' : 'dark:text-white text-slate-900'}`} data-text={content.title || 'Investimento.'}>
                  {content.title || 'Investimento.'}
                </h3>
              </header>
              
              <div className="grid lg:grid-cols-3 gap-12 items-stretch max-w-7xl mx-auto">
                {variants.map((variant, vIdx) => (
                  <motion.div 
                    key={variant.id} 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: vIdx * 0.1 }}
                    whileHover={{ y: -20, scale: 1.02 }}
                    className={`relative p-12 rounded-[4rem] flex flex-col justify-between transition-all duration-700 border ${variant.is_most_popular ? 'bg-blue-600 border-blue-400 text-white shadow-[0_50px_100px_-20px_rgba(37,99,235,0.6)] scale-105 z-10' : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-blue-600/30 backdrop-blur-3xl'}`}
                  >
                    {variant.is_most_popular && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-blue-600 text-[10px] font-black uppercase tracking-[0.5em] px-10 py-4 rounded-full shadow-2xl z-20">Elite Choice</div>
                    )}
                    <div className="space-y-12">
                      <div className="space-y-6">
                        <h4 className="text-3xl font-serif italic text-white">{variant.name}</h4>
                        <div className="flex flex-col">
                           <span className="text-6xl font-bold tracking-tighter">R$ {variant.price.toLocaleString('pt-BR')}</span>
                           <span className="text-[9px] uppercase font-black tracking-[0.4em] opacity-60 mt-2">
                             {variant.interval === 'month' ? 'Mensal' : variant.interval === 'semester' ? 'Semestral' : variant.interval === 'year' ? 'Anual' : 'Ativo Permanente'}
                           </span>
                        </div>
                      </div>
                      <div className="w-full h-px bg-white/10"></div>
                      <ul className="space-y-6">
                        {variant.features?.map((f, i) => (
                          <li key={i} className="flex items-start gap-4 text-sm font-light leading-relaxed">
                             <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${variant.is_most_popular ? 'bg-white text-blue-600' : 'bg-blue-600 text-white shadow-lg'}`}>
                               <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={5} d="M5 13l4 4L19 7" /></svg>
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
          <section key={block.id} className={`py-64 text-center relative overflow-hidden ${isMatrixBlock ? 'bg-black' : 'bg-white dark:bg-slate-950'}`}>
             {isMatrixBlock && (
               <>
                 <div className="absolute inset-0 bg-blue-600/5 animate-pulse"></div>
                 <div className="scanline opacity-10"></div>
               </>
             )}
             <div className="container mx-auto px-6 relative z-10 space-y-16">
                <h3 className={`text-5xl md:text-7xl font-serif italic tracking-tighter leading-[0.9] max-w-4xl mx-auto ${isMatrixBlock ? 'text-white glitch-text' : 'dark:text-white text-slate-900'}`}>
                  {content.title || 'Pronto para a Transformação?'}
                </h3>
                <Link to={content.button_link || '#pricing'} className={`inline-block px-24 py-8 rounded-[2.5rem] font-black uppercase tracking-[0.6em] text-[11px] transition-all active:scale-95 shadow-2xl ${isMatrixBlock ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/40' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                   {content.button_text || 'INICIAR AGORA'}
                </Link>
             </div>
          </section>
        );

      case 'text':
        return (
          <section key={block.id} className={`py-48 max-w-5xl mx-auto px-6 ${isMatrixBlock ? 'bg-black text-white' : ''}`}>
             <div 
               className="prose prose-2xl prose-blue dark:prose-invert font-light italic leading-[1.8] text-slate-700 dark:text-slate-300 mx-auto"
               dangerouslySetInnerHTML={{ __html: content.html }}
             />
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-brand-navy transition-colors relative">
      <div className="fixed top-32 left-10 z-50 hidden xl:block">
        <Link 
          to="/loja" 
          className="flex items-center gap-6 text-slate-500 hover:text-blue-500 transition-all font-black uppercase tracking-[0.5em] text-[10px] group"
        >
          <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center group-hover:border-blue-600 group-hover:bg-blue-600/10 transition-all shadow-2xl">
            <svg className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </div>
          Vitrine de Ativos
        </Link>
      </div>

      <main className="relative min-h-screen">
        {blocks.length > 0 ? (
          blocks.map(renderBlock)
        ) : (
          <div className="max-w-7xl mx-auto text-center py-80 space-y-24 px-6">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <h2 className="text-8xl md:text-[10rem] font-serif italic text-white tracking-tighter leading-none">{product.title}</h2>
              <p className="text-3xl md:text-4xl text-slate-500 font-light italic max-w-5xl mx-auto leading-relaxed">
                {product.subtitle}
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <a href="#pricing" className="bg-blue-600 text-white px-24 py-8 rounded-[3rem] font-black uppercase tracking-[0.6em] text-[12px] shadow-[0_40px_80px_-20px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all active:scale-95">
                ATIVAR PROTOCOLO
              </a>
            </motion.div>
          </div>
        )}
      </main>
      
      <footer className="py-48 bg-black border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
        <div className="container mx-auto px-6 text-center space-y-16 relative z-10">
          <div className="w-24 h-24 bg-blue-600 text-white rounded-[2rem] mx-auto flex items-center justify-center font-bold text-5xl shadow-2xl shadow-blue-600/30">CT</div>
          <p className="text-slate-400 font-serif italic text-3xl max-w-3xl mx-auto leading-relaxed opacity-80">
            "Onde o rigor da elite consultiva encontra a potência da automação disruptiva."
          </p>
          <div className="flex justify-center gap-16 pt-8">
            <Link to="/loja" className="text-[11px] font-black uppercase tracking-[0.6em] text-blue-500 hover:text-white transition-colors">Digital Hub</Link>
            <Link to="/" className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-500 hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductPage;
