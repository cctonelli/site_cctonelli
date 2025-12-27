
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProductBySlug, fetchProductVariants, createOrder } from '../../services/supabaseService';
import { Product, ProductVariant, Profile, Order } from '../../types';
import { Language } from '../../services/i18nService';

interface CheckoutPageProps {
  profile: Profile | null;
  onAuthRequest: () => void;
  language: Language;
  t: any;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ profile, onAuthRequest, language, t }) => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const variantId = queryParams.get('variant_id');

  const [product, setProduct] = useState<Product | null>(null);
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (slug && variantId) {
      setLoading(true);
      fetchProductBySlug(slug).then(async (data) => {
        if (!data) { navigate('/loja'); return; }
        setProduct(data);
        const variants = await fetchProductVariants(data.id);
        const chosen = variants.find(v => v.id === variantId);
        if (!chosen) { navigate(`/loja/${slug}`); return; }
        setVariant(chosen);
        setLoading(false);
      });
    } else {
      navigate('/loja');
    }
  }, [slug, variantId, navigate]);

  const handleProcessOrder = async () => {
    if (!profile) {
      onAuthRequest();
      return;
    }

    if (!product || !variant) return;

    setStatus('processing');
    
    // Geração de payload PIX estático manual para fins de demo/venda direta
    const randomRef = Math.random().toString(16).slice(2, 6).toUpperCase();
    const pixPayload = `00020126580014br.gov.bcb.pix0136contato@claudiotonelli.com.br520400005303986540${variant.price.toFixed(2)}5802BR5925Claudio Tonelli Consulto6009SAO PAULO62070503***6304${randomRef}`;

    const newOrder: Partial<Order> = {
      user_id: profile.id,
      product_id: product.id,
      variant_id: variant.id,
      amount: variant.price,
      status: 'pending',
      payment_method: 'pix',
      pix_qrcode_url: `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(pixPayload)}&bgcolor=ffffff&color=010309`
    };

    try {
      const result = await createOrder(newOrder);
      if (result) {
        setOrder(result);
        setStatus('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error("Order Creation Error:", err);
      setStatus('error');
    }
  };

  if (loading || !product || !variant) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6 pt-20">
      <div className="w-16 h-16 border-t-2 border-blue-600 rounded-full animate-spin"></div>
      <span className="text-[10px] uppercase tracking-[0.5em] text-slate-500 font-black animate-pulse">Sincronizando Protocolo de Checkout...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#010309] pt-32 pb-40 transition-colors relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[80vh] bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <header className="mb-24 text-center space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-blue-500 font-black uppercase tracking-[0.5em] text-[10px] bg-blue-600/5 px-8 py-3 rounded-full inline-block border border-blue-600/10">
            Secure Transaction Gate // V13.0-ELITE
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-8xl font-serif dark:text-white text-slate-900 italic tracking-tighter">
            Executive <span className="text-blue-600">Checkout.</span>
          </motion.h1>
        </header>

        <div className="grid lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {status === 'success' && order ? (
                <motion.div key="success-state" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 border border-blue-600/20 rounded-[4rem] p-12 lg:p-20 shadow-2xl text-center space-y-12">
                  <div className="space-y-6">
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 border border-green-500/20 animate-bounce">
                      <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-4xl font-serif italic dark:text-white text-slate-900">Pedido Protocolado.</h2>
                    <p className="text-slate-500 text-lg font-light italic leading-relaxed">Pague via PIX para ativação imediata após conferência administrativa (até 24h).</p>
                  </div>

                  <div className="max-w-[350px] mx-auto p-12 bg-white rounded-[4rem] shadow-2xl border-4 border-slate-100">
                    <img src={order.pix_qrcode_url || ''} className="w-full h-full object-contain" alt="PIX QR Code" />
                  </div>

                  <div className="p-10 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4 text-center">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor exato</span>
                     <div className="text-3xl font-bold dark:text-white text-slate-900">R$ {order.amount.toFixed(2)}</div>
                  </div>

                  <div className="flex justify-center gap-10 pt-6">
                     <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Home</Link>
                     <button onClick={() => navigate('/#portal')} className="text-[10px] font-black uppercase tracking-widest text-blue-500">Ver Meus Ativos</button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                   <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[4rem] p-12 lg:p-16 shadow-2xl space-y-12">
                      <div className="flex gap-10 items-center">
                         <div className="w-40 h-40 rounded-[3rem] bg-slate-100 dark:bg-slate-950 border border-white/5 overflow-hidden shrink-0">
                            {product.image_url && <img src={product.image_url} className="w-full h-full object-cover" />}
                         </div>
                         <div className="space-y-4">
                            <span className="text-blue-500 font-black uppercase tracking-widest text-[10px]">Item Selecionado</span>
                            <h2 className="text-4xl font-serif dark:text-white text-slate-900 italic leading-none">{product.title}</h2>
                            <div className="text-blue-600 font-bold text-xl">{variant.name}</div>
                         </div>
                      </div>
                      <div className="pt-10 border-t border-slate-100 dark:border-white/5 grid md:grid-cols-2 gap-10">
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Termos de Ativação</h4>
                            <p className="text-sm text-slate-500 italic font-light leading-relaxed">A liberação deste ativo requer auditoria manual do PIX. O status mudará automaticamente no seu Portal.</p>
                         </div>
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vantagens</h4>
                            <ul className="space-y-2">
                               {variant.features.slice(0, 4).map((f, i) => (
                                 <li key={i} className="text-xs text-slate-400 font-light italic flex items-center gap-2">
                                    <span className="text-blue-500">✓</span> {f}
                                 </li>
                               ))}
                            </ul>
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside className="lg:col-span-5">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-[4rem] p-12 shadow-2xl space-y-12 sticky top-32">
               <div className="space-y-6">
                  <div className="flex justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
                     <span>Investimento</span>
                     <span className="text-lg">R$ {variant.price.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col gap-2">
                     <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Total à Pagar</span>
                     <div className="text-6xl font-bold dark:text-white text-slate-900 tracking-tighter">R$ {variant.price.toLocaleString('pt-BR')}</div>
                  </div>
               </div>

               {status !== 'success' && (
                 <div className="space-y-8">
                    <button onClick={handleProcessOrder} disabled={status === 'processing'} className="w-full py-7 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase tracking-[0.5em] text-[10px] transition-all shadow-2xl active:scale-95 disabled:opacity-50">
                       {status === 'processing' ? 'SINCRONIZANDO...' : (profile ? 'GERAR PROTOCOLO PIX' : 'CONECTAR PARA COMPRAR')}
                    </button>
                    <div className="flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-500 opacity-60">
                       <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                       Auditado por Claudio Tonelli Consultoria
                    </div>
                 </div>
               )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
