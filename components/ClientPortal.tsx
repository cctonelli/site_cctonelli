
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
  const [activeTab, setActiveTab] = useState<'catalog' | 'assets'>('assets');
  const [recommendation, setRecommendation] = useState<string>('Analisando perfil estratégico...');
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [usageMap, setUsageMap] = useState<Record<string, V8MatrixUsage>>({});
  const [loading, setLoading] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const upData = await fetchUserProducts(profile.id);
      setUserProducts(upData);
      
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
    // Realtime subscription para liberação instantânea
    const channel = supabase
      .channel(`executive-hub-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_products', filter: `user_id=eq.${profile.id}` }, () => {
        loadAssets();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [loadAssets, profile.id]);

  return (
    <div className="fixed inset-0 z-[110] bg-[#010309] flex flex-col animate-in fade-in duration-700">
      <header className="p-8 lg:p-12 border-b border-white/5 flex justify-between items-center bg-slate-950/80 backdrop-blur-3xl sticky top-0 z-50">
        <div className="flex items-center gap-10">
          <div className="w-14 h-14 bg-blue-600 rounded-[1.2rem] flex items-center justify-center font-bold text-2xl text-white shadow-2xl">CT</div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-white italic tracking-tight">Executive Hub.</h1>
            <p className="text-[8px] uppercase tracking-[0.5em] text-slate-500 font-black">Portal S-v10.0-ELITE</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-900/60 p-2 rounded-[2rem] border border-white/5">
          <button onClick={() => setActiveTab('assets')} className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'assets' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500'}`}>Meus Ativos</button>
          <button onClick={() => setActiveTab('catalog')} className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'catalog' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500'}`}>Vitrine</button>
        </div>

        <button onClick={onClose} className="w-14 h-14 bg-white/5 hover:bg-red-500/10 hover:text-red-500 rounded-2xl text-slate-500 transition-all flex items-center justify-center border border-white/5">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-10 lg:p-24 bg-grid relative custom-scrollbar">
        <div className="max-w-7xl mx-auto pb-40">
          <AnimatePresence mode="wait">
            {activeTab === 'assets' ? (
              <motion.div key="assets" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-20">
                <section className="max-w-3xl space-y-6">
                   <h2 className="text-5xl md:text-7xl font-serif italic text-white leading-tight tracking-tighter">Ativos <br/>Sincronizados.</h2>
                   <p className="text-slate-500 text-xl font-light italic leading-relaxed">Gerencie suas licenças e ferramentas no padrão Claudio Tonelli.</p>
                </section>

                {loading ? (
                   <div className="py-20 text-center animate-pulse text-blue-500 text-[10px] font-black uppercase tracking-widest">Sincronizando com o Cloud Hub...</div>
                ) : userProducts.length === 0 ? (
                   <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] bg-slate-900/10 space-y-12">
                      <p className="text-[11px] font-black uppercase tracking-[0.8em] text-slate-600 italic">Nenhum ativo liberado no momento.</p>
                      <button onClick={() => setActiveTab('catalog')} className="px-16 py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/20">Explorar Ativos Disponíveis</button>
                   </div>
                ) : (
                   <div className="grid gap-8">
                      {userProducts.map(up => {
                        const product = products.find(p => p.id === up.product_id);
                        const usage = usageMap[up.id];
                        return (
                          <div key={up.id} className="bg-slate-900/60 border border-white/5 rounded-[4rem] p-12 flex flex-col lg:flex-row items-center justify-between gap-12 group hover:border-blue-600/30 transition-all duration-700 shadow-2xl">
                             <div className="flex items-center gap-12">
                                <div className="w-28 h-28 rounded-[2.5rem] bg-blue-600/10 border border-blue-500/30 text-blue-500 flex items-center justify-center font-bold text-4xl shadow-inner">{product?.title?.charAt(0) || 'CT'}</div>
                                <div className="space-y-4">
                                   <div className="flex items-center gap-4">
                                      <h4 className="text-4xl font-serif italic text-white">{product?.title || 'Asset'}</h4>
                                      <span className="text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">LICENÇA ATIVA</span>
                                   </div>
                                   <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                      {up.expires_at && <span>Expira em: {new Date(up.expires_at).toLocaleDateString()}</span>}
                                      {usage && <span className="text-blue-500">Saldo: {usage.remaining_disparos} disparos</span>}
                                   </div>
                                </div>
                             </div>
                             
                             <div className="flex flex-col lg:items-end gap-6 w-full lg:w-auto">
                                <a href={up.download_link || '#'} target="_blank" rel="noopener noreferrer" className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-600 hover:text-white transition-all shadow-2xl flex items-center gap-4">
                                   DOWNLOAD / ACESSAR
                                   <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                </a>
                                {usage && <div className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">Total Processado: {usage.total_count}</div>}
                             </div>
                          </div>
                        );
                      })}
                   </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="catalog" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-20">
                 <section className="p-16 bg-slate-900/60 border border-white/5 rounded-[4rem] backdrop-blur-3xl space-y-12">
                    <div className="flex items-center gap-6 text-blue-400">
                       <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 font-bold">IA</div>
                       <span className="text-[10px] font-black uppercase tracking-[0.6em]">Conselho Estratégico do Dia</span>
                    </div>
                    <blockquote className="text-2xl md:text-4xl font-light italic text-slate-200 border-l-4 border-blue-600/30 pl-12 leading-relaxed max-w-5xl">
                       "{recommendation}"
                    </blockquote>
                 </section>

                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {products.map(p => (
                       <div key={p.id} className="bg-slate-950/40 p-12 rounded-[4rem] border border-white/5 flex flex-col justify-between group hover:border-blue-600/40 transition-all duration-700">
                          <div className="space-y-8">
                             <h4 className="text-4xl font-serif italic text-white group-hover:text-blue-500 transition-colors leading-tight">{p.title}</h4>
                             <p className="text-slate-500 text-lg font-light italic line-clamp-3 leading-relaxed">{p.subtitle}</p>
                          </div>
                          <Link to={`/loja/${p.slug}`} onClick={onClose} className="w-full mt-12 py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] text-center hover:bg-blue-600 transition-all shadow-xl">DETALHES DO ATIVO</Link>
                       </div>
                    ))}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="p-12 border-t border-white/5 bg-slate-950 text-center">
         <p className="text-[9px] font-black uppercase tracking-[0.6em] text-slate-600 italic">© 2025 Claudio Tonelli Group // High-Performance Executive Hub v10.0-ELITE.</p>
      </footer>
    </div>
  );
};

export default ClientPortal;
