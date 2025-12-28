
import React, { useState, useEffect } from 'react';
import { Profile, Order, UserProduct } from '../types';
import { fetchAllOrders, fetchSiteConfig, supabase, upsertItem } from '../services/supabaseService';
import AdminCrudSection from './AdminCrudSection';

type TabType = 'visual_dna' | 'editorial' | 'marketplace' | 'orders';

const ADMIN_VERSION = "v17.0-SOVEREIGN-MASTER";

interface AdminDashboardProps {
  onClose: () => void;
  profile: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [siteConfig, setSiteConfig] = useState(fetchSiteConfig());

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoadingOrders(true);
    const data = await fetchAllOrders();
    setOrders(data);
    setLoadingOrders(false);
  };

  const handleUpdateConfig = async (field: string, subfield: string, value: any) => {
    const newConfig = { ...siteConfig };
    (newConfig as any)[field][subfield] = value;
    setSiteConfig(newConfig);
    
    // Persistência local imediata para feedback visual
    localStorage.setItem('CT_ADMIN_CONFIG_OVERRIDE', JSON.stringify(newConfig));
    
    // Persistência em site_content (usando como store genérica para settings)
    await upsertItem('site_content', {
      page: 'config',
      key: `setting_${field}_${subfield}`,
      value: value,
      updated_at: new Date().toISOString()
    });
  };

  const approveOrder = async (order: Order) => {
    const clientEmail = (order as any).profiles?.email || 'Partner';
    if (!confirm(`Ativar protocolo para ${clientEmail}?`)) return;
    
    setProcessingId(order.id);
    try {
      const { error: orderError } = await supabase.from('orders').update({ status: 'approved', approved_by_admin: true }).eq('id', order.id);
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

      alert("PROTOCOLO ATIVADO COM SUCESSO");
      loadOrders();
    } catch (e: any) {
      alert(`Falha: ${e.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (!profile || profile.user_type !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-4 lg:p-12 overflow-hidden font-sans">
      <div className="bg-[#02050c] border border-white/10 w-full max-w-[1900px] h-full rounded-[4rem] overflow-hidden flex flex-col lg:flex-row shadow-2xl relative">
        
        <aside className="w-full lg:w-96 bg-black border-r border-white/5 p-12 flex flex-col gap-8 shrink-0 z-10">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-[1.8rem] flex items-center justify-center font-bold text-white text-3xl shadow-2xl">CT</div>
            <div className="flex flex-col">
              <span className="font-black text-[12px] uppercase tracking-[0.6em] text-white">COMMAND CENTER</span>
              <span className="text-[8px] uppercase tracking-[0.4em] text-blue-500 font-bold mt-1">{ADMIN_VERSION}</span>
            </div>
          </div>
          
          <nav className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar">
            <button onClick={() => setActiveTab('orders')} className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'orders' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-600 border-white/5 hover:bg-white/5'}`}>Sales Vault</button>
            <button onClick={() => setActiveTab('editorial')} className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'editorial' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-600 border-white/5 hover:bg-white/5'}`}>Editorial Forge</button>
            <button onClick={() => setActiveTab('marketplace')} className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'marketplace' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-600 border-white/5 hover:bg-white/5'}`}>Marketplace Editor</button>
            <button onClick={() => setActiveTab('visual_dna')} className={`px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-left transition-all border ${activeTab === 'visual_dna' ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-600 border-white/5 hover:bg-white/5'}`}>DNA Visual</button>
          </nav>
          
          <div className="pt-8 border-t border-white/5">
             <button onClick={onClose} className="w-full text-slate-700 hover:text-red-500 text-[11px] font-black uppercase tracking-[0.6em] transition-colors">Fechar Painel</button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-12 lg:p-24 bg-grid relative custom-scrollbar z-10">
          <div className="max-w-7xl mx-auto pb-40">
            {activeTab === 'orders' && (
              <div className="space-y-12">
                <h2 className="text-6xl font-serif text-white italic tracking-tighter">Sales <span className="text-blue-600">Vault.</span></h2>
                {loadingOrders ? (
                  <div className="py-20 text-center animate-pulse text-blue-500 uppercase tracking-[0.4em] text-[10px]">Sincronizando transações...</div>
                ) : (
                  <div className="grid gap-6">
                    {orders.length === 0 ? (
                      <div className="p-20 border border-dashed border-white/5 rounded-[3rem] text-center text-slate-700 uppercase tracking-widest text-xs">Nenhum pedido pendente no ledger.</div>
                    ) : orders.map(order => (
                      <div key={order.id} className="p-10 bg-slate-900/60 border border-white/5 rounded-[3rem] flex items-center justify-between group">
                        <div className="space-y-4">
                           <div className="flex gap-4 items-center">
                              <span className={`text-[8px] font-black px-4 py-1 rounded-full ${order.status === 'pending' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-500'}`}>{order.status.toUpperCase()}</span>
                              <span className="text-white font-serif italic text-xl">{(order as any).profiles?.full_name || (order as any).profiles?.email || 'Partner'}</span>
                           </div>
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest">Ativo: {order.product_id} // Ref: {order.id.slice(0,8)} // R$ {order.amount.toFixed(2)}</p>
                        </div>
                        {order.status === 'pending' && (
                          <button onClick={() => approveOrder(order)} disabled={processingId === order.id} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl">
                            {processingId === order.id ? 'PROCESSANDO...' : 'ATIVAR ACESSO'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'visual_dna' && (
              <div className="space-y-16">
                 <h2 className="text-6xl font-serif text-white italic tracking-tighter">DNA <span className="text-blue-600">Visual.</span></h2>
                 <div className="grid md:grid-cols-2 gap-12">
                    <div className="p-10 bg-slate-900/60 rounded-[3rem] border border-white/5 space-y-8 backdrop-blur-3xl">
                       <h3 className="text-xl font-bold text-white uppercase tracking-widest border-l-2 border-blue-600 pl-4">Cores de Comando</h3>
                       <div className="space-y-6">
                          <div>
                             <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2">Primary Accent (Neon)</label>
                             <input type="color" value={siteConfig.theme.primary} onChange={e => handleUpdateConfig('theme', 'primary', e.target.value)} className="w-full h-16 bg-black rounded-2xl border-none cursor-pointer p-1" />
                          </div>
                          <div>
                             <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2">Background Core</label>
                             <input type="color" value={siteConfig.theme.bg_dark} onChange={e => handleUpdateConfig('theme', 'bg_dark', e.target.value)} className="w-full h-16 bg-black rounded-2xl border-none cursor-pointer p-1" />
                          </div>
                       </div>
                    </div>
                    <div className="p-10 bg-slate-900/60 rounded-[3rem] border border-white/5 space-y-8 backdrop-blur-3xl">
                       <h3 className="text-xl font-bold text-white uppercase tracking-widest border-l-2 border-blue-600 pl-4">Tipografia Editorial</h3>
                       <div className="space-y-6">
                          <div>
                             <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2">H1 Hero Scale</label>
                             <input type="text" value={siteConfig.typography.h1_size} onChange={e => handleUpdateConfig('typography', 'h1_size', e.target.value)} className="w-full bg-black text-white px-6 py-5 rounded-2xl border border-white/5 focus:border-blue-600 outline-none" />
                          </div>
                          <div>
                             <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2">Body Text Fluidity</label>
                             <input type="text" value={siteConfig.typography.body_size} onChange={e => handleUpdateConfig('typography', 'body_size', e.target.value)} className="w-full bg-black text-white px-6 py-5 rounded-2xl border border-white/5 focus:border-blue-600 outline-none" />
                          </div>
                       </div>
                    </div>
                 </div>
                 <div className="p-10 bg-blue-600/10 border border-blue-600/30 rounded-[2.5rem] text-center">
                    <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.6em]">DNA Visual sincronizado via Realtime Sync Kernel v17.0</p>
                 </div>
              </div>
            )}

            {activeTab === 'marketplace' && (
              <div className="space-y-16">
                 <h2 className="text-6xl font-serif text-white italic tracking-tighter">Marketplace <span className="text-blue-600">Editor.</span></h2>
                 <AdminCrudSection 
                    tableName="products" 
                    title="Ativos Digitais" 
                    fields={[
                      { key: 'title', label: 'Nome do Ativo' },
                      { key: 'slug', label: 'Slug (URL)' },
                      { key: 'subtitle', label: 'Chamada Curta', type: 'textarea' },
                      { key: 'description', label: 'Descrição Detalhada', type: 'textarea' },
                      { key: 'image_url', label: 'Capa Ativo URL' },
                      { key: 'pricing_type', label: 'Modelo de Preço (subscription/one_time)' }
                    ]} 
                    displayColumns={['title', 'slug']} 
                 />
                 <div className="h-px bg-white/5 my-24"></div>
                 <AdminCrudSection 
                    tableName="product_variants" 
                    title="Planos e Variantes" 
                    fields={[
                      { key: 'product_id', label: 'Referência do Ativo (UUID)' },
                      { key: 'name', label: 'Nome do Nível/Plano' },
                      { key: 'price', label: 'Valor (R$)', type: 'number' },
                      { key: 'interval', label: 'Recorrência (month/semester/year)' },
                      { key: 'order_index', label: 'Ordem de Exibição', type: 'number' }
                    ]} 
                    displayColumns={['name', 'price']} 
                 />
              </div>
            )}

            {activeTab === 'editorial' && (
               <div className="space-y-16">
                  <h2 className="text-6xl font-serif text-white italic tracking-tighter">Editorial <span className="text-blue-600">Forge.</span></h2>
                  <AdminCrudSection 
                    tableName="insights" 
                    title="Executive Insights" 
                    fields={[
                      { key: 'title', label: 'Manchete' },
                      { key: 'category', label: 'Editoria' },
                      { key: 'image_url', label: 'Mídia Principal URL' },
                      { key: 'excerpt', label: 'Lead (Resumo)', type: 'textarea' },
                      { key: 'content', label: 'Corpo Editorial (HTML)', type: 'rich-text' },
                      { key: 'is_active', label: 'Visibilidade (true/false)' }
                    ]} 
                    displayColumns={['title', 'category']} 
                 />
                 <div className="h-px bg-white/5 my-24"></div>
                 <AdminCrudSection 
                    tableName="metrics" 
                    title="Performance Indicators" 
                    fields={[
                      { key: 'label', label: 'Kpi Label' },
                      { key: 'value', label: 'Valor Impacto' },
                      { key: 'display_order', label: 'Ranking Ordem', type: 'number' }
                    ]} 
                    displayColumns={['label', 'value']} 
                 />
               </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
