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

  const isMatrixSlug = slug?.toLowerCase().includes('v8') || slug?.toLowerCase().includes('matrix') || slug?.toLowerCase().includes('pill');

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
                className={`text-6xl md:text-[11rem] font-serif leading-[0.8] italic tracking-tighter text-white mb-12 ${isMatrixStyle ? 'glitch-text' : ''}`} 
                data-text={content.title || product.title}
                style={isMatrixStyle ? { textShadow: `0 0 40px ${blockColor}40` } : {}}
              >
                {content.title || product.title}
              </h1>
              {content.glitch_title && (
                <div className="font-mono text-2xl md:text-4xl font-black uppercase tracking-[0.8em] py-8 animate-pulse" style={{ color: blockColor, textShadow: `0 0 15px ${blockColor}60` }}>{content.glitch_title}</div>
              )}
              <p className="text-2xl md:text-4xl text-slate-500 font-light italic leading-relaxed max-w-4xl mx-auto mb-20">{content.subtitle || product.subtitle}</p>
              <div className="flex justify-center gap-8">
                  <a href="#pricing" className="text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl transition-all hover:scale-105 active:scale-95" style={{ backgroundColor: blockColor, boxShadow: `0 20px 40px ${blockColor}30` }}>Ativar Agora</a>
                  <Link to="/loja" className="bg-white/5 text-slate-500 border border-white/10 px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-white/10 hover:text-white transition-all">Outros Ativos</Link>
              </div>
            </div>
          </section>
        );

      case 'features':
        return (
          <section key={block.id} className="py-48 bg-[#010309] relative border-b border-white/5 overflow-hidden">
             {isMatrixStyle && <div className="absolute inset-0 bg-grid opacity-10"></div>}
            <div className="container mx-auto px-6 relative z-10">
              <h3 className="text-center text-5xl font-serif italic text-white mb-32">{content.title || 'Arquitetura de Ativos'}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
                {content.items?.map((item: any, i: number) => (
                  <motion.div key={i} whileHover={{ y: -10 }} className="p-12 rounded-[3.5rem] bg-slate-900/60 border border-white/5 hover:border-white/20 transition-all group backdrop-blur-xl" style={{ hoverBorderColor: `${blockColor}40` }}>
                    <div className="w-20 h-20 rounded-[1.8rem] bg-white/5 flex items-center justify-center text-4xl mb-10 group-hover:scale-110 duration-500 transition-all" style={{ backgroundColor: `${blockColor}10`, color: blockColor, boxShadow: `inset 0 0 20px ${blockColor}20` }}>
                      {item.icon === 'brain' ? '🧠' : item.icon === 'shield' ? '🛡️' : item.icon === 'zap' ? '⚡' : '🤖'}
                    </div>
                    <p className="text-slate-400 text-xl font-light italic leading-relaxed group-hover:text-white transition-colors">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'comparison':
        return (
          <section key={block.id} id="pricing" className="py-64 bg-black relative border-y border-white/5">
             {isMatrixStyle && <MatrixRain color={blockColor} speed={0.5} opacity={0.05} fontSize={10} />}
            <div className="container mx-auto px-6 relative z-10">
              <h3 className={`text-center text-7xl md:text-[8rem] font-serif italic text-white tracking-tighter mb-40 ${isMatrixStyle ? 'glitch-text' : ''}`} data-text={content.title || 'Níveis de Poder'}>
                {content.title || 'Níveis de Poder'}
              </h3>
              <div className="grid lg:grid-cols-3 gap-16 max-w-7xl mx-auto">
                {variants.map((v) => (
                  <div key={v.id} className={`p-16 rounded-[4.5rem] border flex flex-col justify-between transition-all duration-700 backdrop-blur-2xl ${v.is_most_popular ? 'text-white shadow-2xl scale-105 z-10' : 'bg-slate-900/40 border-white/5 text-slate-400 hover:border-white/10'}`} style={v.is_most_popular ? { backgroundColor: `${blockColor}dd`, borderColor: blockColor, boxShadow: `0 40px 100px -20px ${blockColor}40` } : {}}>
                    <div className="space-y-12">
                      <div className="space-y-4">
                        <h4 className="text-4xl font-serif italic text-white">{v.name}</h4>
                        <div className="text-6xl font-bold tracking-tighter text-white">R$ {v.price.toLocaleString('pt-BR')}</div>
                      </div>
                      <ul className="space-y-6">
                        {v.features?.map((f, fi) => (
                          <li key={fi} className="flex gap-4 text-sm font-light italic">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${v.is_most_popular ? 'bg-white' : 'bg-white/10'}`} style={v.is_most_popular ? { color: blockColor } : { color: blockColor }}>✓</div>
                            <span className={v.is_most_popular ? 'text-white' : 'text-slate-300'}>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link to={`/loja/${product.slug}/checkout?variant_id=${v.id}`} className={`w-full py-8 mt-24 rounded-3xl font-black uppercase tracking-[0.6em] text-[11px] text-center transition-all ${v.is_most_popular ? 'bg-white hover:bg-slate-100' : 'text-white hover:scale-105'}`} style={v.is_most_popular ? { color: blockColor } : { backgroundColor: blockColor }}>
                      ATIVAR PROTOCOLO
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
    <div className="min-h-screen bg-black transition-colors relative">
      <div className="fixed top-32 left-10 z-[100] hidden xl:block">
        <Link to="/loja" className="flex items-center gap-6 text-slate-500 hover:text-white transition-all font-black uppercase tracking-[0.5em] text-[10px] group">
          <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </div>
          VOLTAR
        </Link>
      </div>

      <main className="relative">
        <AnimatePresence>
          {blocks.length > 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{blocks.map(renderBlock)}</motion.div>
          ) : (
            <div className="py-80 text-center container mx-auto px-6">
               <h2 className="text-white font-serif italic text-7xl md:text-9xl tracking-tighter mb-10">{product.title}</h2>
               <p className="text-slate-500 text-2xl font-light italic max-w-2xl mx-auto mb-20">{product.subtitle}</p>
               <a href="#pricing" className="bg-blue-600 text-white px-20 py-7 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl">REQUISITAR ACESSO</a>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ProductPage;