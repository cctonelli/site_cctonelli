
import React, { useState, useEffect } from 'react';
import { Profile, Order } from '../types';
import { fetchAllOrders, fetchSiteConfig, supabase, upsertItem } from '../services/supabaseService';
import AdminCrudSection from './AdminCrudSection';
import { motion } from 'framer-motion';

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

  useEffect(() => {
    const init = async () => {
      const config = await fetchSiteConfig();
      setSiteConfig(config);
      if (activeTab === 'orders') loadOrders();
      if (activeTab === 'users') loadUsers();
    };
    init();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    setOrderError(null);
    try {
      const data = await fetchAllOrders();
      setOrders(data);
    } catch (e: any) {
      const msg = e.message || e.details || "Erro desconhecido ao carregar pedidos.";
      setOrderError(msg);
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
      
      if (field === 'theme' && subfield === 'custom_css') {
        let styleTag = document.getElementById('sovereign-custom-css');
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'sovereign-custom-css';
          document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = value;
      }
    } catch (e: any) {
      console.error("Config Sync Fail:", e);
    }
  };

  const approveOrder = async (order: Order) => {
    const clientName = (order as any).profiles?.full_name || (order as any).profiles?.email || 'Partner';
    if (!confirm(`Confirmar liberação de ativo para ${clientName}?`)) return;
    
    setProcessingId(order.id);
    try {
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'approved', approved_by_admin: true })
        .eq('id', order.id);
      
      if (orderError) throw orderError;

      const expirationDate = new Date();
      if (order.variant_id.includes('anual')) expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      else if (order.variant_id.includes('semestral')) expirationDate.setMonth(expirationDate.getMonth() + 6);
      else expirationDate.setMonth(expirationDate.getMonth() + 1);

      const { error: upError } = await supabase.from('user_products').insert([{
        user_id: order.user_id,
        product_id: order.product_id,
        variant_id: order.variant_id,
        status: 'active',
        approved_by_admin: true,
        expires_at: expirationDate.toISOString()
      }]);

      if (upError) throw upError;

      alert("ACESSO LIBERADO COM SUCESSO.");
      loadOrders();
    } catch (e: any) {
      alert(`Erro na operação: ${e.message}`);
    } finally {
      setProcessingId(null);
    }
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
          
          <div className="pt-8 border-t border-white/5">
             <button onClick={onClose} className="w-full text-slate-700 hover:text-red-500 text-[11px] font-black uppercase tracking-[0.6em] transition-colors">Encerrar Protocolo Admin</button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-12 lg:p-24 bg-grid relative custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-40">
            {activeTab === 'orders' && (
              <div className="space-y-12">
                <div className="flex justify-between items-end">
                  <h2 className="text-6xl font-serif text-white italic tracking-tighter">Sales <span className="text-blue-600">Vault.</span></h2>
                  <button onClick={loadOrders} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-white transition-colors">Recarregar Ledger</button>
                </div>
                <div className="grid gap-8">
                  {loadingOrders ? (
                    <div className="py-20 text-center animate-pulse text-blue-500 uppercase tracking-widest text-xs">Sincronizando transações...</div>
                  ) : orderError ? (
                    <div className="p-12 border border-red-500/30 bg-red-500/5 rounded-[3rem] text-center space-y-6">
                      <p className="text-red-500 font-black uppercase tracking-widest text-xs">Erro Crítico de Sincronização</p>
                      <p className="text-slate-400 text-sm">{orderError}</p>
                      {orderError.includes('schema cache') && (
                        <div className="mt-8 p-6 bg-black/40 rounded-2xl text-[10px] text-slate-500 font-mono text-left space-y-4">
                          <p className="text-blue-500 uppercase font-black">SOLUÇÃO RECOMENDADA:</p>
                          <p>A tabela 'public.orders' não foi detectada no cache do Supabase. Por favor, execute o DDL de criação da tabela 'orders' e em seguida o comando:</p>
                          <code className="block bg-slate-900 p-4 rounded text-blue-400">NOTIFY pgrst, 'reload schema';</code>
                        </div>
                      )}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="p-20 border border-dashed border-white/5 rounded-[3rem] text-center text-slate-600 uppercase tracking-widest text-xs">Nenhum pedido pendente de auditoria.</div>
                  ) : orders.map(order => (
                    <div key={order.id} className="p-12 bg-slate-900/40 border border-white/5 rounded-[4rem] flex flex-col lg:flex-row lg:items-center justify-between gap-10 group hover:border-blue-600/30 transition-all backdrop-blur-3xl">
                      <div className="space-y-6">
                         <div className="flex gap-5 items-center">
                            <span className={`text-[8px] font-black px-5 py-1.5 rounded-full ${order.status === 'pending' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-500'}`}>{order.status.toUpperCase()}</span>
                            <span className="text-white font-serif italic text-2xl">{(order as any).profiles?.full_name || (order as any).profiles?.email || 'Partner'}</span>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                            <div className="space-y-2"><p className="opacity-50">Ativo</p><p className="text-slate-300">{order.product_id}</p></div>
                            <div className="space-y-2"><p className="opacity-50">Valor</p><p className="text-slate-300 font-bold">R$ {order.amount.toFixed(2)}</p></div>
                            <div className="space-y-2"><p className="opacity-50">Transação</p><p className="text-blue-500">#{order.id.slice(0,8)}</p></div>
                            <div className="space-y-2"><p className="opacity-50">WhatsApp</p><p className="text-slate-300">{(order as any).profiles?.whatsapp || 'N/A'}</p></div>
                         </div>
                      </div>
                      {order.status === 'pending' && (
                        <button onClick={() => approveOrder(order)} disabled={processingId === order.id} className="bg-blue-600 text-white px-12 py-6 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/20 active:scale-95">
                          {processingId === order.id ? 'ATIVANDO...' : 'ATIVAR PROTOCOLO'}
                        </button>
                      )}
                    </div>
                  ))}
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
                             <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-4">Acento Primário (Ex: #00ff41)</label>
                             <div className="flex gap-4 items-center">
                               <input type="color" value={siteConfig.theme.primary} onChange={e => handleUpdateConfig('theme', 'primary', e.target.value)} className="w-20 h-20 bg-black rounded-2xl border-none cursor-pointer p-1" />
                               <input type="text" value={siteConfig.theme.primary} onChange={e => handleUpdateConfig('theme', 'primary', e.target.value)} className="flex-1 bg-black text-white px-6 py-5 rounded-2xl border border-white/5 font-mono text-xs" />
                             </div>
                          </div>
                          <div>
                             <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-4">Fundo Principal (Ex: #010309)</label>
                             <input type="color" value={siteConfig.theme.bg_dark} onChange={e => handleUpdateConfig('theme', 'bg_dark', e.target.value)} className="w-full h-16 bg-black rounded-2xl border-none cursor-pointer p-1" />
                          </div>
                       </div>
                    </div>
                    <div className="p-10 bg-slate-900/60 rounded-[3rem] border border-white/5 space-y-10 backdrop-blur-3xl">
                       <h3 className="text-xl font-bold text-white uppercase tracking-widest border-l-2 border-blue-600 pl-4">Escala Tipográfica</h3>
                       <div className="space-y-8">
                          <div>
                             <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-4">Título Hero (H1) - ex: 9.5rem</label>
                             <input type="text" value={siteConfig.typography.h1_size} onChange={e => handleUpdateConfig('typography', 'h1_size', e.target.value)} className="w-full bg-black text-white px-6 py-5 rounded-2xl border border-white/5 outline-none focus:border-blue-600 font-mono" />
                          </div>
                          <div>
                             <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-4">Corpo de Texto - ex: 1.125rem</label>
                             <input type="text" value={siteConfig.typography.body_size} onChange={e => handleUpdateConfig('typography', 'body_size', e.target.value)} className="w-full bg-black text-white px-6 py-5 rounded-2xl border border-white/5 outline-none focus:border-blue-600 font-mono" />
                          </div>
                       </div>
                    </div>

                    <div className="md:col-span-2 p-10 bg-slate-900/60 rounded-[3rem] border border-white/5 space-y-10 backdrop-blur-3xl">
                       <h3 className="text-xl font-bold text-white uppercase tracking-widest border-l-2 border-blue-600 pl-4">Injeção Custom CSS (Soberania Master)</h3>
                       <p className="text-[10px] text-slate-500 uppercase tracking-widest">Use este campo para ajustes manuais que não estão mapeados no dashboard.</p>
                       <textarea 
                          value={siteConfig.theme.custom_css || ''} 
                          onChange={e => handleUpdateConfig('theme', 'custom_css', e.target.value)}
                          placeholder="/* ex: .btn-soberano { background: gold; } */"
                          className="w-full bg-black border border-white/5 rounded-2xl p-6 text-xs text-green-500 font-mono h-64 focus:border-blue-600 outline-none transition-all"
                       />
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'marketplace' && (
              <div className="space-y-20">
                 <h2 className="text-6xl font-serif text-white italic tracking-tighter">Marketplace <span className="text-blue-600">Forge.</span></h2>
                 
                 <div className="space-y-12">
                   <h3 className="text-2xl font-bold text-white uppercase tracking-widest">1. Ativos Digitais</h3>
                   <AdminCrudSection 
                      tableName="products" 
                      title="Ativos Digitais" 
                      fields={[
                        { key: 'title', label: 'Título do Ativo', placeholder: 'ex: V8 Matrix Edition' }, 
                        { key: 'slug', label: 'Slug / URL', placeholder: 'ex: v8-matrix' }, 
                        { key: 'subtitle', label: 'Lead Curto (subtítulo)', type: 'textarea', placeholder: 'ex: A ferramenta mais potente do Brasil.' }, 
                        { key: 'description', label: 'Descrição Completa', type: 'textarea' }, 
                        { key: 'image_url', label: 'URL da Imagem Principal', placeholder: 'ex: https://i.imgur.com/logo.png' }, 
                        { key: 'pricing_type', label: 'Tipo (subscription/one_time)' }
                      ]} 
                      displayColumns={['title', 'slug']} 
                   />
                 </div>

                 <div className="h-px bg-white/5 my-20"></div>

                 <div className="space-y-12">
                   <h3 className="text-2xl font-bold text-white uppercase tracking-widest">2. Canvas Builder (Blocos da Página)</h3>
                   <AdminCrudSection 
                      tableName="product_content_blocks" 
                      title="Blocos de Conteúdo" 
                      fields={[
                        { key: 'product_id', label: 'UUID do Ativo Pai', placeholder: 'Copie do ID do produto' }, 
                        { key: 'block_type', label: 'Tipo do Bloco (hero/features/comparison/faq)', placeholder: 'ex: hero' }, 
                        { key: 'order', label: 'Ordem (1, 2, 3...)', type: 'number' },
                        { key: 'content', label: 'Configuração (JSON)', type: 'textarea', placeholder: 'ex: { "title": "...", "subtitle": "..." }' }
                      ]} 
                      displayColumns={['block_type', 'order']} 
                   />
                 </div>

                 <div className="h-px bg-white/5 my-20"></div>

                 <div className="space-y-12">
                   <h3 className="text-2xl font-bold text-white uppercase tracking-widest">3. Níveis de Poder (Planos)</h3>
                   <AdminCrudSection 
                      tableName="product_variants" 
                      title="Planos e Variantes" 
                      fields={[
                        { key: 'product_id', label: 'ID do Produto Pai (UUID)' }, 
                        { key: 'name', label: 'Nome do Plano', placeholder: 'ex: Plano Anual Soberano' }, 
                        { key: 'price', label: 'Preço Nominal (R$)', type: 'number' }, 
                        { key: 'interval', label: 'Intervalo (month/semester/year)' }, 
                        { key: 'order_index', label: 'Ordem', type: 'number' }
                      ]} 
                      displayColumns={['name', 'price']} 
                   />
                 </div>
              </div>
            )}

            {activeTab === 'editorial' && (
               <div className="space-y-20">
                  <h2 className="text-6xl font-serif text-white italic tracking-tighter">Editorial <span className="text-blue-600">Forge.</span></h2>
                  <AdminCrudSection tableName="insights" title="Insights & Artigos" fields={[{ key: 'title', label: 'Título da Edição', placeholder: 'ex: O Futuro da Estratégia' }, { key: 'category', label: 'Editoria', placeholder: 'ex: ADVISORY' }, { key: 'image_url', label: 'URL da Mídia Editorial', placeholder: 'ex: https://i.imgur.com/img.jpg' }, { key: 'excerpt', label: 'Lead Editorial', type: 'textarea' }, { key: 'content', label: 'Corpo do Artigo (HTML)', type: 'rich-text' }]} displayColumns={['title', 'category']} />
                  <div className="h-px bg-white/5 my-10"></div>
                  <AdminCrudSection tableName="metrics" title="Métricas de KPI" fields={[{ key: 'label', label: 'Rótulo do KPI', placeholder: 'ex: Clientes Satisfeitos' }, { key: 'value', label: 'Valor (ex: 25+)', placeholder: 'ex: 98%' }, { key: 'display_order', label: 'Ordem', type: 'number' }]} displayColumns={['label', 'value']} />
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
                    <div className="p-10 bg-slate-900/60 rounded-[3rem] border border-white/5 space-y-10 backdrop-blur-3xl">
                       <h3 className="text-xl font-bold text-white uppercase tracking-widest border-l-2 border-blue-600 pl-4">Visibilidade do Kernel</h3>
                       <div className="grid grid-cols-2 gap-6">
                          {Object.keys(siteConfig.visibility).map(key => (
                            <button key={key} onClick={() => handleUpdateConfig('visibility', key, !siteConfig.visibility[key])} className={`px-6 py-4 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border ${siteConfig.visibility[key] ? 'bg-blue-600 text-white border-blue-400' : 'bg-black text-slate-600 border-white/5'}`}>{key.replace('_', ' ')}: {siteConfig.visibility[key] ? 'ON' : 'OFF'}</button>
                          ))}
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
