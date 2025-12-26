
import React, { useEffect, useState, useCallback } from 'react';
import { Product, Profile, Order, UserProduct, V8MatrixUsage } from '../types';
import { getPersonalizedRecommendations } from '../services/aiService';
import { fetchUserOrders, fetchUserProducts, fetchUsageByProduct, supabase } from '../services/supabaseService';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ClientPortalProps {
  profile: Profile;
  products: Product[];
  onClose: () => void;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ profile, products, onClose }) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'assets'>('catalog');
  const [recommendation, setRecommendation] = useState<string>('Analisando perfil estratégico...');
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [usageMap, setUsageMap] = useState<Record<string, V8MatrixUsage>>({});
  const [loading, setLoading] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const upData = await fetchUserProducts(profile.id);
      setUserProducts(upData);
      
      // Load usage for each product
      const usages: Record<string, V8MatrixUsage> = {};
      await Promise.all(upData.map(async (up) => {
        const usage = await fetchUsageByProduct(up.id);
        if (usage) usages[up.id] = usage;
      }));
      setUsageMap(usages);
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
    const upSub = supabase.channel(`realtime:user_products:${profile.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'user_products', filter: `user_id=eq.${profile.id}` }, () => loadAssets()).subscribe();
    return () => { upSub.unsubscribe(); };
  }, [loadAssets, profile.id]);

  return (
    <div className="fixed inset-0 z-[110] bg-[#030712] flex flex-col animate-in fade-in duration-700">
      <header className="p-8 lg:p-10 border-b border-white/5 flex justify-between items-center bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="w-14 h-14 bg-blue-600 rounded-[1.2rem] flex items-center justify-center font-bold text-2xl text-white shadow-2xl">CT</div>
          <div className="hidden sm:block">
            <h1 className="text-2xl font-serif font-bold text-white italic tracking-tight">Executive Hub</h1>
            <p className="text-[8px] uppercase tracking-[0.4em] text-slate-500 font-black">Portal v10.0-ELITE</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-900/60 p-1.5 rounded-[1.5rem] border border-white/10">
          <button onClick={() => setActiveTab('catalog')} className={`px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'catalog' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500'}`}>Vitrine</button>
          <button onClick={() => setActiveTab('assets')} className={`px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'assets' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500'}`}>Meus Ativos</button>
        </div>

        <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all flex items-center justify-center border border-white/5">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8 lg:p-24 bg-grid relative custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'catalog' ? (
              <motion.div key="catalog" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-20">
                <section className="p-12 lg:p-16 bg-slate-900/80 border border-white/10 rounded-[3.5rem] flex flex-col justify-center gap-10 shadow-2xl backdrop-blur-3xl">
                  <div className="flex items-center gap-4 text-blue-400">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-600/20 text-blue-500">IA</div>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Diagnóstico Visionário</span>
                  </div>
                  <blockquote className="text-2xl md:text-3xl font-light leading-relaxed italic text-slate-200 border-l-4 border-blue-600/30 pl-10 max-w-4xl">
                    "{recommendation}"
                  </blockquote>
                </section>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                  {products.map(p => (
                    <div key={p.id} className="bg-slate-900/40 p-12 rounded-[3.5rem] border border-white/5 flex flex-col justify-between group hover:border-blue-600/40 transition-all duration-700 shadow-2xl">
                      <div className="space-y-8">
                        <h4 className="text-3xl font-serif italic text-white group-hover:text-blue-500 transition-colors">{p.title}</h4>
                        <p className="text-slate-500 text-base font-light italic line-clamp-2">{p.subtitle}</p>
                      </div>
                      <Link to={`/loja/${p.slug}`} onClick={onClose} className="w-full mt-12 py-5 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] text-center hover:bg-blue-600 hover:text-white transition-all shadow-xl">ESPECIFICAÇÕES</Link>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="assets" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="space-y-16">
                <div className="max-w-4xl space-y-4">
                  <h2 className="text-6xl font-serif italic text-white tracking-tighter leading-tight">Meus Ativos <br/>e Consumo.</h2>
                  <p className="text-slate-500 text-lg font-light italic">Gestão centralizada de ferramentas e limites de uso v10.0-ELITE.</p>
                </div>

                {loading ? (
                  <div className="py-40 flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-t-2 border-blue-600 rounded-full animate-spin"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Autenticando Protocolos...</span>
                  </div>
                ) : userProducts.length === 0 ? (
                  <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] bg-slate-900/10 space-y-10">
                    <p className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-600 italic">Nenhum ativo vinculado ao seu perfil.</p>
                    <button onClick={() => setActiveTab('catalog')} className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all">Explorar Catálogo</button>
                  </div>
                ) : (
                  <div className="grid gap-10">
                    {userProducts.map(up => {
                      const product = products.find(p => p.id === up.product_id);
                      const usage = usageMap[up.id];
                      return (
                        <div key={up.id} className="bg-slate-900/60 border border-white/5 rounded-[3.5rem] p-12 flex flex-col lg:flex-row items-center justify-between gap-12 group hover:border-blue-600/30 transition-all duration-700 shadow-2xl relative overflow-hidden">
                          <div className="flex items-center gap-10 relative z-10">
                            <div className="w-24 h-24 rounded-[2rem] bg-blue-600/10 border border-blue-500/30 text-blue-500 flex items-center justify-center font-bold text-3xl">{product?.title?.charAt(0) || 'CT'}</div>
                            <div className="space-y-3">
                              <h4 className="text-3xl font-serif italic text-white">{product?.title || 'Asset'}</h4>
                              <div className="flex items-center gap-4">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border bg-green-500/10 text-green-400 border-green-500/20">Ativo V10</span>
                                {usage && (
                                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">
                                    {usage.remaining_disparos} disparos restantes
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col lg:items-end gap-4 w-full lg:w-auto relative z-10">
                            <a href={up.download_link || '#'} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all shadow-xl flex items-center gap-4">
                              DOWNLOAD / ACESSO
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </a>
                            {usage && (
                                <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">Total disparado: {usage.total_count}</div>
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
      
      <footer className="p-10 border-t border-white/5 bg-slate-950/90 text-center">
         <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 italic">© 2025 Claudio Tonelli Group. High-Performance Executive Hub v10.0-ELITE.</p>
      </footer>
    </div>
  );
};

export default ClientPortal;
