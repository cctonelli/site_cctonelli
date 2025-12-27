import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProductBySlug, fetchProductVariants, fetchProductContentBlocks, fetchSiteConfig } from '../../services/supabaseService';
import { Product, ProductVariant, ProductContentBlock } from '../../types';
import { Language } from '../../services/i18nService';
import MatrixRain from '../MatrixRain';

interface ProductPageProps {
  language: Language;
  t: any;
  resolveTranslation: (item: any, field: string, fallbackKey: string) => string;
}

const ProductPage: React.FC<ProductPageProps> = ({ language, t, resolveTranslation }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const config = fetchSiteConfig();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [blocks, setBlocks] = useState<ProductContentBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async (targetSlug: string) => {
    setLoading(true);
    try {
      const prod = await fetchProductBySlug(targetSlug);
      if (!prod) { navigate('/loja'); return; }
      setProduct(prod);

      const [vData, bData] = await Promise.all([
        fetchProductVariants(prod.id),
        fetchProductContentBlocks(prod.id)
      ]);
      setVariants(vData);
      setBlocks(bData);
    } catch (err) {
      console.error("Render Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) loadData(slug);
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading || !product) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 border-2 border-blue-600/10 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 border-t-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    </div>
  );

  const isMatrixSlug = slug?.toLowerCase().includes('v8') || slug?.toLowerCase().includes('matrix');

  const renderBlock = (block: ProductContentBlock) => {
    const { content, block_type } = block;
    const isMatrixStyle = isMatrixSlug || content.style?.includes('matrix');
    const blockColor = content.matrix_color || config.theme.primary;

    switch (block_type) {
      case 'hero':
        return (
          <section key={block.id} className="pt-48 pb-64 relative bg-black overflow-hidden border-b border-white/5 min-h-[80vh] flex items-center">
            {isMatrixStyle && (
              <>
                <MatrixRain 
                  color={blockColor} 
                  speed={config.ux.matrix_speed} 
                  opacity={config.ux.matrix_opacity} 
                />
                <div className="scanline" style={{ background: `linear-gradient(0deg, rgba(0,0,0,0) 0%, ${blockColor}20 50%, rgba(0,0,0,0) 100%)` }}></div>
              </>
            )}
            <div className="container mx-auto px-6 relative z-10 text-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-block px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.6em] bg-white/5 border border-white/10 animate-pulse mb-16" style={{ borderColor: `${blockColor}40`, color: blockColor, boxShadow: `0 0 20px ${blockColor}20` }}>
                {content.overlay_text || 'ACTIVE PROTOCOL'}
              </motion.div>
              <h1 
                className={`text-6xl md:text-[8rem] lg:text-[10rem] font-serif leading-[0.8] italic tracking-tighter text-white mb-12 ${isMatrixStyle ? 'glitch-text' : ''}`} 
                data-text={content.title || product.title}
                style={isMatrixStyle ? { textShadow: `0 0 40px ${blockColor}40` } : {}}
              >
                {content.title || product.title}
              </h1>
              {content.glitch_title && (
                <div className="font-mono text-xl md:text-3xl font-black uppercase tracking-[0.8em] py-8 animate-pulse" style={{ color: blockColor, textShadow: `0 0 15px ${blockColor}60` }}>{content.glitch_title}</div>
              )}
              <p className="text-xl md:text-3xl text-slate-500 font-light italic leading-relaxed max-w-4xl mx-auto mb-20">{content.subtitle || product.subtitle}</p>
              <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                  <a href="#precos" className="text-white px-10 md:px-16 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-[11px] shadow-2xl transition-all hover:scale-105 active:scale-95" style={{ backgroundColor: blockColor, boxShadow: `0 20px 40px ${blockColor}30` }}>
                    {content.cta_text || 'Ativar Agora'}
                  </a>
                  <Link to="/loja" className="bg-white/5 text-slate-500 border border-white/10 px-10 md:px-16 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-[11px] hover:bg-white/10 hover:text-white transition-all">Outros Ativos</Link>
              </div>
            </div>
          </section>
        );

      case 'text':
        return (
          <section key={block.id} className="py-32 md:py-48 bg-[#010309] border-b border-white/5">
            <div className="container mx-auto px-6 max-w-4xl text-center space-y-12">
               <h2 className="text-4xl md:text-6xl font-serif italic text-white leading-tight">{content.title}</h2>
               <p className="text-lg md:text-2xl text-slate-400 font-light italic leading-relaxed">{content.subtitle}</p>
            </div>
          </section>
        );

      case 'features':
        return (
          <section key={block.id} className="py-32 md:py-48 bg-[#010309] relative border-b border-white/5 overflow-hidden">
             {isMatrixStyle && <div className="absolute inset-0 bg-grid opacity-10"></div>}
            <div className="container mx-auto px-6 relative z-10">
              <h3 className="text-center text-4xl md:text-6xl font-serif italic text-white mb-24 md:mb-32">{content.title || 'Arquitetura de Ativos'}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                {content.items?.map((item: any, i: number) => (
                  <motion.div key={i} whileHover={{ y: -10 }} className="p-10 md:p-12 rounded-[3.5rem] bg-slate-900/60 border border-white/5 hover:border-white/20 transition-all group backdrop-blur-xl" style={{ borderBottomColor: `${blockColor}40` }}>
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.8rem] bg-white/5 flex items-center justify-center text-3xl md:text-4xl mb-10 group-hover:scale-110 duration-500 transition-all" style={{ backgroundColor: `${blockColor}10`, color: blockColor, boxShadow: `inset 0 0 20px ${blockColor}20` }}>
                      {item.icon === 'brain' ? '🧠' : item.icon === 'shield' ? '🛡️' : item.icon === 'zap' ? '⚡' : '🤖'}
                    </div>
                    <p className="text-slate-400 text-lg md:text-xl font-light italic leading-relaxed group-hover:text-white transition-colors">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'comparison':
        return (
          <section key={block.id} id="precos" className="py-48 md:py-64 bg-black relative border-y border-white/5">
             {isMatrixStyle && <MatrixRain color={blockColor} speed={0.5} opacity={0.05} fontSize={10} />}
            <div className="container mx-auto px-6 relative z-10">
              <header className="text-center mb-32 md:mb-40 space-y-6">
                <h3 className={`text-6xl md:text-[8rem] font-serif italic text-white tracking-tighter ${isMatrixStyle ? 'glitch-text' : ''}`} data-text={content.title || 'Níveis de Poder'}>
                  {content.title || 'Níveis de Poder'}
                </h3>
                <p className="text-slate-500 text-xl font-light italic">{content.subtitle}</p>
              </header>
              <div className="grid lg:grid-cols-4 gap-8 md:gap-12 max-w-[1400px] mx-auto">
                {variants.map((v) => (
                  <div key={v.id} className={`p-10 md:p-12 rounded-[4rem] border flex flex-col justify-between transition-all duration-700 backdrop-blur-2xl ${v.is_most_popular ? 'text-white shadow-2xl scale-105 z-10' : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10'}`} style={v.is_most_popular ? { backgroundColor: `${blockColor}dd`, borderColor: blockColor, boxShadow: `0 40px 100px -20px ${blockColor}40` } : {}}>
                    <div className="space-y-10">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="text-2xl md:text-3xl font-serif italic text-white">{v.name}</h4>
                          {v.is_most_popular && <span className="text-[7px] font-black uppercase tracking-widest px-3 py-1 bg-white text-black rounded-full">ELITE</span>}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-light">R$</span>
                          <span className="text-4xl md:text-5xl font-bold tracking-tighter text-white">{v.price.toLocaleString('pt-BR')}</span>
                          {v.interval && <span className="text-[10px] uppercase font-bold opacity-60">/{v.interval}</span>}
                        </div>
                      </div>
                      <ul className="space-y-4">
                        {v.features?.map((f, fi) => (
                          <li key={fi} className="flex gap-3 text-[11px] md:text-xs font-light italic">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${v.is_most_popular ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>✓</div>
                            <span className={v.is_most_popular ? 'text-white' : 'text-slate-300'}>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link to={`/loja/${product.slug}/checkout?variant_id=${v.id}`} className={`w-full py-6 md:py-7 mt-16 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[9px] md:text-[10px] text-center transition-all shadow-xl ${v.is_most_popular ? 'bg-white text-black hover:bg-slate-100' : 'text-white hover:scale-105'}`} style={!v.is_most_popular ? { backgroundColor: blockColor } : {}}>
                      ATIVAR PROTOCOLO
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'faq':
        return (
          <section key={block.id} className="py-32 md:py-48 bg-[#010309] border-b border-white/5">
             <div className="container mx-auto px-6 max-w-4xl">
                <h3 className="text-4xl md:text-6xl font-serif italic text-white mb-24 text-center">{content.title || 'FAQ'}</h3>
                <div className="space-y-8">
                   {content.items?.map((item: any, i: number) => (
                     <div key={i} className="p-8 md:p-10 bg-slate-900/40 border border-white/5 rounded-[2.5rem] space-y-4 group hover:border-white/10 transition-all">
                        <h4 className="text-xl font-serif italic text-white">{item.question}</h4>
                        <p className="text-slate-500 font-light italic leading-relaxed text-sm md:text-base">{item.answer}</p>
                     </div>
                   ))}
                </div>
             </div>
          </section>
        );

      case 'cta':
        return (
          <section key={block.id} className="py-48 md:py-64 bg-black relative overflow-hidden">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[120px]" style={{ backgroundColor: `${blockColor}05` }}></div>
             <div className="container mx-auto px-6 relative z-10 text-center space-y-12">
                <h2 className="text-5xl md:text-[7rem] font-serif italic text-white tracking-tighter leading-none">{content.title}</h2>
                <p className="text-xl md:text-2xl text-slate-500 font-light italic max-w-2xl mx-auto">{content.subtitle}</p>
                <div className="pt-8">
                   <a href={content.button_link || "#precos"} className="px-16 md:px-24 py-6 md:py-8 text-white rounded-[2.5rem] font-black uppercase tracking-[0.8em] text-[11px] md:text-[12px] shadow-2xl transition-all hover:scale-110 active:scale-95" style={{ backgroundColor: blockColor, boxShadow: `0 30px 60px -15px ${blockColor}40` }}>
                      {content.button_text || 'COMPRAR AGORA'}
                   </a>
                </div>
             </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black transition-colors relative selection:bg-white selection:text-black">
      <div className="fixed top-24 md:top-32 left-6 md:left-10 z-[100]">
        <Link to="/loja" className="flex items-center gap-4 md:gap-6 text-slate-500 hover:text-white transition-all font-black uppercase tracking-[0.4em] text-[8px] md:text-[10px] group">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
            <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </div>
          VOLTAR
        </Link>
      </div>

      <main className="relative">
        <AnimatePresence>
          {blocks.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{blocks.sort((a,b) => a.order - b.order).map(renderBlock)}</motion.div>
          ) : (
            <div className="py-80 text-center container mx-auto px-6 space-y-16">
               <h2 className="text-white font-serif italic text-7xl md:text-9xl tracking-tighter mb-10">{product.title}</h2>
               <p className="text-slate-500 text-2xl font-light italic max-w-2xl mx-auto mb-20">{product.subtitle}</p>
               <a href="#precos" className="bg-blue-600 text-white px-20 py-7 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl">REQUISITAR ACESSO</a>
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-32 bg-[#010309] border-t border-white/5 text-center">
         <div className="container mx-auto px-6 space-y-10">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl mx-auto flex items-center justify-center font-bold text-2xl text-white">CT</div>
            <p className="text-[9px] font-black uppercase tracking-[0.6em] text-slate-600">Claudio Tonelli Group &copy; 2025 // PROTOCOL_S_V6</p>
         </div>
      </footer>
    </div>
  );
};

export default ProductPage;