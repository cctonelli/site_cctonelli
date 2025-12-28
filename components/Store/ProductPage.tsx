
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProductBySlug, fetchProductVariants, fetchProductContentBlocks, fetchSiteConfig } from '../../services/supabaseService';
import { SITE_CONFIG } from '../../services/localRegistry';
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
  const [config, setConfig] = useState<any>(SITE_CONFIG);

  useEffect(() => {
    fetchSiteConfig().then(setConfig);
  }, []);

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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-8">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 border-2 border-blue-600/10 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 border-t-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
      <p className="text-blue-500 font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">Sincronizando Protocolo Ativo...</p>
    </div>
  );

  if (!product) return null;

  const isMatrixSlug = slug?.toLowerCase().includes('v8') || slug?.toLowerCase().includes('matrix');
  const blockColor = isMatrixSlug ? '#00ff41' : config.theme.primary;

  const renderBlock = (block: ProductContentBlock) => {
    const { content, block_type } = block;

    switch (block_type) {
      case 'hero':
        return (
          <section key={block.id} className="pt-48 pb-64 relative bg-black overflow-hidden border-b border-white/5 min-h-[90vh] flex items-center">
            {isMatrixSlug && (
              <div className="scanline" style={{ background: `linear-gradient(0deg, rgba(0,0,0,0) 0%, ${blockColor}30 50%, rgba(0,0,0,0) 100%)` }}></div>
            )}
            <div className="container mx-auto px-6 relative z-10 text-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="inline-block px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.6em] bg-black/40 border backdrop-blur-md animate-pulse mb-16" 
                style={{ borderColor: `${blockColor}60`, color: blockColor, boxShadow: `0 0 30px ${blockColor}40` }}
              >
                {content.overlay_text || 'SYSTEM_CORE_ACTIVE'}
              </motion.div>
              <h1 
                className={`text-6xl md:text-[8rem] lg:text-[11rem] font-serif leading-[0.8] italic tracking-tighter text-white mb-12 ${isMatrixSlug ? 'glitch-text' : ''}`} 
                data-text={content.title || product.title}
                style={isMatrixSlug ? { textShadow: `0 0 50px ${blockColor}60` } : {}}
              >
                {content.title || product.title}
              </h1>
              {content.glitch_title && (
                <div className="font-mono text-xl md:text-4xl font-black uppercase tracking-[1em] py-8 animate-pulse" style={{ color: blockColor, textShadow: `0 0 20px ${blockColor}80` }}>
                  {content.glitch_title}
                </div>
              )}
              <p className="text-xl md:text-3xl text-slate-400 font-light italic leading-relaxed max-w-4xl mx-auto mb-20 bg-black/40 backdrop-blur-sm p-6 rounded-3xl border border-white/5">
                {content.subtitle || product.subtitle}
              </p>
              <div className="flex flex-wrap justify-center gap-6 md:gap-10">
                  <button 
                    onClick={() => scrollToSection('precos')}
                    className="text-black px-12 md:px-20 py-6 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] md:text-[12px] shadow-2xl transition-all hover:scale-110 active:scale-95 outline-none" 
                    style={{ backgroundColor: blockColor, boxShadow: `0 20px 60px ${blockColor}50` }}
                  >
                    {content.cta_text || 'VER PLANOS'}
                  </button>
                  <Link to="/loja" className="bg-white/5 text-slate-500 border border-white/10 px-10 md:px-16 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-[11px] hover:bg-white/10 hover:text-white transition-all backdrop-blur-md">MAIS ATIVOS</Link>
              </div>
            </div>
          </section>
        );

      case 'features':
        return (
          <section key={block.id} className="py-32 md:py-48 bg-black/80 relative border-b border-white/5 backdrop-blur-md">
            <div className="container mx-auto px-6 relative z-10">
              <h3 className="text-center text-4xl md:text-6xl font-serif italic text-white mb-24 md:mb-32">
                {content.title || 'Arquitetura de Ativos'}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                {content.items?.map((item: any, i: number) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ y: -15, scale: 1.02 }} 
                    className={`p-12 rounded-[3.5rem] bg-slate-900/40 border border-white/5 hover:border-white/20 transition-all group backdrop-blur-xl relative overflow-hidden ${content.style === 'glitch_grid' ? 'hover:shadow-[0_0_30px_rgba(0,255,65,0.2)]' : ''}`} 
                  >
                    <div className="w-20 h-20 rounded-[1.8rem] bg-white/5 flex items-center justify-center text-4xl mb-10 group-hover:rotate-12 duration-500 transition-all" style={{ backgroundColor: `${blockColor}15`, color: blockColor, boxShadow: `inset 0 0 25px ${blockColor}20` }}>
                      {item.icon === 'brain' ? '🧠' : item.icon === 'shield' ? '🛡️' : item.icon === 'zap' ? '⚡' : item.icon === 'robot' ? '🤖' : item.icon === 'lock' ? '🔒' : '⚙️'}
                    </div>
                    <p className="text-slate-400 text-lg md:text-xl font-light italic leading-relaxed group-hover:text-white transition-colors">
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
          <section key={block.id} className="py-32 md:py-48 bg-black border-b border-white/5">
             <div className="container mx-auto px-6">
                <h3 className="text-center text-4xl md:text-6xl font-serif italic text-white mb-24">{content.title || 'Visual Intelligence'}</h3>
                <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
                   {content.images?.map((img: any, i: number) => (
                      <div key={i} className="group relative rounded-[4rem] overflow-hidden border border-white/5 shadow-2xl">
                         <img src={img.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000" alt={img.caption} />
                         <div className="absolute bottom-10 left-10 bg-black/50 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            {img.caption}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </section>
        );

      case 'video':
        return (
          <section key={block.id} className="py-32 md:py-48 bg-slate-950 border-b border-white/5">
             <div className="container mx-auto px-6 max-w-6xl text-center">
                <h3 className="text-4xl md:text-6xl font-serif italic text-white mb-24">{content.title || 'Demo Exclusiva'}</h3>
                <div className={`aspect-video rounded-[4rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] relative group border-4 ${content.style === 'matrix_border' ? 'border-green-500/30 shadow-[0_0_40px_rgba(0,255,65,0.2)]' : 'border-white/5'}`}>
                   <iframe src={content.video_url} className="w-full h-full" frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
                </div>
             </div>
          </section>
        );

      case 'cta':
        return (
          <section key={block.id} className="py-48 bg-gradient-to-b from-black to-slate-900 border-b border-white/5 text-center">
             <div className="container mx-auto px-6 space-y-12">
                <h2 className={`text-5xl md:text-[6rem] font-serif italic text-white tracking-tighter leading-none ${content.style === 'glitch_activation' ? 'glitch-text' : ''}`} data-text={content.title}>{content.title || 'Pronto para a Transição?'}</h2>
                <button 
                  onClick={() => scrollToSection('precos')}
                  className="px-20 py-8 rounded-3xl font-black uppercase tracking-[0.5em] text-[11px] shadow-2xl transition-all hover:scale-110 active:scale-95"
                  style={{ backgroundColor: blockColor, color: '#000' }}
                >
                   {content.button_text || 'ATIVAR PROTOCOLO'}
                </button>
             </div>
          </section>
        );

      case 'comparison':
        return (
          <section key={block.id} id="precos" className="py-48 md:py-64 bg-black/90 relative border-y border-white/5 scroll-mt-32 backdrop-blur-xl">
            <div className="container mx-auto px-6 relative z-10">
              <header className="text-center mb-32 md:mb-40 space-y-10">
                <div className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-500">Tier Selection // Operational Access</div>
                <h3 className={`text-6xl md:text-[9rem] font-serif italic text-white tracking-tighter ${isMatrixSlug || content.style === 'terminal_matrix' ? 'glitch-text' : ''}`} data-text={content.title || 'Níveis de Poder'}>
                  {content.title || 'Níveis de Poder'}
                </h3>
              </header>
              <div className="grid lg:grid-cols-4 gap-8 md:gap-12 max-w-[1500px] mx-auto">
                {variants.map((v) => (
                  <div key={v.id} className={`p-12 rounded-[4rem] border flex flex-col justify-between transition-all duration-700 backdrop-blur-3xl ${v.is_most_popular ? 'text-white shadow-2xl scale-110 z-10' : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/10 hover:bg-slate-900/80'}`} style={v.is_most_popular ? { backgroundColor: `${blockColor}cc`, borderColor: blockColor, boxShadow: `0 50px 120px -20px ${blockColor}60` } : {}}>
                    <div className="space-y-12">
                      <div className="space-y-6">
                        <div className="flex justify-between items-start">
                          <h4 className={`text-3xl font-serif italic ${v.is_most_popular ? 'text-black' : 'text-white'}`}>{v.name}</h4>
                          {v.is_most_popular && <span className="text-[8px] font-black uppercase tracking-widest px-4 py-2 bg-black text-white rounded-full">ELITE MASTER</span>}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-lg font-light ${v.is_most_popular ? 'text-black/60' : 'text-slate-500'}`}>R$</span>
                          <span className={`text-5xl md:text-6xl font-bold tracking-tighter ${v.is_most_popular ? 'text-black' : 'text-white'}`}>{v.price.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                      <ul className="space-y-6">
                        {v.features?.map((f, fi) => (
                          <li key={fi} className="flex gap-4 text-sm font-light italic items-start">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${v.is_most_popular ? 'bg-black text-white' : 'bg-white/10 text-white'}`}>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                            </div>
                            <span className={v.is_most_popular ? 'text-black font-medium' : 'text-slate-300'}>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link to={`/loja/${product.slug}/checkout?variant_id=${v.id}`} className={`w-full py-7 mt-16 rounded-[2rem] font-black uppercase tracking-[0.5em] text-[10px] text-center transition-all shadow-xl active:scale-95 ${v.is_most_popular ? 'bg-black text-white hover:bg-slate-800' : 'text-black hover:scale-105'}`} style={!v.is_most_popular ? { backgroundColor: blockColor } : {}}>
                      ATIVAR PROTOCOLO
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      default:
        return <div key={block.id}>{block_type} block placeholder</div>;
    }
  };

  return (
    <div className="min-h-screen bg-black transition-colors relative selection:bg-white selection:text-black">
      {/* Persistência do Matrix Rain na Product Page V8/Simulator */}
      {isMatrixSlug && (
        <MatrixRain 
          color={blockColor} 
          speed={0.8} 
          opacity={0.15} 
          fontSize={14} 
          intensity="ultra" 
        />
      )}

      <div className="fixed top-24 md:top-32 left-6 md:left-10 z-[100]">
        <Link to="/loja" className="flex items-center gap-4 md:gap-6 text-slate-500 hover:text-white transition-all font-black uppercase tracking-[0.4em] text-[8px] md:text-[10px] group">
          <div className="w-10 h-10 md:w-16 md:h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all backdrop-blur-md">
            <svg className="h-4 w-4 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </div>
          VOLTAR
        </Link>
      </div>

      <main className="relative">
        <AnimatePresence>
          {blocks.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {blocks.sort((a,b) => a.order - b.order).map(renderBlock)}
            </motion.div>
          ) : (
            <div className="py-80 text-center container mx-auto px-6 space-y-16">
               <h2 className="text-white font-serif italic text-7xl md:text-[12rem] tracking-tighter mb-10 leading-none">{product.title}</h2>
               <p className="text-slate-500 text-2xl font-light italic max-w-2xl mx-auto mb-20">{product.subtitle}</p>
               <button onClick={() => scrollToSection('precos')} className="bg-blue-600 text-white px-20 py-7 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl">REQUISITAR ACESSO</button>
               <section id="precos" className="scroll-mt-32 pt-20">
                  <div className="text-slate-600 font-mono text-sm uppercase tracking-widest">Pricing Protocol Loading...</div>
               </section>
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-40 bg-black border-t border-white/5 text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-grid opacity-10"></div>
         <div className="container mx-auto px-6 space-y-12 relative z-10">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl mx-auto flex items-center justify-center font-bold text-3xl text-white">CT</div>
            <p className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-700 italic">Claudio Tonelli Advisory Group &copy; 2025 // SOVEREIGN_PROTOCOL</p>
         </div>
      </footer>
    </div>
  );
};

export default ProductPage;
