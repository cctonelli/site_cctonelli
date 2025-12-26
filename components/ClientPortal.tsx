
import React, { useEffect, useState, useCallback } from 'react';
import { Product, Profile, Order, UserProduct } from '../types';
import { getPersonalizedRecommendations } from '../services/aiService';
import { fetchUserOrders, fetchUserProducts, supabase } from '../services/supabaseService';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientPortalProps {
  profile: Profile;
  products: Product[];
  onClose: () => void;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ profile, products, onClose }) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'assets'>('catalog');
  const [recommendation, setRecommendation] = useState<string>('Processando dados estratégicos...');
  const [orders, setOrders] = useState<Order[]>([]);
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, productsData] = await Promise.all([
        fetchUserOrders(profile.id),
        fetchUserProducts(profile.id)
      ]);
      setOrders(ordersData);
      setUserProducts(productsData);
    } catch (err) {
      console.error("Error loading assets:", err);
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    const loadAiRecommendation = async () => {
      const text = await getPersonalizedRecommendations(profile, products);
      setRecommendation(text);
    };
    loadAiRecommendation();
  }, [profile, products]);

  useEffect(() => {
    loadAssets();

    // Sincronização Realtime para aprovação de ativos e novos pedidos
    const ordersSub = supabase
      .channel(`realtime:orders:${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${profile.id}` }, () => loadAssets())
      .subscribe();

    const userProductsSub = supabase
      .channel(`realtime:user_products:${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_products', filter: `user_id=eq.${profile.id}` }, () => loadAssets())
      .subscribe();

    return () => {
      ordersSub.unsubscribe();
      userProductsSub.unsubscribe();
    };
  }, [loadAssets, profile.id]);

  return (
    <div className="fixed inset-0 z-[110] bg-[#030712] flex flex-col animate-in fade-in duration-700 transition-colors">
      <header className="p-8 lg:p-10 border-b border-white/5 flex justify-between items-center bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="w-14 h-14 bg-blue-600 rounded-[1.2rem] flex items-center justify-center font-bold text-2xl shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] text-white"
          >
            CT
          </motion.div>
          <div className="hidden sm:block">
            <h1 className="text-2xl font-serif font-bold text-white italic tracking-tight">Executive Hub</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
              <p className="text-[8px] uppercase tracking-[0.4em] text-slate-500 font-black">Portal de Ativos Estratégicos v9.0</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-900/60 p-1.5 rounded-[1.5rem] border border-white/10 shadow-inner">
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'catalog' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
          >
            Catálogo
          </button>
          <button 
            onClick={() => setActiveTab('assets')}
            className={`px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${activeTab === 'assets' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
          >
            Meus Ativos {userProducts.length > 0 && <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full">{userProducts.length}</span>}
          </button>
        </div>

        <button 
          onClick={onClose} 
          className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all flex items-center justify-center border border-white/5 group"
        >
          <svg className="h-6 w-6 transform group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-24 bg-grid relative custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          
          <AnimatePresence mode="wait">
            {activeTab === 'catalog' ? (
              <motion.div key="catalog" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6 }} className="space-y-24">
                <section className="grid lg:grid-cols-12 gap-12 items-stretch">
                  <div className="lg:col-span-4 space-y-8">
                    <div className="space-y-2">
                       <span className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">Welcome back, partner</span>
                       <h2 className="text-5xl font-serif italic text-white leading-none">{profile.full_name?.split(' ')[0]}.</h2>
                    </div>
                    <div className="p-10 bg-slate-900 border border-white/5 rounded-[3.5rem] space-y-8 relative overflow-hidden group shadow-2xl">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[50px] rounded-full group-hover:bg-blue-600/10 transition-all"></div>
                      <div className="space-y-6 relative z-10">
                        <div>
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Partner Access Key</div>
                          <div className="text-xs font-mono text-blue-500 bg-blue-500/5 p-3 rounded-xl border border-blue-500/10 select-all">{profile.id.slice(0, 18).toUpperCase()}</div>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex flex-wrap gap-4">
                          <span className="text-[9px] bg-blue-600/20 text-blue-400 px-4 py-1.5 rounded-full font-black uppercase tracking-[0.2em] border border-blue-600/20 shadow-xl">Premium Strategy Tier</span>
                          <span className="text-[9px] bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full font-black uppercase tracking-[0.2em] border border-green-500/20">KYC Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-8 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[3.5rem] blur opacity-10 group-hover:opacity-20 transition-opacity"></div>
                    <div className="relative h-full p-12 lg:p-16 bg-slate-900/80 border border-white/10 rounded-[3.5rem] flex flex-col justify-center gap-10 shadow-2xl backdrop-blur-3xl">
                      <div className="flex items-center gap-4 text-blue-400">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-600/20">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">IA Strategic Diagnosis</span>
                      </div>
                      <blockquote className="text-2xl md:text-3xl font-light leading-relaxed italic text-slate-200 border-l-4 border-blue-600/30 pl-10 max-w-4xl">
                        "{recommendation}"
                      </blockquote>
                      <div className="flex gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-blue-600/50"></div>
                        <div className="w-2 h-2 rounded-full bg-blue-600/20"></div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="space-y-12">
                   <div className="flex justify-between items-end">
                      <div className="space-y-2">
                         <span className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">Curated Portfolio</span>
                         <h3 className="text-4xl font-serif italic text-white">Soluções Disponíveis.</h3>
                      </div>
                      <Link to="/loja" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all border-b border-white/10 pb-1">Ver Portfólio Completo</Link>
                   </div>
                   <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {products.map((p, idx) => (
                      <motion.div 
                        key={p.id} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-slate-900/40 p-12 rounded-[3.5rem] border border-white/5 flex flex-col justify-between group hover:border-blue-600/40 transition-all duration-700 shadow-2xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[40px] rounded-full pointer-events-none"></div>
                        <div className="space-y-8 relative z-10">
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest border ${p.pricing_type === 'subscription' ? 'bg-blue-600/10 text-blue-400 border-blue-600/20' : 'bg-purple-600/10 text-purple-400 border-purple-600/20'}`}>
                              {p.pricing_type === 'subscription' ? 'Subscription' : 'One Time'}
                            </span>
                          </div>
                          <h4 className="text-3xl font-serif italic text-white group-hover:text-blue-500 transition-colors leading-tight">{p.title}</h4>
                          <p className="text-slate-500 text-base font-light leading-relaxed italic line-clamp-2">{p.subtitle}</p>
                        </div>
                        <Link 
                          to={`/loja/${p.slug}`} 
                          className="w-full mt-12 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] text-center hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-xl group-hover:shadow-blue-600/10"
                        >
                          EXPLORAR VISÃO
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="assets" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6 }} className="space-y-16">
                <div className="max-w-4xl space-y-6">
                  <div className="text-blue-500 font-black uppercase tracking-[0.4em] text-[10px]">Asset Management Dashboard</div>
                  <h2 className="text-6xl font-serif italic text-white tracking-tighter">Meus Ativos & <br/>Ferramentas.</h2>
                  <p className="text-slate-500 text-xl font-light italic border-l-4 border-blue-600/40 pl-8">Acesso centralizado para CEOs. Gerencie suas liberações e ativos de alta performance em tempo real.</p>
                </div>

                {loading ? (
                  <div className="py-40 flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-t-2 border-blue-600 rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Sincronizando Core de Ativos...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] space-y-10 bg-slate-900/10 backdrop-blur-xl">
                    <div className="w-24 h-24 bg-slate-100/5 rounded-full flex items-center justify-center mx-auto text-slate-700">
                      <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-600 italic">Nenhum ativo vinculado a este perfil.</p>
                      <button onClick={() => setActiveTab('catalog')} className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95">Explorar Portfólio Corporativo</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-10">
                    {orders.map(order => {
                      const product = products.find(p => p.id === order.product_id);
                      const isApproved = order.status === 'approved' || order.status === 'delivered';
                      return (
                        <motion.div 
                          key={order.id} 
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          className="bg-slate-900/60 border border-white/5 rounded-[3.5rem] p-12 flex flex-col md:flex-row items-center justify-between gap-12 group hover:border-blue-600/30 transition-all duration-700 shadow-2xl relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full group-hover:bg-blue-600/10 transition-all"></div>
                          
                          <div className="flex items-center gap-10 relative z-10">
                            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center font-bold text-3xl border transition-all duration-700 ${
                              isApproved ? 'bg-blue-600/10 border-blue-500/30 text-blue-500 shadow-inner' : 'bg-slate-800/50 border-white/5 text-slate-700 grayscale'
                            }`}>
                              {product?.title?.charAt(0) || 'CT'}
                            </div>
                            <div className="space-y-3">
                              <h4 className={`text-3xl font-serif italic transition-colors duration-500 ${isApproved ? 'text-white' : 'text-slate-600'}`}>
                                {product?.title || 'Produto Estratégico'}
                              </h4>
                              <div className="flex items-center gap-4 flex-wrap">
                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border ${
                                  isApproved ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-xl' : 
                                  order.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                  {order.status === 'approved' || order.status === 'delivered' ? 'Liberado v9.0' : order.status === 'pending' ? 'Aguardando Validação' : 'Acesso Negado'}
                                </span>
                                <span className="text-[10px] text-slate-600 font-mono tracking-tighter">REF: {order.id.slice(0,12).toUpperCase()}</span>
                                <span className="text-[9px] text-slate-700 font-black uppercase tracking-widest">{new Date(order.created_at || '').toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col md:items-end gap-6 w-full md:w-auto relative z-10">
                            {isApproved ? (
                              <div className="flex flex-col md:items-end gap-3">
                                <a 
                                  href={order.download_link || '#'} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] active:scale-95 text-center flex items-center gap-4"
                                >
                                  ACESSAR ATIVO
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                </a>
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 italic">FTP Link Gerado via Supabase Edge</span>
                              </div>
                            ) : order.status === 'pending' ? (
                              <div className="flex flex-col items-center md:items-end gap-3 text-center md:text-right bg-slate-950/40 p-6 rounded-3xl border border-white/5">
                                <div className="flex items-center gap-3">
                                   <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                   <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Sincronizando com Admin</span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-light italic leading-tight">Nosso Core está validando seu pagamento PIX.<br/>O acesso será liberado em até 10 minutos.</p>
                                <button className="text-[9px] text-blue-500 font-bold uppercase tracking-widest border-b border-blue-500/20 pb-0.5 hover:text-white transition-colors">Solicitar Suporte Prioritário</button>
                              </div>
                            ) : (
                              <div className="text-red-500 flex items-center gap-3 bg-red-500/5 px-8 py-4 rounded-2xl border border-red-500/10">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span className="text-[10px] font-black uppercase tracking-widest">Acesso Restrito</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
      
      <footer className="p-10 border-t border-white/5 bg-slate-950/90 text-center flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="flex items-center gap-4 text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-widest">Secure Environment</span>
            <div className="w-px h-3 bg-white/10"></div>
            <span className="text-[9px] font-mono opacity-50">NODE_ADVISORY_CORE_V9</span>
         </div>
         <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 italic">© 2025 Claudio Tonelli Group. High-Performance Executive Hub.</p>
      </footer>
    </div>
  );
};

export default ClientPortal;
