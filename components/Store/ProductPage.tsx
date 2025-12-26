
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProductBySlug, fetchProductVariants, fetchProductContentBlocks, supabase } from '../../services/supabaseService';
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

  const loadAllData = async (targetSlug: string) => {
    setLoading(true);
    try {
      // 1. Fetch Product
      const { data: prod, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('slug', targetSlug)
        .maybeSingle();

      if (pErr || !prod) {
        console.error("Product fetch failed", pErr);
        navigate('/loja');
        return;
      }
      setProduct(prod);

      // 2. Fetch Variants and Blocks in Parallel
      const [vRes, bRes] = await Promise.all([
        supabase.from('product_variants').select('*').eq('product_id', prod.id).order('order_index'),
        supabase.from('product_content_blocks').select('*').eq('product_id', prod.id).order('order')
      ]);

      setVariants(vRes.data || []);
      setBlocks(bRes.data || []);
    } catch (err) {
      console.error("Critical Render Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadAllData(slug);
    }
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading || !product) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-8">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 border-2 border-blue-600/10 rounded-full"></div>
        <div className="absolute inset-0 border-t-2 border-blue-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center font-mono text-blue-500 text-xs tracking-widest animate-pulse">MATRIX_DECRYPTING...</div>
      </div>
    </div>
  );

  const isV8Matrix = slug?.toLowerCase().includes('v8') || slug?.toLowerCase().includes('matrix');

  const renderBlock = (block: ProductContentBlock) => {
    const { content, block_type } = block;
    const style = content.style || '';
    const isMatrix = isV8Matrix || style.includes('matrix') || style.includes('glitch');

    switch (block_type) {
      case 'hero':
        return (
          <section key={block.id} className="pt-48 pb-64 relative bg-black overflow-hidden border-b border-white/5">
            <div className="scanline"></div>
            <div className="absolute inset-0 bg-matrix-grid opacity-10"></div>
            <div className="container mx-auto px-6 relative z-10 text-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-block px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.6em] bg-blue-600/10 border border-blue-600/30 text-blue-500 animate-pulse mb-16">
                {content.overlay_text || 'ACTIVE PROTOCOL'}
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 50 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-6xl md:text-[11rem] font-serif leading-[0.8] italic tracking-tighter text-white glitch-text mb-12"
                data-text={content.title || product.title}
              >
                {content.title || product.title}
              </motion.h1>
              {content.glitch_title && (
                <div className="text-blue-500 font-mono text-2xl md:text-4xl font-black uppercase tracking-[0.8em] py-8">{content.glitch_title}</div>
              )}
              <p className="text-2xl md:text-4xl text-slate-500 font-light italic leading-relaxed max-w-4xl mx-auto mb-20">{content.subtitle || product.subtitle}</p>
              
              {content.video_url && (
                <div className="mt-20 aspect-video max-w-6xl mx-auto rounded-[3.5rem] overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.2)] border border-blue-600/30 relative">
                  <iframe src={content.video_url} className="w-full h-full" frameBorder="0" allowFullScreen />
                  <div className="absolute inset-0 scanline opacity-20 pointer-events-none"></div>
                </div>
              )}
            </div>
          </section>
        );

      case 'features':
        return (
          <section key={block.id} className="py-48 bg-[#010309] relative border-b border-white/5 overflow-hidden">
            <div className="container mx-auto px-6">
              <h3 className="text-center text-4xl font-serif italic text-white mb-32">{content.title || 'Arquitetura de Ativos'}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
                {content.items?.map((item: any, i: number) => (
                  <motion.div key={i} whileHover={{ y: -10 }} className="p-12 rounded-[3.5rem] bg-slate-900/60 border border-white/5 hover:border-blue-600/40 transition-all group">
                    <div className="w-20 h-20 rounded-[1.8rem] bg-blue-600/10 flex items-center justify-center text-4xl mb-10 group-hover:bg-blue-600 transition-all">
                      {item.icon === 'brain' ? '🧠' : item.icon === 'shield' ? '🛡️' : item.icon === 'zap' ? '⚡' : '🔒'}
                    </div>
                    <p className="text-slate-400 text-xl font-light italic leading-relaxed">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'image_gallery':
        return (
          <section key={block.id} className="py-48 bg-black">
            <div className="container mx-auto px-6 space-y-24 text-center">
              <h3 className="text-4xl font-serif italic text-white glitch-text" data-text={content.title}>{content.title}</h3>
              <div className="grid md:grid-cols-2 gap-16">
                {content.images?.map((img: any, i: number) => (
                  <div key={i} className="relative rounded-[3.5rem] overflow-hidden border border-white/10 aspect-video group shadow-2xl">
                    <img src={img.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-[2s]" alt={img.caption} />
                    <div className="absolute inset-0 scanline opacity-30"></div>
                    <div className="absolute bottom-10 left-10 text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 bg-black/80 px-6 py-3 rounded-2xl border border-white/10">
                      {img.caption}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'comparison':
        return (
          <section key={block.id} id="pricing" className="py-64 bg-black relative border-y border-white/5">
            <div className="absolute inset-0 bg-matrix-grid opacity-10"></div>
            <div className="container mx-auto px-6 relative z-10">
              <h3 className="text-center text-7xl md:text-[10rem] font-serif italic text-white tracking-tighter mb-40 glitch-text" data-text={content.title || 'Níveis de Poder'}>
                {content.title || 'Níveis de Poder'}
              </h3>
              <div className="grid lg:grid-cols-3 gap-16 max-w-7xl mx-auto items-stretch">
                {variants.map((v, i) => (
                  <div key={v.id} className={`p-16 rounded-[4.5rem] border flex flex-col justify-between transition-all duration-700 ${v.is_most_popular ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_120px_rgba(37,99,235,0.4)] scale-105' : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-blue-600/30'}`}>
                    <div className="space-y-16">
                      <div className="space-y-4">
                        <h4 className="text-4xl font-serif italic text-white">{v.name}</h4>
                        <div className="text-6xl font-bold tracking-tighter">R$ {v.price.toLocaleString('pt-BR')}</div>
                        <div className="text-[10px] uppercase font-black tracking-widest opacity-60">
                          {v.interval === 'month' ? 'Mensal' : v.interval === 'semester' ? 'Semestral' : 'Ativo Permanente'}
                        </div>
                      </div>
                      <div className="w-full h-px bg-white/10"></div>
                      <ul className="space-y-6">
                        {v.features?.map((f, fi) => (
                          <li key={fi} className="flex gap-4 text-sm font-light italic">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${v.is_most_popular ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>✓</div>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link to={`/loja/${product.slug}/checkout?variant_id=${v.id}`} className={`w-full py-8 mt-24 rounded-3xl font-black uppercase tracking-[0.6em] text-[11px] text-center transition-all ${v.is_most_popular ? 'bg-white text-blue-600 hover:bg-slate-50' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                      ATIVAR PROTOCOLO
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'video':
        return (
          <section key={block.id} className="py-48 bg-black">
             <div className="container mx-auto px-6 text-center">
               <h3 className="text-4xl font-serif italic text-white mb-20">{content.title}</h3>
               <div className="max-w-7xl mx-auto aspect-video rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-slate-900">
                  <iframe src={content.video_url} className="w-full h-full" frameBorder="0" allowFullScreen />
               </div>
             </div>
          </section>
        );

      case 'cta':
        return (
          <section key={block.id} className="py-64 bg-black text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-blue-600/10 animate-pulse"></div>
             <div className="scanline opacity-20"></div>
             <div className="container mx-auto px-6 relative z-10 space-y-16">
                <h3 className="text-5xl md:text-[9rem] font-serif italic text-white tracking-tighter glitch-text" data-text={content.title}>{content.title}</h3>
                <Link to={content.button_link || '#pricing'} className="inline-block px-24 py-9 bg-blue-600 text-white rounded-[3rem] font-black uppercase tracking-[0.6em] text-[12px] hover:bg-blue-500 transition-all shadow-[0_0_80px_rgba(37,99,235,0.5)] active:scale-95">
                   {content.button_text}
                </Link>
             </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black transition-colors relative">
      <style>{`
        .glitch-text { position: relative; text-shadow: 0.05em 0 0 rgba(255,0,0,.75),-0.025em -0.05em 0 rgba(0,255,0,.75),0.025em 0.05em 0 rgba(0,0,255,.75); animation: glitch 500ms infinite; }
        .glitch-text::before, .glitch-text::after { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.8; }
        .glitch-text::before { animation: glitch 650ms infinite; clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%); transform: translate(-0.025em, -0.0125em); color: #2563eb; z-index: -1; }
        .glitch-text::after { animation: glitch 375ms infinite; clip-path: polygon(0 80%, 100% 20%, 100% 100%, 0 100%); transform: translate(0.0125em, 0.025em); color: #ff0000; z-index: -2; }
        @keyframes glitch { 0% { text-shadow: 0.05em 0 0 rgba(255,0,0,.75), -0.05em -0.025em 0 rgba(0,255,0,.75), -0.025em 0.05em 0 rgba(0,0,255,.75); } 15% { text-shadow: -0.05em -0.025em 0 rgba(255,0,0,.75), 0.025em 0.025em 0 rgba(0,255,0,.75), -0.05em -0.05em 0 rgba(0,0,255,.75); } 50% { text-shadow: 0.025em 0.05em 0 rgba(255,0,0,.75), 0.05em 0 0 rgba(0,255,0,.75), 0 -0.05em 0 rgba(0,0,255,.75); } 100% { text-shadow: -0.025em 0 0 rgba(255,0,0,.75), -0.025em -0.025em 0 rgba(0,255,0,.75), -0.025em -0.05em 0 rgba(0,0,255,.75); } }
        .scanline { background: linear-gradient(to bottom, transparent 50%, rgba(37, 99, 235, 0.1) 50%); background-size: 100% 4px; animation: scanline-scroll 8s linear infinite; position: absolute; inset: 0; pointer-events: none; z-index: 20; }
        @keyframes scanline-scroll { from { background-position: 0 0; } to { background-position: 0 100%; } }
        .bg-matrix-grid { background-image: radial-gradient(rgba(37, 99, 235, 0.2) 1.5px, transparent 1.5px); background-size: 40px 40px; }
      `}</style>

      <div className="fixed top-32 left-10 z-[100] hidden xl:block">
        <Link to="/loja" className="flex items-center gap-6 text-slate-500 hover:text-blue-500 transition-all font-black uppercase tracking-[0.5em] text-[10px] group">
          <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-blue-600/10 group-hover:border-blue-600 transition-all">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </div>
          VOLTAR À LOJA
        </Link>
      </div>

      <main className="relative">
        {blocks.length > 0 ? blocks.map(renderBlock) : (
          <div className="py-80 text-center">
             <h2 className="text-white font-serif italic text-6xl">{product.title}</h2>
             <p className="text-slate-500 mt-10">Este ativo está sendo preparado...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductPage;
