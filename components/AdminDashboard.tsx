
import React, { useState, useEffect } from 'react';
import { Profile, Order } from '../types';
import { fetchAllOrders, fetchSiteConfig, supabase, upsertItem, checkTableVisibility } from '../services/supabaseService';
import AdminCrudSection from './AdminCrudSection';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'visual_dna' | 'editorial' | 'marketplace' | 'orders' | 'settings' | 'users';

const ADMIN_VERSION = "v18.9-SOVEREIGN-MASTER-EXT";

interface AdminDashboardProps {
  onClose: () => void;
  profile: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [showDoctor, setShowDoctor] = useState(false);
  const [tableStatus, setTableStatus] = useState<Record<string, { visible: boolean; error?: string }>>({});

  useEffect(() => {
    const init = async () => {
      const config = await fetchSiteConfig();
      setSiteConfig(config);
      if (activeTab === 'orders') loadOrders();
      if (activeTab === 'users') loadUsers();
      
      // Diagnóstico inicial de infraestrutura
      const tables = ['orders', 'profiles', 'products', 'site_content'];
      const statusResults: Record<string, any> = {};
      for (const t of tables) {
        statusResults[t] = await checkTableVisibility(t);
      }
      setTableStatus(statusResults);
    };
    init();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    setOrderError(null);
    try {
      if (useMockData) {
        const mock: Order[] = [
          {
            id: 'mock-1',
            user_id: 'user-1',
            product_id: 'v8-matrix-edition',
            variant_id: 'v8-semestral',
            status: 'pending',
            amount: 599.00,
            approved_by_admin: false,
            payment_method: 'pix',
            pix_qrcode_url: null,
            download_link: null,
            profiles: { id: 'user-1', full_name: 'John Doe (Sovereign Partner)', email: 'john@matrix.com', whatsapp: '+55 11 99999-9999', user_type: 'client', cpf_cnpj: '000.000.000-00', gender: null }
          }
        ];
        setTimeout(() => { setOrders(mock); setLoadingOrders(false); }, 1000);
        return;
      }

      const data = await fetchAllOrders();
      setOrders(data);
    } catch (e: any) {
      console.error("[SalesVault] Erro capturado na UI:", e);
      const errorMsg = e.message || e.details || (typeof e === 'string' ? e : JSON.stringify(e));
      const isCacheError = errorMsg.includes('PGRST205') || errorMsg.includes('schema cache');
      setOrderError(isCacheError ? "PGRST205: Tabela não encontrada no cache do schema." : errorMsg);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setProfiles(data || []);
    } catch (e) {}
  };

  const handleUpdateConfig = async (field: string, subfield: string, value: any) => {
    const newConfig = { ...siteConfig };
    if (!newConfig[field]) newConfig[field] = {};
    newConfig[field][subfield] = value;
    setSiteConfig(newConfig);
    
    try {
      await upsertItem('site_content', {
        page: 'config',
        key: `setting_${field}_${subfield}`,
        value: value,
        updated_at: new Date().toISOString()
      });
      
      const root = document.documentElement;
      if (field === 'theme' && subfield === 'primary') root.style.setProperty('--accent-blue', value);
      if (field === 'theme' && subfield === 'bg_dark') root.style.setProperty('--bg-navy', value);
      if (field === 'typography' && subfield === 'h1_size') root.style.setProperty('--h1-size', value);
      if (field === 'typography' && subfield === 'body_size') root.style.setProperty('--body-size', value);
    } catch (e) {}
  };

  const approveOrder = async (order: Order) => {
    if (useMockData) { alert("MOCK MODE: Aprovação simulada."); return; }
    const clientName = (order as any).profiles?.full_name || (order as any).profiles?.email || 'Partner';
    if (!confirm(`Confirmar liberação de ativo para ${clientName}?`)) return;
    setProcessingId(order.id);
    try {
      const { error: orderError } = await supabase.from('orders').update({ status: 'approved', approved_by_admin: true }).eq('id', order.id);
      if (orderError) throw orderError;
      alert("ACESSO LIBERADO.");
      loadOrders();
    } catch (e: any) { alert(`Erro: ${e.message}`); } finally { setProcessingId(null); }
  };

  if (!profile || profile.user_type !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[1200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-10 overflow-hidden">
      <div className="bg-[#010309] border border-white/10 w-full max-w-[1900px] h-full rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl">
        
        <aside className="w-full lg:w-96 bg-black/50 border-r border-white/5 p-12 flex flex-col gap-10 shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-[1.8rem] flex items-center justify-center font-bold text-white text-3xl shadow-2xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[11px] uppercase tracking-[0.6em] text-white">COMMAND CENTER</span>
              <span className="text-[8px] uppercase tracking-[0.4em] text-blue-500 font-bold mt-1">{ADMIN_VERSION}</span>
            </div>
          </div>
          
          <nav className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar">
            <button onClick={() => setActiveTab('orders')} className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'orders' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-600 border-white/5 hover:bg-white/5'}`}>Sales Vault</button>
            <button onClick={() => setActiveTab('marketplace')} className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'marketplace' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-600 border-white/5 hover:bg-white/5'}`}>Marketplace Forge</button>
            <button onClick={() => setActiveTab('editorial')} className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'editorial' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-600 border-white/5 hover:bg-white/5'}`}>Editorial Forge</button>
            <button onClick={() => setActiveTab('visual_dna')} className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'visual_dna' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-600 border-white/5 hover:bg-white/5'}`}>DNA Visual</button>
            <button onClick={() => setActiveTab('users')} className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'users' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-600 border-white/5 hover:bg-white/5'}`}>Partners & CRM</button>
            <button onClick={() => setActiveTab('settings')} className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'settings' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-600 border-white/5 hover:bg-white/5'}`}>Geral & SEO</button>
          </nav>
          
          <div className="pt-8 border-t border-white/5 space-y-4">
             <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[7px] font-black uppercase tracking-widest text-slate-500 mb-2">Infra Status</p>
                <div className="space-y-1">
                   {Object.entries(tableStatus).map(([name, status]) => (
                     <div key={name} className="flex justify-between items-center">
                        <span className="text-[8px] text-slate-400 uppercase font-mono">{name}</span>
                        {/* Fix: Explicitly cast status to access 'visible' property if inference fails */}
                        <div className={`w-1.5 h-1.5 rounded-full ${(status as { visible: boolean }).visible ? 'bg-green-500' : 'bg-red-500'}`}></div>
                     </div>
                   ))}
                </div>
             </div>
             <button onClick={onClose} className="w-full text-slate-700 hover:text-red-500 text-[11px] font-black uppercase tracking-[0.6em] transition-colors">Encerrar Protocolo Admin</button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-12 lg:p-24 bg-grid relative custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-40">
            {activeTab === 'orders' && (
              <div className="space-y-12">
                <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <h2 className="text-6xl font-serif text-white italic tracking-tighter">Sales <span className="text-blue-600">Vault.</span></h2>
                    <div className="flex items-center gap-4">
                       {useMockData && <p className="text-[10px] text-yellow-500 font-black uppercase tracking-widest animate-pulse">Kernel Local Ativo</p>}
                       <button onClick={() => setShowDoctor(!showDoctor)} className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-blue-500 transition-colors">Emergency Protocols {showDoctor ? '▲' : '▼'}</button>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <button onClick={() => { setUseMockData(!useMockData); loadOrders(); }} className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${useMockData ? 'bg-yellow-500 text-black border-yellow-400' : 'text-slate-600 border-white/5'}`}>
                      {useMockData ? 'Sair do Mock' : 'Ativar Mock'}
                    </button>
                    <button onClick={loadOrders} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-white transition-colors">Recarregar Ledger</button>
                  </div>
                </div>

                <AnimatePresence>
                {showDoctor && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-10 bg-blue-600/5 border border-blue-600/20 rounded-[3rem] overflow-hidden space-y-8 backdrop-blur-md">
                    <div className="flex items-center gap-4 border-b border-blue-600/20 pb-4">
                       <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">!</div>
                       <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-500">Manual de Reparo Elite - PGRST Cache Erase</h4>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-12">
                       <div className="space-y-6">
                          <p className="text-[10px] text-white uppercase tracking-widest font-bold">SOLUÇÃO DEFINITIVA (RESTART PROJECT)</p>
                          <p className="text-xs text-slate-400 leading-relaxed italic">
                            O erro PGRST205 ocorre quando o PostgREST (API) não sincronizou o schema físico do Postgres. O simples reload nem sempre basta.
                          </p>
                          <div className="p-6 bg-black/40 rounded-2xl border border-blue-500/20 space-y-4">
                             <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Procedimento Dashboard Supabase:</p>
                             <ul className="text-[10px] text-slate-300 space-y-2">
                                <li>1. Vá em <strong>Project Settings > General</strong>.</li>
                                <li>2. Clique no botão vermelho <strong>"Restart Project"</strong>.</li>
                                <li>3. Isso reinicia o DB e a API limpando 100% o cache.</li>
                                <li>4. Aguarde 60s até o status ficar <strong>"Active"</strong>.</li>
                             </ul>
                          </div>
                       </div>
                       
                       <div className="space-y-6">
                          <p className="text-[10px] text-white uppercase tracking-widest font-bold">ANATOMIA DO RESTART</p>
                          <p className="text-xs text-slate-400 leading-relaxed italic">
                            O que acontece durante o Restart?
                          </p>
                          <ul className="text-[9px] text-slate-500 uppercase tracking-widest space-y-3 font-mono">
                             <li className="flex items-center gap-3"><div className="w-1 h-1 bg-blue-600 rounded-full"></div> Reinicia PostgreSQL (DB)</li>
                             <li className="flex items-center gap-3"><div className="w-1 h-1 bg-blue-600 rounded-full"></div> Reinicia PostgREST (API Cache)</li>
                             <li className="flex items-center gap-3"><div className="w-1 h-1 bg-blue-600 rounded-full"></div> Reinicia Auth & Realtime</li>
                             <li className="flex items-center gap-3"><div className="w-1 h-1 bg-blue-600 rounded-full"></div> Zero perda de dados</li>
                          </ul>
                       </div>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>

                <div className="grid gap-8">
                  {loadingOrders ? (
                    <div className="py-20 text-center animate-pulse text-blue-500 uppercase tracking-widest text-xs">Acessando Banco Central...</div>
                  ) : orderError && !useMockData ? (
                    <div className="p-16 border border-red-500/30 bg-red-500/5 rounded-[4rem] text-center space-y-10 animate-in zoom-in-95 duration-500 shadow-2xl overflow-hidden relative">
                      <div className="absolute inset-0 bg-grid opacity-10"></div>
                      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 mb-4 animate-pulse relative z-10">
                         <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      </div>
                      <div className="space-y-4 relative z-10">
                        <h3 className="text-2xl font-serif text-white italic">Protocolo Interrompido: PGRST205 Detectado</h3>
                        <p className="text-red-500 font-black uppercase tracking-widest text-[10px]">Falha Crítica na Visibilidade da Tabela 'orders'</p>
                        <p className="text-slate-400 text-sm max-w-2xl mx-auto italic leading-relaxed">O servidor PostgREST perdeu a referência física da tabela. Siga o protocolo de reinicialização total para restaurar o Command Center.</p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto relative z-10">
                        <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 text-left space-y-4 group hover:border-blue-500/30 transition-all">
                           <p className="text-blue-500 uppercase font-black tracking-widest text-[9px]">Ação Master: RESTART PROJECT</p>
                           <p className="text-[11px] text-slate-300">Reinicie o projeto via Supabase Settings. É o único comando que limpa 100% o cache de workers zumbis.</p>
                           <button onClick={() => setShowDoctor(true)} className="text-[9px] font-black uppercase text-blue-400 hover:text-white transition-colors border-b border-blue-400/20 pb-1">Ver Instruções do Dashboard</button>
                        </div>
                        <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 text-left space-y-4 group hover:border-yellow-500/30 transition-all">
                           <p className="text-yellow-500 uppercase font-black tracking-widest text-[9px]">Ação Emergencial: MOCK DATA</p>
                           <p className="text-[11px] text-slate-300">Trabalhe em modo de simulação visual enquanto o servidor é restaurado pela equipe de infra.</p>
                           <button onClick={() => setUseMockData(true)} className="bg-yellow-500/10 text-yellow-500 px-6 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all border border-yellow-500/20">Ativar Modo Mock</button>
                        </div>
                      </div>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="p-20 border border-dashed border-white/5 rounded-[3rem] text-center text-slate-600 uppercase tracking-widest text-xs italic">Nenhum protocolo pendente no momento.</div>
                  ) : (
                    <div className="grid gap-8">
                      {orders.map(order => (
                        <div key={order.id} className="p-12 bg-slate-900/40 border border-white/5 rounded-[4rem] flex flex-col lg:flex-row lg:items-center justify-between gap-10 group hover:border-blue-600/30 transition-all backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                          <div className="space-y-6 relative z-10">
                             <div className="flex gap-5 items-center">
                                <span className={`text-[8px] font-black px-5 py-1.5 rounded-full ${order.status === 'pending' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-500'}`}>{order.status.toUpperCase()}</span>
                                <span className="text-white font-serif italic text-2xl">{(order as any).profiles?.full_name || (order as any).profiles?.email || 'Partner (Join Fallback)'}</span>
                             </div>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                                <div className="space-y-2"><p className="opacity-50">Ativo</p><p className="text-slate-300">{order.product_id}</p></div>
                                <div className="space-y-2"><p className="opacity-50">Investimento</p><p className="text-slate-300 font-bold">R$ {order.amount.toFixed(2)}</p></div>
                                <div className="space-y-2"><p className="opacity-50">Transação</p><p className="text-blue-500">#{order.id.slice(0,8)}</p></div>
                                <div className="space-y-2"><p className="opacity-50">WhatsApp</p><p className="text-slate-300">{(order as any).profiles?.whatsapp || 'N/A'}</p></div>
                             </div>
                          </div>
                          {order.status === 'pending' && (
                            <button onClick={() => approveOrder(order)} disabled={processingId === order.id} className="bg-blue-600 text-white px-12 py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/20 active:scale-95 relative z-10">
                              {processingId === order.id ? 'SINC...' : 'ATIVAR PROTOCOLO'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
               <div className="space-y-16">
                  <h2 className="text-6xl font-serif text-white italic tracking-tighter">Partners & <span className="text-blue-600">CRM.</span></h2>
                  <div className="grid gap-6">
                     {profiles.map(p => (
                        <div key={p.id} className="p-8 bg-slate-900/40 border border-white/5 rounded-3xl flex justify-between items-center backdrop-blur-3xl">
                           <div className="flex gap-6 items-center">
                              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center font-serif italic text-white text-xl border border-white/10">
                                 {p.full_name?.charAt(0) || p.email?.charAt(0)}
                              </div>
                              <div>
                                 <p className="text-white font-serif italic text-xl">{p.full_name || 'Usuário Sem Nome'}</p>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{p.email} • {p.user_type}</p>
                              </div>
                           </div>
                           <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">UID: {p.id.slice(0,8)}</div>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {activeTab === 'visual_dna' && siteConfig && (
              <div className="space-y-16">
                 <h2 className="text-6xl font-serif text-white italic tracking-tighter">DNA <span className="text-blue-600">Visual.</span></h2>
                 <div className="grid md:grid-cols-2 gap-12">
                    <div className="p-10 bg-slate-900/60 rounded-[3rem] border border-white/5 space-y-10 backdrop-blur-3xl">
                       <h3 className="text-xl font-bold text-white uppercase tracking-widest border-l-2 border-blue-600 pl-4">Paleta de Comando</h3>
                       <div className="space-y-8">
                          <div>
                             <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-4">Acento Primário</label>
                             <div className="flex gap-4 items-center">
                               <input type="color" value={siteConfig.theme.primary} onChange={e => handleUpdateConfig('theme', 'primary', e.target.value)} className="w-20 h-20 bg-black rounded-2xl border-none cursor-pointer p-1" />
                               <input type="text" value={siteConfig.theme.primary} onChange={e => handleUpdateConfig('theme', 'primary', e.target.value)} className="flex-1 bg-black text-white px-6 py-5 rounded-2xl border border-white/5 font-mono text-xs" />
                             </div>
                          </div>
                          <div>
                             <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-4">Fundo Principal</label>
                             <input type="color" value={siteConfig.theme.bg_dark} onChange={e => handleUpdateConfig('theme', 'bg_dark', e.target.value)} className="w-full h-16 bg-black rounded-2xl border-none cursor-pointer p-1" />
                          </div>
                       </div>
                    </div>
                    <div className="p-10 bg-slate-900/60 rounded-[3rem] border border-white/5 space-y-10 backdrop-blur-3xl">
                       <h3 className="text-xl font-bold text-white uppercase tracking-widest border-l-2 border-blue-600 pl-4">Escala Tipográfica</h3>
                       <div className="space-y-8">
                          <div>
                             <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-4">Título Hero (H1)</label>
                             <input type="text" value={siteConfig.typography.h1_size} onChange={e => handleUpdateConfig('typography', 'h1_size', e.target.value)} className="w-full bg-black text-white px-6 py-5 rounded-2xl border border-white/5 font-mono" />
                          </div>
                          <div>
                             <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-4">Corpo de Texto</label>
                             <input type="text" value={siteConfig.typography.body_size} onChange={e => handleUpdateConfig('typography', 'body_size', e.target.value)} className="w-full bg-black text-white px-6 py-5 rounded-2xl border border-white/5 font-mono" />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}
            
            {activeTab === 'marketplace' && (
              <div className="space-y-20">
                 <h2 className="text-6xl font-serif text-white italic tracking-tighter">Marketplace <span className="text-blue-600">Forge.</span></h2>
                 <AdminCrudSection 
                      tableName="products" 
                      title="Ativos Digitais" 
                      fields={[
                        { key: 'title', label: 'Título do Ativo', placeholder: 'ex: V8 Matrix Edition' }, 
                        { key: 'slug', label: 'Slug / URL', placeholder: 'ex: v8-matrix' }, 
                        { key: 'subtitle', label: 'Lead Curto (subtítulo)', type: 'textarea' }, 
                        { key: 'image_url', label: 'URL da Imagem Principal' }, 
                        { key: 'pricing_type', label: 'Tipo (subscription/one_time)' }
                      ]} 
                      displayColumns={['title', 'slug']} 
                   />
              </div>
            )}

            {activeTab === 'editorial' && (
               <div className="space-y-20">
                  <h2 className="text-6xl font-serif text-white italic tracking-tighter">Editorial <span className="text-blue-600">Forge.</span></h2>
                  <AdminCrudSection tableName="insights" title="Insights & Artigos" fields={[{ key: 'title', label: 'Título da Edição' }, { key: 'category', label: 'Editoria' }, { key: 'image_url', label: 'URL da Mídia Editorial' }, { key: 'excerpt', label: 'Lead Editorial', type: 'textarea' }, { key: 'content', label: 'Corpo do Artigo (HTML)', type: 'rich-text' }]} displayColumns={['title', 'category']} />
               </div>
            )}

            {activeTab === 'settings' && siteConfig && (
              <div className="space-y-16">
                 <h2 className="text-6xl font-serif text-white italic tracking-tighter">Geral & <span className="text-blue-600">SEO.</span></h2>
                 <div className="grid md:grid-cols-2 gap-12">
                    <div className="p-10 bg-slate-900/60 rounded-[3rem] border border-white/5 space-y-10 backdrop-blur-3xl">
                       <h3 className="text-xl font-bold text-white uppercase tracking-widest border-l-2 border-blue-600 pl-4">Canais de Conexão</h3>
                       <div className="space-y-8">
                          <div><label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-4">E-mail Corporativo</label><input type="text" value={siteConfig.contact.email} onChange={e => handleUpdateConfig('contact', 'email', e.target.value)} className="w-full bg-black text-white px-6 py-5 rounded-2xl border border-white/5 outline-none" /></div>
                          <div><label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-4">WhatsApp Oficial</label><input type="text" value={siteConfig.contact.whatsapp} onChange={e => handleUpdateConfig('contact', 'whatsapp', e.target.value)} className="w-full bg-black text-white px-6 py-5 rounded-2xl border border-white/5 outline-none" /></div>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
