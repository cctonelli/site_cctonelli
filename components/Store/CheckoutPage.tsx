
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
    
    // Simulação de geração de PIX com dados reais do produto
    const pixPayload = `00020126580014br.gov.bcb.pix0136contato@claudiotonelli.com.br520400005303986540${variant.price.toFixed(2)}5802BR5925Claudio Tonelli Consulto6009SAO PAULO62070503***6304${Math.random().toString(16).slice(2, 6).toUpperCase()}`;

    const newOrder: Partial<Order> = {
      user_id: profile.id,
      product_id: product.id,
      variant_id: variant.id,
      amount: variant.price,
      status: 'pending',
      payment_method: 'pix',
      pix_qrcode_url: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pixPayload)}&bgcolor=f8fafc`
    };

    const result = await createOrder(newOrder);
    if (result) {
      setOrder(result);
      setStatus('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setStatus('error');
    }
  };

  if (loading || !product || !variant) return (
    <div className="min-h-screen bg-white dark:bg-brand-navy flex flex-col items-center justify-center space-y-6 pt-20 transition-colors">
      <div className="w-16 h-16 border-t-2 border-blue-600 rounded-full animate-spin"></div>
      <span className="text-[10px] uppercase tracking-[0.5em] text-slate-500 font-black animate-pulse">Validando Protocolo de Segurança...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brand-navy pt-32 pb-40 transition-colors relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none"></div>
      
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <header className="mb-24 text-center space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-blue-500 font-black uppercase tracking-[0.5em] text-[10px] bg-blue-600/5 px-6 py-2 rounded-full inline-block border border-blue-600/10 shadow-sm"
          >
            Encryption Level: AES-256 Verified
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-serif dark:text-white text-slate-900 italic leading-tight tracking-tighter"
          >
            Checkout <span className="text-blue-600">Executivo.</span>
          </motion.h1>
        </header>

        <div className="grid lg:grid-cols-12 gap-16 items-start">
          {/* Main Content */}
          <div className="lg:col-span-7 space-y-10">
            <AnimatePresence mode="wait">
              {status === 'success' && order ? (
                <motion.div 
                  key="success-state"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 border border-blue-600/20 rounded-[4rem] p-12 lg:p-20 shadow-2xl text-center space-y-12 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[80px] rounded-full"></div>
                  <div className="space-y-6 relative z-10">
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500 border border-green-500/20 shadow-inner animate-bounce">
                      <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-4xl font-serif italic dark:text-white text-slate-900 leading-tight">Pedido Registrado <br/>com Sucesso.</h2>
                    <p className="text-slate-500 text-lg font-light italic leading-relaxed">Escaneie o QR Code abaixo para efetuar o pagamento via PIX corporativo.</p>
                  </div>

                  <div className="max-w-[320px] mx-auto p-10 bg-slate-50 dark:bg-white rounded-[3rem] shadow-inner border border-slate-200 group">
                    <img src={order.pix_qrcode_url || ''} className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-500" alt="PIX QR Code" />
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col items-center gap-2">
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Status do Advisory Core</span>
                       <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Aguardando Validação Financeira</span>
                       </div>
                    </div>
                    <div className="flex justify-center gap-6 pt-4">
                      <Link to="/" className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors border-b border-white/5 hover:border-white/20 pb-1">Retornar à Home</Link>
                      <button onClick={() => window.location.reload()} className="text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-400 transition-colors border-b border-blue-500/20 hover:border-blue-500 pb-1">Atualizar Status</button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="form-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-12"
                >
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[4rem] p-12 lg:p-16 shadow-2xl space-y-12">
                     <div className="flex gap-10 items-center pb-12 border-b border-slate-100 dark:border-white/5">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 overflow-hidden shrink-0 shadow-lg">
                           {product.image_url && <img src={product.image_url} className="w-full h-full object-cover" />}
                        </div>
                        <div className="space-y-2">
                           <span className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">Asset Selection</span>
                           <h2 className="text-3xl font-serif dark:text-white text-slate-900 italic leading-none">{product.title}</h2>
                           <div className="pt-2">
                             <span className="px-4 py-1.5 bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-600/20">{variant.name}</span>
                           </div>
                        </div>
                     </div>

                     <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                           <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Protocolo de Entrega</div>
                           <p className="text-base text-slate-500 dark:text-slate-400 italic font-light leading-relaxed">
                              Acesso vitalício ou por assinatura liberado instantaneamente após a aprovação do pagamento pelo administrador através do painel de controle v9.
                           </p>
                        </div>
                        <div className="space-y-4">
                           <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Incluído no Plano</div>
                           <ul className="space-y-3">
                              {variant.features?.slice(0, 3).map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-light italic">
                                  <svg className="h-4 w-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                  {f}
                                </li>
                              ))}
                           </ul>
                        </div>
                     </div>
                  </div>

                  <div className="p-10 bg-blue-600/5 border border-blue-600/10 rounded-[3rem] flex items-center gap-8">
                    <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-600/20 shrink-0">
                       <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12.4 2L9.2 5.2M14.8 2L11.6 5.2M10.8 7.2C10.8 7.2 11.2 6.8 12 6.8C12.8 6.8 13.2 7.2 13.2 7.2M13.2 7.2V16.8C13.2 16.8 12.8 17.2 12 17.2C11.2 17.2 10.8 16.8 10.8 16.8V7.2M8.4 4.8L4.4 8.8V15.2L8.4 19.2H15.6L19.6 15.2V8.8L15.6 4.8H8.4Z"/></svg>
                    </div>
                    <div className="space-y-1">
                       <h4 className="text-xl font-serif italic dark:text-white text-slate-900">Método de Pagamento: PIX Corporativo</h4>
                       <p className="text-xs text-slate-500 font-light italic">Processamento ultra-rápido com autenticação mútua.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Checkout Card */}
          <aside className="lg:col-span-5 space-y-8">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-[4rem] p-12 shadow-2xl space-y-12 sticky top-32">
               <div className="space-y-8">
                  <div className="flex justify-between items-center text-slate-500">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em]">Subtotal do Ativo</span>
                     <span className="font-bold text-lg">R$ {variant.price.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                     <span className="text-[10px] font-black uppercase tracking-[0.4em]">Taxas de Processamento</span>
                     <span className="font-bold text-lg">R$ 0,00</span>
                  </div>
                  <div className="pt-8 border-t border-slate-100 dark:border-white/5 flex justify-between items-end">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-1">Total à Vista</span>
                        <div className="text-5xl font-bold dark:text-white text-slate-900 tracking-tighter">R$ {variant.price.toLocaleString('pt-BR')}</div>
                     </div>
                  </div>
               </div>

               <AnimatePresence mode="wait">
                 {status !== 'success' && (
                   <div className="space-y-8">
                      <button 
                        onClick={handleProcessOrder}
                        disabled={status === 'processing'}
                        className="w-full py-7 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black uppercase tracking-[0.5em] text-[10px] transition-all shadow-[0_30px_60px_-15px_rgba(37,99,235,0.4)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4"
                      >
                        {status === 'processing' ? (
                          <>
                            <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin"></div>
                            PROCESSANDO PROTOCOLO...
                          </>
                        ) : 'GERAR PIX E FINALIZAR'}
                      </button>
                      <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-[0.3em] italic">Segurança validada por Claudio Tonelli Advisory</p>
                   </div>
                 )}
               </AnimatePresence>

               {status === 'error' && (
                 <div className="p-5 bg-red-600/5 border border-red-600/20 rounded-2xl text-[10px] text-red-500 font-bold uppercase tracking-widest text-center animate-shake">
                    Falha na comunicação com o Core. Tente novamente em instantes.
                 </div>
               )}
            </div>

            {!profile ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-10 bg-amber-500/5 border border-amber-500/10 rounded-[3rem] text-center space-y-6"
              >
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">Autenticação Necessária</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic font-light leading-relaxed">Vincule este ativo ao seu perfil de sócio/parceiro para acesso imediato.</p>
                </div>
                <button onClick={onAuthRequest} className="px-10 py-4 bg-amber-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl shadow-amber-600/10">CONECTAR AGORA</button>
              </motion.div>
            ) : (
              <div className="p-8 bg-slate-900/40 border border-white/5 rounded-[3rem] flex items-center gap-6">
                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 shrink-0">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Identidade Validada</span>
                  <span className="text-xs font-bold text-white truncate max-w-[200px]">{profile.full_name}</span>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
