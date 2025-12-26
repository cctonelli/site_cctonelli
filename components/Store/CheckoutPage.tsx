
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
    const newOrder: Partial<Order> = {
      user_id: profile.id,
      product_id: product.id,
      variant_id: variant.id,
      amount: variant.price,
      status: 'pending',
      payment_method: 'pix',
      pix_qrcode_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=cctonelli-pix-stub-${variant.id}-${Date.now()}` // Mock PIX
    };

    const result = await createOrder(newOrder);
    if (result) {
      setOrder(result);
      setStatus('success');
    } else {
      setStatus('error');
    }
  };

  if (loading || !product || !variant) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 pt-20">
      <div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin"></div>
      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Validando Checkout...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-brand-navy pt-32 pb-24 transition-colors">
      <div className="container mx-auto px-6 max-w-5xl">
        <header className="mb-16 text-center space-y-4">
          <div className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">Security Protocol 8.0.0</div>
          <h1 className="text-4xl md:text-5xl font-serif dark:text-white text-slate-900 italic">Checkout Executivo.</h1>
        </header>

        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Summary */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-[3rem] p-10 lg:p-14 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full"></div>
               <div className="relative z-10 space-y-10">
                  <div className="flex gap-8 items-center pb-10 border-b border-slate-200 dark:border-white/5">
                     <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 overflow-hidden shrink-0">
                        {product.image_url && <img src={product.image_url} className="w-full h-full object-cover" />}
                     </div>
                     <div>
                        <h2 className="text-2xl font-serif dark:text-white text-slate-900 italic">{product.title}</h2>
                        <span className="text-blue-500 font-bold uppercase tracking-widest text-[10px]">{variant.name}</span>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Entrega Estimada</div>
                     <p className="text-sm text-slate-500 dark:text-slate-400 italic font-light leading-relaxed">
                        Após a confirmação do pagamento pelo administrador (Supabase Verify), o link de acesso exclusivo será liberado instantaneamente na sua área logada.
                     </p>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-white/5">
                    {variant.features?.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 font-light italic">
                        <svg className="h-5 w-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {f}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>

          {/* Payment Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-10">
               <div className="space-y-6">
                  <div className="flex justify-between items-center text-slate-500">
                     <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                     <span className="font-bold">R$ {variant.price.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                     <span className="text-[10px] font-black uppercase tracking-widest">Taxas Advisory</span>
                     <span className="font-bold">R$ 0,00</span>
                  </div>
                  <div className="pt-6 border-t border-slate-200 dark:border-white/5 flex justify-between items-end">
                     <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Total Devido</span>
                     <span className="text-4xl font-bold dark:text-white text-slate-900">R$ {variant.price.toLocaleString('pt-BR')}</span>
                  </div>
               </div>

               <AnimatePresence mode="wait">
                 {status === 'success' && order ? (
                   <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 text-center pt-4">
                      <div className="p-6 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] space-y-6 border border-blue-500/20 shadow-xl">
                        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Escaneie o QR Code PIX</div>
                        <img src={order.pix_qrcode_url || ''} className="w-full max-w-[200px] mx-auto rounded-3xl mix-blend-multiply dark:mix-blend-normal" />
                        <button className="w-full py-3 bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all">Copiar Chave Aleatória</button>
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">Aguardando aprovação administrativa...</div>
                      <Link to="/" className="block text-blue-500 font-bold uppercase tracking-widest text-[9px] hover:text-white transition-colors">Voltar para Home</Link>
                   </motion.div>
                 ) : (
                   <div className="space-y-6">
                      <div className="p-6 bg-blue-600/5 border border-blue-600/10 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                           <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.4 2L9.2 5.2M14.8 2L11.6 5.2M10.8 7.2C10.8 7.2 11.2 6.8 12 6.8C12.8 6.8 13.2 7.2 13.2 7.2M13.2 7.2V16.8C13.2 16.8 12.8 17.2 12 17.2C11.2 17.2 10.8 16.8 10.8 16.8V7.2M8.4 4.8L4.4 8.8V15.2L8.4 19.2H15.6L19.6 15.2V8.8L15.6 4.8H8.4Z"/></svg>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Método</span>
                           <span className="text-xs font-bold dark:text-white text-slate-900">PIX Instantâneo</span>
                        </div>
                      </div>

                      <button 
                        onClick={handleProcessOrder}
                        disabled={status === 'processing'}
                        className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] font-black uppercase tracking-[0.4em] text-[10px] transition-all shadow-2xl shadow-blue-600/30 active:scale-[0.98] disabled:opacity-50"
                      >
                        {status === 'processing' ? 'Criptografando Pedido...' : 'Finalizar e Gerar PIX'}
                      </button>
                   </div>
                 )}
               </AnimatePresence>
            </div>

            {!profile && (
              <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-3xl text-center space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Autenticação Necessária</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">Identifique-se para que possamos vincular a ferramenta ao seu CPF/CNPJ.</p>
                <button onClick={onAuthRequest} className="text-[9px] font-black uppercase tracking-widest text-amber-600 border-b border-amber-600/20 pb-1">Conectar-se agora</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
