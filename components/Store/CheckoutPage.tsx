
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
  const [countdown, setCountdown] = useState(600); // 10 minutos para pagamento

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

  useEffect(() => {
    let timer: any;
    if (status === 'success' && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [status, countdown]);

  const handleProcessOrder = async () => {
    if (!profile) { onAuthRequest(); return; }
    if (!product || !variant) return;

    setStatus('processing');
    const randomRef = Math.random().toString(16).slice(2, 8).toUpperCase();
    
    // Payload PIX Estático (Chave: contato@claudiotonelli.com.br)
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
      console.error("Order Fail:", err);
      setStatus('error');
    }
  };

  const copyPix = () => {
    const randomRef = Math.random().toString(16).slice(2, 8).toUpperCase();
    const pixPayload = `00020126580014br.gov.bcb.pix0136contato@claudiotonelli.com.br520400005303986540${variant?.price.toFixed(2)}5802BR5925Claudio Tonelli Consulto6009SAO PAULO62070503***6304${randomRef}`;
    navigator.clipboard.writeText(pixPayload);
    alert("CÓDIGO PIX COPIADO PARA A ÁREA DE TRANSFERÊNCIA");
  };

  const sendConfirmationWhatsApp = () => {
    if (!product || !variant || !order) return;
    const text = encodeURIComponent(`Olá Claudio,\n\nAcabei de realizar o PIX para o ativo: *${product.title}*\nPlano: *${variant.name}*\nRef do Pedido: *#${order.id.slice(0,8)}*\n\nEstou enviando o comprovante em anexo para ativação do protocolo.`);
    window.open(`https://wa.me/5544997328888?text=${text}`, '_blank');
  };

  if (loading || !product || !variant) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6 pt-20">
      <div className="w-16 h-16 border-t-2 border-blue-600 rounded-full animate-spin"></div>
      <span className="text-[10px] uppercase tracking-[0.5em] text-slate-500 font-black animate-pulse">Sincronizando Gateway...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#010309] pt-32 pb-40 transition-colors relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[80vh] bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <header className="mb-24 text-center space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-blue-500 font-black uppercase tracking-[0.6em] text-[10px] bg-blue-600/5 px-8 py-3 rounded-full border border-blue-600/10 inline-block">
            Secure Payment Gateway // SOVEREIGN_V18.8
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-8xl font-serif dark:text-white text-slate-900 italic tracking-tighter">
            Protocolo de <br/><span className="text-blue-600">Aquisição.</span>
          </motion.h1>
        </header>

        <div className="grid lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {status === 'success' && order ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 border border-blue-600/20 rounded-[4rem] p-12 lg:p-20 shadow-3xl text-center space-y-12 backdrop-blur-3xl">
                  <div className="space-y-6">
                    <div className="text-[10px] font-black uppercase tracking-[0.5em] text-green-500 mb-4 animate-pulse">Pedido Aguardando Pagamento</div>
                    <div className="max-w-[320px] mx-auto p-12 bg-white rounded-[4rem] shadow-2xl border-4 border-slate-50 relative group">
                       <img src={order.pix_qrcode_url || ''} className="w-full h-full object-contain" alt="PIX" />
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-[3.8rem]">
                          <span className="text-white text-[10px] font-black uppercase tracking-widest">Escaneie no seu App</span>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                     <div className="p-10 bg-slate-50 dark:bg-white/5 rounded-[2.5rem] border border-white/5 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Valor exato do protocolo</p>
                        <p className="text-5xl font-bold dark:text-white text-slate-900 tracking-tighter">R$ {variant.price.toLocaleString('pt-BR')}</p>
                     </div>
                     <div className="grid sm:grid-cols-2 gap-4">
                        <button onClick={copyPix} className="w-full py-6 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl">COPIAR PIX</button>
                        <button onClick={sendConfirmationWhatsApp} className="w-full py-6 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-green-500 transition-all shadow-xl">JÁ PAGUEI (WHATSAPP)</button>
                     </div>
                  </div>

                  <div className="pt-10 border-t border-slate-100 dark:border-white/5">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span>SESSÃO EXPIRA EM:</span>
                        <span className="text-blue-500">{Math.floor(countdown/60)}:{(countdown%60).toString().padStart(2, '0')}</span>
                     </div>
                  </div>

                  <div className="flex justify-center gap-10">
                     <Link to="/" className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors underline decoration-slate-800">Voltar à Home</Link>
                     <button onClick={() => navigate('/')} className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors underline">Minha Conta</button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                   <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[4rem] p-12 lg:p-16 shadow-2xl">
                      <div className="flex gap-10 items-center mb-12">
                         <div className="w-40 h-40 rounded-[3rem] bg-slate-950 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                            {product.image_url ? <img src={product.image_url} className="w-full h-full object-cover opacity-80" /> : <span className="text-6xl font-serif text-white">CT</span>}
                         </div>
                         <div className="space-y-3">
                            <span className="text-blue-500 font-black uppercase tracking-widest text-[9px]">Ativo de Performance</span>
                            <h2 className="text-4xl md:text-5xl font-serif dark:text-white text-slate-900 italic leading-none">{product.title}</h2>
                            <div className="text-blue-600 font-bold text-2xl">{variant.name}</div>
                         </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-10 border-t border-slate-100 dark:border-white/5 pt-12">
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Processamento</h4>
                            <p className="text-sm text-slate-500 italic font-light leading-relaxed">Liberação automática após auditoria do Ledger Administrativo. Tempo médio: 15 min.</p>
                         </div>
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Incluso no Protocolo</h4>
                            <ul className="space-y-3">
                               {variant.features.slice(0, 3).map((f, i) => (
                                 <li key={i} className="text-xs text-slate-400 font-light italic flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div> {f}
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
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-[4rem] p-12 shadow-3xl space-y-12 sticky top-32 backdrop-blur-xl">
               <div className="space-y-8">
                  <div className="flex justify-between items-center text-slate-500 text-[10px] font-black uppercase tracking-widest">
                     <span>Investimento Nominal</span>
                     <span className="text-lg">R$ {variant.price.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="pt-8 border-t border-slate-100 dark:border-white/5 space-y-3">
                     <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Total à Pagar (Tax Free)</span>
                     <div className="text-6xl font-bold dark:text-white text-slate-900 tracking-tighter">R$ {variant.price.toLocaleString('pt-BR')}</div>
                  </div>
               </div>

               {status !== 'success' && (
                 <div className="space-y-8">
                    <button 
                      onClick={handleProcessOrder} 
                      disabled={status === 'processing'} 
                      className="w-full py-8 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase tracking-[0.5em] text-[11px] transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                    >
                       {status === 'processing' ? 'SINCRONIZANDO...' : (profile ? 'GERAR CÓDIGO PIX' : 'CONECTAR PARA COMPRAR')}
                    </button>
                    <div className="flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-500 opacity-60">
                       <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                       Auditado por Claudio Tonelli Advisory Desk
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
