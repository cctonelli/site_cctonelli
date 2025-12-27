
import React, { useEffect, useState, useCallback } from 'react';
import { Product, Profile, UserProduct, V8MatrixUsage } from '../types';
import { getPersonalizedRecommendations } from '../services/aiService';
import { fetchUserProducts, fetchUsageByProduct, supabase } from '../services/supabaseService';
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
      console.error("Executive Hub Load Error:", err);
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
    
    // REALTIME SYNC PROTOCOL v16.1
    const channel = supabase
      .channel(`executive-hub-${profile.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_products', 
          filter: `user_id=eq.${profile.id}` 
        }, 
        () => {
          console.log("[Executive Hub] Realtime Update Received.");
          loadAssets();
        }
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [loadAssets, profile.id]);

  const isExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#010309] flex flex-col animate-in fade-in duration-1000">
      <header className="p-8 lg:p-14 border-b border-white/5 flex justify-between items-center bg-slate-950/80 backdrop-blur-3xl sticky top-0 z-50">
        <div className="flex items-center gap-10">
          <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center font-bold text-3xl text-white shadow-2xl group transition-all">CT</div>
          <div>
            <h1 className="text-4xl font-serif font-bold text-white italic tracking-tighter leading-none">Executive Hub.</h1>
            <p className="text-[9px] uppercase tracking-[0.6em] text-slate-600 font-black mt-2">Portal S-v16.1-MASTER</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 bg-slate-900/60 p-2 rounded-[2.5rem] border border-white/5 shadow-inner">
          <button onClick={() => setActiveTab('assets')} className={`px-12 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeTab === 'assets' ? 'bg-blue-600 text-white shadow-2xl' : 'text-slate-600 hover:text-white'}`}>Ativos</button>
          <button onClick={() => setActiveTab('catalog')} className={`px-12 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeTab === 'catalog' ? 'bg-blue-600 text-white shadow-2xl' : 'text-slate-600 hover:text-white'}`}>Explorar</button>
        </div>

        <button onClick={onClose} className="w-16 h-16 bg-white/5 hover:bg-red-600/10 hover:text-red-500 rounded-[1.8rem] text-slate-500 transition-all flex items-center justify-center border border-white/5 group">
          <svg className="h-8 w-8 group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-12 lg:p-32 bg-grid relative custom-scrollbar">
        <div className="max-w-7xl mx-auto pb-48">
          <AnimatePresence mode="wait">
            {activeTab === 'assets' ? (
              <motion.div key="assets" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-24">
                <section className="max-w-4xl space-y-8">
                   <h2 className="text-6xl md:text-[8rem] font-serif italic text-white leading-[0.85] tracking-tighter">Ativos <br/><span className="text-blue-600">Soberanos.</span></h2>
                   <p className="text-slate-500 text-2xl font-light italic leading-relaxed border-l-2 border-blue-600/20 pl-10 max-w-3xl">Infraestrutura digital estratégica de alta performance consolidada para o seu perfil.</p>
                </section>

                {loading ? (
                   <div className="py-40 text-center flex flex-col items-center justify-center space-y-10">
                      <div className="w-20 h-20 border-t-2 border-blue-600 rounded-full animate-spin"></div>
                      <span className="text-blue-500 font-black text-xs uppercase tracking-[0.8em] animate-pulse">Sincronizando Ledger de Ativos...</span>
                   </div>
                ) : userProducts.length === 0 ? (
                   <div className="py-60 text-center border-2 border-dashed border-white/5 rounded-[5rem] bg-slate-900/10 space-y-16">
                      <p className="text-[12px] font-black uppercase tracking-[1em] text-slate-700 italic">Sua carteira de ativos está vazia.</p>
                      <button onClick={() => setActiveTab('catalog')} className="px-20 py-8 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30">Visitar Marketplace</button>
                   </div>
                ) : (
                   <div className="grid gap-10">
                      {userProducts.map(up => {
                        const product = products.find(p => p.id === up.product_id);
                        const usage = usageMap[up.id];
                        const expired = isExpired(up.expires_at);
                        const isMatrix = up.product_id.toLowerCase().includes('v8') || up.product_id.toLowerCase().includes('matrix');
                        const statusColor = isMatrix ? 'text-green-500' : 'text-blue-500';
                        const statusBg = isMatrix ? 'bg-green-500/10' : 'bg-blue-500/10';

                        return (
                          <div key={up.id} className={`bg-slate-900/60 border border-white/5 rounded-[5rem] p-16 flex flex-col lg:flex-row items-center justify-between gap-16 group hover:border-white/10 transition-all duration-1000 shadow-3xl backdrop-blur-3xl relative overflow-hidden ${expired ? 'grayscale opacity-60' : ''}`}>
                             <div className="flex items-center gap-16">
                                <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center font-bold text-5xl shadow-inner group-hover:scale-105 transition-all duration-700 ${isMatrix ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 'bg-blue-600/10 text-blue-500 border border-blue-500/30'}`}>
                                   {product?.title?.charAt(0) || 'CT'}
                                </div>
                                <div className="space-y-6">
                                   <div className="flex flex-wrap items-center gap-6">
                                      <h4 className="text-4xl md:text-5xl font-serif italic text-white group-hover:text-blue-500 transition-colors leading-none">{product?.title || 'Asset Management'}</h4>
                                      <span className={`text-[9px] font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full border ${expired ? 'bg-red-500/10 text-red-500 border-red-500/20' : `${statusBg} ${statusColor} border-current/20`}`}>
                                        {expired ? 'LICENÇA EXPIRADA' : 'OPERACIONAL_ACTIVE'}
                                      </span>
                                   </div>
                                   <div className="flex flex-wrap gap-10 text-[11px] font-black uppercase tracking-[0.5em] text-slate-500">
                                      {up.expires_at && <span>EXPIRA EM: <span className="text-slate-300">{new Date(up.expires_at).toLocaleDateString()}</span></span>}
                                      {usage && <span className={statusColor}>SALDO: {usage.remaining_disparos.toLocaleString()} DISPAROS</span>}
                                   </div>
                                </div>
                             </div>
                             
                             <div className="flex flex-col lg:items-end gap-6 w-full lg:w-auto">
                                <a 
                                  href={up.download_link || '#'} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className={`px-16 py-7 rounded-3xl font-black uppercase tracking-[0.4em] text-[11px] transition-all shadow-2xl flex items-center gap-6 active:scale-95 ${expired ? 'bg-white/5 text-slate-600 pointer-events-none' : 'bg-white text-black hover:bg-blue-600 hover:text-white'}`}
                                >
                                   {expired ? 'RENOVAR ACESSO' : 'INICIAR ATIVO'}
                                   {!expired && <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                                </a>
                                {usage && <div className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-700">Total Processado: {usage.total_count} units</div>}
                             </div>
                          </div>
                        );
                      })}
                   </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="catalog" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="space-y-32">
                 <section className="p-20 bg-slate-900/40 border border-white/5 rounded-[5rem] backdrop-blur-3xl space-y-16 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full group-hover:scale-110 transition-transform duration-[2s]"></div>
                    <div className="flex items-center gap-8 text-blue-500 relative z-10">
                       <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 font-bold italic font-serif text-xl border border-blue-500/20 shadow-xl shadow-blue-600/10">AI</div>
                       <span className="text-[12px] font-black uppercase tracking-[0.8em]">Executive Advisory Intelligence</span>
                    </div>
                    <blockquote className="text-3xl md:text-5xl font-light italic text-slate-200 border-l-4 border-blue-600/30 pl-16 leading-relaxed max-w-6xl relative z-10">
                       "{recommendation}"
                    </blockquote>
                 </section>

                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16">
                    {products.map((p, idx) => (
                       <motion.div 
                          key={p.id} 
                          initial={{ opacity: 0, y: 30 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          transition={{ delay: idx * 0.1 }}
                          className="bg-slate-950/60 p-16 rounded-[5rem] border border-white/5 flex flex-col justify-between group hover:border-blue-600/40 transition-all duration-1000 shadow-2xl backdrop-blur-xl"
                       >
                          <div className="space-y-10">
                             <div className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500 opacity-60">Strategic Asset</div>
                             <h4 className="text-4xl md:text-5xl font-serif italic text-white group-hover:text-blue-500 transition-colors leading-tight">{p.title}</h4>
                             <p className="text-slate-500 text-xl font-light italic line-clamp-3 leading-relaxed">{p.subtitle}</p>
                          </div>
                          <Link to={`/loja/${p.slug}`} onClick={onClose} className="w-full mt-16 py-8 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.5em] text-[11px] text-center hover:bg-blue-600 transition-all shadow-2xl shadow-blue-600/10 active:scale-95">DETALHES</Link>
                       </motion.div>
                    ))}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="p-16 border-t border-white/5 bg-[#010309] text-center">
         <p className="text-[10px] font-black uppercase tracking-[1em] text-slate-700 italic">© 2025 Claudio Tonelli Advisory Group // Executive Hub v16.1 MASTER // PROTOCOL_LEVEL_S</p>
      </footer>
    </div>
  );
};

export default ClientPortal;
