
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../services/supabaseService';
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

  const loadData = async (targetSlug: string) => {
    setLoading(true);
    try {
      // 1. Fetch Product with direct query (no cache reliance)
      const { data: prod, error: pErr } = await supabase
        .from('products')
        .select('*')
        .eq('slug', targetSlug)
        .maybeSingle();

      if (pErr || !prod) {
        console.error("Critical: Product not found or DB Error", pErr);
        navigate('/loja');
        return;
      }
      setProduct(prod);

      // 2. Fetch dependencies in parallel
      const [vRes, bRes] = await Promise.all([
        supabase.from('product_variants').select('*').eq('product_id', prod.id).order('order_index'),
        supabase.from('product_content_blocks').select('*').eq('product_id', prod.id).order('order')
      ]);

      setVariants(vRes.data || []);
      setBlocks(bRes.data || []);
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
        <div className="absolute inset-0 flex items-center justify-center font-mono text-blue-500 text-[9px] tracking-widest uppercase">Initializing...</div>
      </div>
    </div>
  );

  const isV8Matrix = slug?.toLowerCase().includes('v8') || slug?.toLowerCase().includes('matrix');

  const renderBlock = (block: ProductContentBlock) => {
    const { content, block_type } = block;
    const isMatrix = isV8Matrix || content.style?.includes('matrix');

    switch (block_type) {
      case 'hero':
        return (
          <section key={block.id} className="pt-48 pb-64 relative bg-black overflow-hidden border-b border-white/5">
            <div className="scanline"></div>
            <div className="absolute inset-0 bg-matrix-grid opacity-10"></div>
            <div className="container mx-auto px-6 relative z-10 text-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-block px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.6em] bg-blue-600/10 border border-blue-600/30 text-blue-500 animate-pulse mb-16">
                {content.overlay_text || 'ACTIVE PROTOCOL'}
              </motion.div>
              <h1 className={`text-6xl md:text-[11rem] font-serif leading-[0.8] italic tracking-tighter text-white mb-12 ${isMatrix ? 'glitch-text' : ''}`} data-text={content.title || product.title}>
                {content.title || product.title}
              </h1>
              {content.glitch_title && (
                <div className="text-blue-500 font-mono text-2xl md:text-4xl font-black uppercase tracking-[0.8em] py-8 animate-pulse">{content.glitch_title}</div>
              )}
              <p className="text-2xl md:text-4xl text-slate-500 font-light italic leading-relaxed max-w-4xl mx-auto mb-20">{content.subtitle || product.subtitle}</p>
              {content.video_url && (
                <div className="mt-20 aspect-video max-w-6xl mx-auto rounded-[3.5rem] overflow-hidden shadow-[0_0_120px_rgba(37,99,235,0.25)] border border-blue-600/30 relative bg-slate-900">
                  <iframe src={content.video_url} className="w-full h-full" frameBorder="0" allowFullScreen />
                </div>
              )}
            </div>
          </section>
        );

      case 'features':
        return (
          <section key={block.id} className="py-48 bg-[#010309] relative border-b border-white/5">
            <div className="container mx-auto px-6">
              <h3 className="text-center text-5xl font-serif italic text-white mb-32">{content.title || 'Arquitetura de Ativos'}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
                {content.items?.map((item: any, i: number) => (
                  <motion.div key={i} whileHover={{ y: -10 }} className="p-12 rounded-[3.5rem] bg-slate-900/60 border border-white/5 hover:border-blue-600/40 transition-all group">
                    <div className="w-20 h-20 rounded-[1.8rem] bg-blue-600/10 flex items-center justify-center text-4xl mb-10 group-hover:bg-blue-600 transition-all shadow-xl">
                      {item.icon === 'brain' ? '🧠' : item.icon === 'shield' ? '🛡️' : item.icon === 'zap' ? '⚡' : '🤖'}
                    </div>
                    <p className="text-slate-400 text-xl font-light italic leading-relaxed">{item.text}</p>
                  </motion.div>
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
              <div className="grid lg:grid-cols-3 gap-16 max-w-7xl mx-auto">
                {variants.map((v) => (
                  <div key={v.id} className={`p-16 rounded-[4.5rem] border flex flex-col justify-between transition-all duration-700 ${v.is_most_popular ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_120px_rgba(37,99,235,0.4)] scale-105 z-10' : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-blue-600/30'}`}>
                    <div className="space-y-16">
                      <div className="space-y-4">
                        <h4 className="text-4xl font-serif italic text-white">{v.name}</h4>
                        <div className="text-6xl font-bold tracking-tighter">R$ {v.price.toLocaleString('pt-BR')}</div>
                        <div className="text-[10px] uppercase font-black tracking-widest opacity-60">
                          {v.interval === 'month' ? 'Mensal' : 'Ativo Permanente'}
                        </div>
                      </div>
                      <div className="w-full h-px bg-white/10"></div>
                      <ul className="space-y-6">
                        {v.features?.map((f, fi) => (
                          <li key={fi} className="flex gap-4 text-sm font-light italic">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${v.is_most_popular ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>✓</div>
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

      case 'cta':
        return (
          <section key={block.id} className="py-64 bg-black text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-blue-600/10 animate-pulse"></div>
             <div className="container mx-auto px-6 relative z-10 space-y-16">
                <h3 className="text-5xl md:text-[10rem] font-serif italic text-white tracking-tighter glitch-text leading-none" data-text={content.title || 'Ative sua Vantagem.'}>
                  {content.title || 'Ative sua Vantagem.'}
                </h3>
                <Link to={content.button_link || '#pricing'} className="inline-block px-24 py-9 bg-blue-600 text-white rounded-[3rem] font-black uppercase tracking-[0.6em] text-[12px] hover:bg-blue-500 transition-all shadow-[0_40px_100px_-20px_rgba(37,99,235,0.6)]">
                   {content.button_text || 'INICIAR AGORA'}
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
        .bg-matrix-grid { background-image: radial-gradient(rgba(37, 99, 235, 0.2) 1.5px, transparent 1.5px); background-size: 40px 40px; }
        .scanline { background: linear-gradient(to bottom, transparent 50%, rgba(37, 99, 235, 0.05) 50%); background-size: 100% 4px; animation: scanline-scroll 8s linear infinite; position: absolute; inset: 0; pointer-events: none; z-index: 20; }
        @keyframes scanline-scroll { from { background-position: 0 0; } to { background-position: 0 100%; } }
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
