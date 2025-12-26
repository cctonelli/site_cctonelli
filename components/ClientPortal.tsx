import React, { useEffect, useState } from 'react';
import { Product, Profile, Order, UserProduct } from '../types';
import { getPersonalizedRecommendations } from '../services/aiService';
import { fetchUserOrders, fetchUserProducts } from '../services/supabaseService';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientPortalProps {
  profile: Profile;
  products: Product[];
  onClose: () => void;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ profile, products, onClose }) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'assets'>('catalog');
  const [recommendation, setRecommendation] = useState<string>('Gerando insights para você...');
  const [orders, setOrders] = useState<Order[]>([]);
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAiRecommendation = async () => {
      const text = await getPersonalizedRecommendations(profile, products);
      setRecommendation(text);
    };
    loadAiRecommendation();
  }, [profile, products]);

  useEffect(() => {
    if (activeTab === 'assets') {
      setLoading(true);
      Promise.all([
        fetchUserOrders(profile.id),
        fetchUserProducts(profile.id)
      ]).then(([ordersData, productsData]) => {
        setOrders(ordersData);
        setUserProducts(productsData);
        setLoading(false);
      }).catch(err => {
        console.error("Error loading assets:", err);
        setLoading(false);
      });
    }
  }, [activeTab, profile.id]);

  return (
    <div className="fixed inset-0 z-[110] bg-[#030712] flex flex-col animate-in fade-in duration-500">
      <header className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl shadow-xl shadow-blue-600/20 text-white">CT</div>
          <div>
            <h1 className="text-xl font-serif font-bold text-white">Executive Hub</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Portal de Ativos Estratégicos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'catalog' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            Soluções
          </button>
          <button 
            onClick={() => setActiveTab('assets')}
            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'assets' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            Meus Ativos
          </button>
        </div>

        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-20 bg-grid custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-20">
          
          <AnimatePresence mode="wait">
            {activeTab === 'catalog' ? (
              <motion.div key="catalog" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-16">
                <section className="grid lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-4xl font-serif italic text-white">Olá, {profile.full_name?.split(' ')[0]}</h2>
                    <div className="p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] space-y-6">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Partner ID</div>
                      <div className="text-sm font-mono text-blue-500">{profile.cpf_cnpj || 'PENDING_DATA'}</div>
                      <div className="pt-4 border-t border-white/5">
                        <span className="text-[8px] bg-blue-600/10 text-blue-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">Premium Tier</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative h-full p-10 bg-slate-900/80 border border-white/10 rounded-[2.5rem] flex flex-col justify-center gap-6">
                      <div className="flex items-center gap-3 text-blue-400">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.5em]">Conselho Estratégico IA</span>
                      </div>
                      <p className="text-xl font-light leading-relaxed italic text-slate-300">
                        "{recommendation}"
                      </p>
                    </div>
                  </div>
                </section>

                <div className="grid md:grid-cols-3 gap-10">
                  {products.map(p => (
                    <div key={p.id} className="bg-slate-900/40 p-10 rounded-[3rem] border border-white/5 flex flex-col justify-between group hover:border-blue-600/30 transition-all shadow-2xl">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${p.pricing_type === 'subscription' ? 'bg-blue-600/10 text-blue-400' : 'bg-purple-600/10 text-purple-400'}`}>
                            {p.pricing_type}
                          </span>
                        </div>
                        <h4 className="text-2xl font-serif italic text-white group-hover:text-blue-500 transition-colors">{p.title}</h4>
                        <p className="text-slate-500 text-sm font-light leading-relaxed italic">{p.subtitle}</p>
                      </div>
                      <Link to={`/loja/${p.slug}`} className="w-full mt-10 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[9px] text-center hover:bg-blue-600 hover:text-white transition-all active:scale-95">
                        Expandir Visão
                      </Link>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="assets" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                <div className="max-w-4xl space-y-4">
                  <h2 className="text-4xl font-serif italic text-white">Meus Ativos & Ferramentas</h2>
                  <p className="text-slate-500 text-lg font-light italic">Gestão centralizada de liberações e downloads de alta performance.</p>
                </div>

                {loading ? (
                  <div className="py-20 flex justify-center"><div className="w-10 h-10 border-t-2 border-blue-600 rounded-full animate-spin"></div></div>
                ) : orders.length === 0 ? (
                  <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 italic">Nenhum ativo vinculado a este perfil.</p>
                    <button onClick={() => setActiveTab('catalog')} className="text-blue-500 font-bold uppercase tracking-widest text-[9px] border-b border-blue-500/20 pb-1">Explorar Portfólio</button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {orders.map(order => {
                      const product = products.find(p => p.id === order.product_id);
                      return (
                        <div key={order.id} className="bg-slate-900/60 border border-white/5 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-blue-500/20 transition-all">
                          <div className="flex items-center gap-8">
                            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center font-bold text-blue-500 text-xl border border-blue-500/20">
                              {product?.title?.charAt(0) || 'CT'}
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xl font-serif italic text-white">{product?.title || 'Produto Indisponível'}</h4>
                              <div className="flex items-center gap-3">
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                  order.status === 'approved' ? 'bg-green-500/10 text-green-500' : 
                                  order.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {order.status === 'approved' ? 'Liberado' : order.status === 'pending' ? 'Aguardando Aprovação' : 'Pedido Rejeitado'}
                                </span>
                                <span className="text-[8px] text-slate-600 font-mono">#{order.id.slice(0,8)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
                            {order.status === 'approved' && order.download_link ? (
                              <a 
                                href={order.download_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-green-600 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-green-500 transition-all shadow-xl shadow-green-600/10 text-center"
                              >
                                Acessar / Download FTP
                              </a>
                            ) : order.status === 'pending' ? (
                              <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Validação Administrativa em Curso</span>
                                <button className="text-[8px] text-blue-500 font-bold uppercase tracking-widest border border-blue-500/20 px-4 py-2 rounded-lg opacity-50 cursor-not-allowed">Suporte Prioritário</button>
                              </div>
                            ) : (
                              <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">Acesso Negado</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
};

export default ClientPortal;